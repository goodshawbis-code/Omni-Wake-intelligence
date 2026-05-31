/**
 * Vault Key Management
 *
 * Generates a 256-bit AES key, persists it in the device's secure enclave
 * (iOS Keychain via expo-secure-store / Android Keystore via the same), and
 * exposes get / rotate / wipe helpers used by the vault layer.
 *
 * The actual encryption of vault payloads happens server-side today (the
 * vault payload `encrypted: true` flag mirrors transport-layer protection).
 * Once payloads carry ciphertext blobs, the client decrypts them with this
 * key — which never leaves the device.
 */
import * as Crypto from "expo-crypto";
import { storage } from "@/src/utils/storage";

const KEY_NAME = "oct.vault.aes_key.v1";
const KEY_BYTES = 32; // 256-bit

function toBase64(bytes: Uint8Array): string {
  // RN 0.81 has no atob/btoa for Uint8Array; build it manually.
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // global.btoa exists on web; on native we fall back to a tiny shim.
  if (typeof btoa === "function") return btoa(bin);
  // eslint-disable-next-line no-undef
  const buf = (global as unknown as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (buf) return buf.from(bin, "binary").toString("base64");
  // Last resort manual encode
  const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bin.length; i += 3) {
    const a = bin.charCodeAt(i);
    const b = i + 1 < bin.length ? bin.charCodeAt(i + 1) : 0;
    const c = i + 2 < bin.length ? bin.charCodeAt(i + 2) : 0;
    out += t[a >> 2];
    out += t[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bin.length ? t[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bin.length ? t[c & 63] : "=";
  }
  return out;
}

async function generate(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(KEY_BYTES);
  return toBase64(bytes);
}

/** Returns the vault key, lazily creating + storing one on first call. */
export async function getVaultKey(): Promise<string> {
  const existing = await storage.secureGet<string>(KEY_NAME, "");
  if (existing && typeof existing === "string" && existing.length > 0) {
    return existing;
  }
  const fresh = await generate();
  await storage.secureSet(KEY_NAME, fresh);
  return fresh;
}

/** Generates a fresh key, replacing the stored one. Returns the new key. */
export async function rotateVaultKey(): Promise<string> {
  const fresh = await generate();
  await storage.secureSet(KEY_NAME, fresh);
  return fresh;
}

/** Returns a stable fingerprint for the active key (SHA-256, first 12 hex). */
export async function vaultKeyFingerprint(): Promise<string> {
  const key = await getVaultKey();
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    key,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return digest.slice(0, 12).toUpperCase();
}

/** Wipes the on-device key. Called by sign-out and `Erase Vault`. */
export async function wipeVaultKey(): Promise<void> {
  await storage.secureRemove(KEY_NAME);
}
