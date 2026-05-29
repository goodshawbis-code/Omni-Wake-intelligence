import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

export default function MfaScreen() {
  const { session, method, portal } = useLocalSearchParams<{
    session: string;
    method: string;
    portal: string;
  }>();
  const { lang } = useApp();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDuo = method === "duo_push";

  // Pulsing animation for Duo scan ring
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  async function submit() {
    if (!session) return;
    setSubmitting(true);
    const ok = await api.post<{ status: string }>("/agent/mfa", {
      session_id: session,
      method: method,
      code: isDuo ? undefined : code,
    });
    setSubmitting(false);
    if (ok?.status === "ok") {
      router.replace(`/agent/progress?session=${session}&portal=${encodeURIComponent(portal || "")}`);
    }
  }

  return (
    <ScreenShell tacticalBg testID="mfa-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              testID="mfa-back"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>{portal} • MFA</Text>
            <LangToggle compact />
          </View>

          <View style={styles.intro}>
            <Text style={styles.tag}>⬢ STEP 03 / 04 • MFA GATE</Text>
            <Text style={styles.title}>
              {isDuo ? t("mfaDuoTitle", lang) : t("mfaSmsTitle", lang)}
            </Text>
            <Text style={styles.body}>
              {isDuo ? t("mfaDuoBody", lang) : t("mfaSmsBody", lang)}
            </Text>
          </View>

          {isDuo ? (
            <View style={styles.duoBox}>
              <View style={styles.duoRingWrap}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { transform: [{ scale: ringScale }], opacity: ringOpacity },
                  ]}
                />
                <View style={styles.duoRing}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={56}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <Text style={styles.duoLabel}>WAITING FOR DUO APPROVAL</Text>
              <Text style={styles.duoTimer}>~ 30 SECONDS REMAINING</Text>
              <Btn
                label={t("iApproved", lang)}
                onPress={submit}
                loading={submitting}
                testID="duo-approve-btn"
              />
            </View>
          ) : (
            <TacticalCard style={{ gap: SPACING.md }}>
              <Text style={styles.label}>{t("mfaCode", lang).toUpperCase()}</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="• • • • • •"
                placeholderTextColor={COLORS.textTertiary}
                style={styles.codeInput}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
                testID="sms-code-input"
              />
              <Btn
                label={t("submitCode", lang)}
                onPress={submit}
                disabled={code.length < 4}
                loading={submitting}
                testID="sms-submit-btn"
              />
            </TacticalCard>
          )}

          <View style={styles.terminal}>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>CREDS POSTED — 200 OK</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>MFA CHALLENGE: {method?.toUpperCase()}</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term2}>AGENT PAUSED. AWAITING OPERATOR.</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  intro: { gap: SPACING.sm, marginVertical: SPACING.md },
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
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  duoBox: {
    alignItems: "center",
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  duoRingWrap: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  duoRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  duoLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 12,
  },
  duoTimer: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: -SPACING.sm,
  },
  label: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  codeInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    color: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 20,
    fontFamily: "Courier",
    fontSize: 28,
    letterSpacing: 12,
    textAlign: "center",
    fontWeight: "700",
  },
  terminal: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: 4,
  },
  terminalLine: { fontFamily: "Courier", fontSize: 11 },
  term1: { color: COLORS.primary, fontWeight: "700" },
  term2: { color: COLORS.textPrimary },
  term3: { color: COLORS.success },
});
