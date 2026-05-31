import { ReactNode, useEffect, useState, useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Btn from "@/src/components/Btn";
import TacticalCard from "@/src/components/TacticalCard";
import { COLORS, SPACING } from "@/src/theme/colors";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import {
  biometricStatus,
  requireBiometric,
  BiometricStatus,
} from "@/src/security/biometric";

/**
 * Gates a screen behind a biometric prompt when the user has enabled
 * Biometric Lock in Settings. Falls through when:
 *  - the user hasn't enabled the lock, OR
 *  - the device has no biometrics (web preview, simulators without enrolment)
 *
 * The full lockdown UX renders only when biometrics ARE available — otherwise
 * we show a non-blocking warning chip so testing can proceed.
 */
export default function BiometricGate({ children }: { children: ReactNode }) {
  const { user, lang } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const probe = useCallback(async () => {
    const s = await biometricStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  const lockEnabled = !!user?.biometric_lock;

  const unlock = useCallback(async () => {
    setError(null);
    setTried(true);
    const res = await requireBiometric(t("vaultBioPrompt", lang));
    if (res.ok) {
      setUnlocked(true);
    } else {
      setError(res.message);
    }
  }, [lang]);

  // Auto-prompt on first mount when the gate is active.
  useEffect(() => {
    if (!lockEnabled) return;
    if (!status) return;
    if (!status.available || !status.enrolled) return;
    if (unlocked || tried) return;
    unlock();
  }, [lockEnabled, status, unlocked, tried, unlock]);

  // No lock → just render the screen.
  if (!lockEnabled) return <>{children}</>;
  // Lock enabled but device can't biometric (web / sim) → render with banner.
  if (status && (!status.available || !status.enrolled)) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.banner} testID="biometric-unavailable-banner">
          <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
          <Text style={styles.bannerTxt}>
            {Platform.OS === "web"
              ? t("vaultBioWebFallback", lang)
              : t("vaultBioUnavailable", lang)}
          </Text>
        </View>
        {children}
      </View>
    );
  }
  if (unlocked) return <>{children}</>;

  // Locked state UI
  return (
    <View style={styles.lockShell} testID="biometric-lock-screen">
      <TacticalCard style={styles.lockCard}>
        <View style={styles.lockIconWrap}>
          <Ionicons
            name={
              status?.types.includes("FACE_ID")
                ? "scan-outline"
                : "finger-print"
            }
            size={56}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.tag}>⬢ {t("vaultBioTag", lang)}</Text>
        <Text style={styles.title}>{t("vaultBioTitle", lang)}</Text>
        <Text style={styles.body}>{t("vaultBioBody", lang)}</Text>
        {status?.types.length ? (
          <Text style={styles.method}>
            {t("vaultBioMethod", lang)}: {status.types.join(" • ")}
          </Text>
        ) : null}
        {error && (
          <Text style={styles.error} testID="biometric-error">
            {error}
          </Text>
        )}
        <View style={{ height: SPACING.md }} />
        <Btn
          label={t("vaultBioUnlock", lang)}
          onPress={unlock}
          testID="biometric-unlock-btn"
        />
      </TacticalCard>
    </View>
  );
}

const styles = StyleSheet.create({
  lockShell: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  lockCard: {
    width: "100%",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  lockIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  tag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  method: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  error: {
    color: COLORS.danger,
    fontFamily: "Courier",
    fontSize: 11,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(234,179,8,0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(234,179,8,0.35)",
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  bannerTxt: {
    color: COLORS.warning,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    flex: 1,
  },
});
