/**
 * Biometric Gate
 *
 * Wraps expo-local-authentication. On iOS this resolves to Face ID / Touch ID
 * via the Secure Enclave; on Android to the BiometricPrompt API backed by the
 * StrongBox / TEE. Falls back to device passcode when biometrics are absent.
 *
 * On web preview (Expo Go in browser) local-authentication is unavailable —
 * the helpers degrade gracefully so the bundle still loads.
 */
import * as LocalAuth from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
  types: string[];
  reason?: string;
};

export async function biometricStatus(): Promise<BiometricStatus> {
  if (Platform.OS === "web") {
    return {
      available: false,
      enrolled: false,
      types: [],
      reason: "Biometrics unavailable on web preview",
    };
  }
  try {
    const hasHw = await LocalAuth.hasHardwareAsync();
    const enrolled = await LocalAuth.isEnrolledAsync();
    const supported = await LocalAuth.supportedAuthenticationTypesAsync();
    const names = supported.map((t) => {
      if (t === LocalAuth.AuthenticationType.FACIAL_RECOGNITION) return "FACE_ID";
      if (t === LocalAuth.AuthenticationType.FINGERPRINT) return "FINGERPRINT";
      if (t === LocalAuth.AuthenticationType.IRIS) return "IRIS";
      return String(t);
    });
    return {
      available: hasHw,
      enrolled,
      types: names,
      reason: hasHw
        ? enrolled
          ? undefined
          : "No biometrics enrolled on this device"
        : "Device does not support biometrics",
    };
  } catch (e) {
    return {
      available: false,
      enrolled: false,
      types: [],
      reason: `biometric probe failed: ${String(e)}`,
    };
  }
}

export type BiometricResult =
  | { ok: true }
  | { ok: false; code: "user_cancel" | "lockout" | "unavailable" | "fail"; message: string };

export async function requireBiometric(
  prompt = "Unlock Academic Vault",
): Promise<BiometricResult> {
  if (Platform.OS === "web") {
    return {
      ok: false,
      code: "unavailable",
      message: "Biometric unlock is unavailable on the web preview. Run a native build.",
    };
  }
  try {
    const status = await biometricStatus();
    if (!status.available) {
      return { ok: false, code: "unavailable", message: status.reason ?? "Unavailable" };
    }
    const res = await LocalAuth.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
      fallbackLabel: "Use passcode",
    });
    if (res.success) return { ok: true };
    if (res.error === "user_cancel" || res.error === "system_cancel") {
      return { ok: false, code: "user_cancel", message: "Cancelled" };
    }
    if (res.error === "lockout" || res.error === "lockout_permanent") {
      return { ok: false, code: "lockout", message: "Too many attempts — try again later" };
    }
    return { ok: false, code: "fail", message: res.error ?? "Authentication failed" };
  } catch (e) {
    return { ok: false, code: "fail", message: String(e) };
  }
}
