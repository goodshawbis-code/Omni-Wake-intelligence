import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import TacticalCard from "@/src/components/TacticalCard";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

const GOLD_SEAL =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/3a7a5fe1dc994fc9d457cebe840cc70f7999afd619f94d15e916df116376a787.png";

type Stage = "form" | "verifying" | "done";

export default function IDMeBridge() {
  const { user, lang, setUser } = useApp();
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function submit() {
    if (!user) return;
    if (!name.trim() || !email.trim()) return;
    setStage("verifying");
    const res = await api.post<{ verified_at: string; user: any }>(
      "/idme/verify",
      {
        user_id: user.user_id,
        full_name: name.trim(),
        student_email: email.trim(),
      },
    );
    if (res?.user) {
      setUser(res.user);
      setStage("done");
    } else {
      setStage("form");
    }
  }

  return (
    <ScreenShell tacticalBg testID="idme-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              testID="idme-back"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>ID.ME BRIDGE</Text>
            <LangToggle compact />
          </View>

          {stage === "form" && (
            <>
              <View style={styles.intro}>
                <Image source={{ uri: GOLD_SEAL }} style={styles.seal} />
                <Text style={styles.tag}>⬢ OIDC HANDSHAKE • TIER-1</Text>
                <Text style={styles.title}>{t("idMeTitle", lang)}</Text>
                <Text style={styles.body}>{t("idMeSubtitle", lang)}</Text>
              </View>

              <TacticalCard style={{ gap: SPACING.md }}>
                <Field
                  label={t("legalName", lang)}
                  value={name}
                  onChange={setName}
                  placeholder="Marcus T. Johnson"
                  testID="idme-name"
                />
                <Field
                  label={t("studentEmail", lang)}
                  value={email}
                  onChange={setEmail}
                  placeholder="m.johnson@uapb.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="idme-email"
                />
                <Btn
                  label={t("beginVerification", lang)}
                  onPress={submit}
                  disabled={!name.trim() || !email.trim()}
                  testID="idme-submit"
                />
              </TacticalCard>

              <View style={styles.flow}>
                <FlowStep
                  n="01"
                  label="OIDC redirect to ID.me"
                  state="complete"
                />
                <FlowStep
                  n="02"
                  label="Identity proofing handshake"
                  state="active"
                />
                <FlowStep
                  n="03"
                  label="Issue Verified Student claim"
                  state="pending"
                />
              </View>
            </>
          )}

          {stage === "verifying" && (
            <View style={styles.verifying}>
              <View style={styles.scanRing}>
                <Image source={{ uri: GOLD_SEAL }} style={styles.sealLarge} />
              </View>
              <Text style={styles.verifyingText}>
                {t("verifying", lang).toUpperCase()}
              </Text>
              <Text style={styles.verifyingSub}>
                CONTACTING ID.ME • EXCHANGING JWT • VALIDATING JWKS
              </Text>
            </View>
          )}

          {stage === "done" && (
            <View style={styles.done}>
              <View style={styles.checkRing}>
                <Ionicons
                  name="shield-checkmark"
                  size={72}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.tag}>⬢ TIER-1 VERIFIED</Text>
              <Text style={styles.title}>{t("verifiedTitle", lang)}</Text>
              <Text style={styles.body}>{t("verifiedBody", lang)}</Text>
              <View style={styles.verifiedCard}>
                <Text style={styles.verifiedLabel}>VERIFIED IDENTITY</Text>
                <Text style={styles.verifiedName}>{name.toUpperCase()}</Text>
                <Text style={styles.verifiedEmail}>{email}</Text>
              </View>
              <Btn
                label={t("enterCommandCenter", lang)}
                onPress={() => router.replace("/(tabs)")}
                testID="idme-enter-center"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  autoCapitalize,
  testID,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  testID?: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        style={styles.input}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        testID={testID}
      />
    </View>
  );
}

function FlowStep({
  n,
  label,
  state,
}: {
  n: string;
  label: string;
  state: "complete" | "active" | "pending";
}) {
  return (
    <View style={styles.flowRow}>
      <View
        style={[
          styles.flowDot,
          state === "complete" && { backgroundColor: COLORS.primary },
          state === "active" && {
            borderColor: COLORS.primary,
            backgroundColor: "transparent",
          },
        ]}
      />
      <Text style={styles.flowN}>{n}</Text>
      <Text
        style={[
          styles.flowLabel,
          state === "pending" && { color: COLORS.textTertiary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontWeight: "700",
    letterSpacing: 2.5,
    fontSize: 12,
  },
  intro: { alignItems: "center", gap: SPACING.sm, marginTop: SPACING.md },
  seal: { width: 88, height: 88, resizeMode: "contain" },
  sealLarge: { width: 110, height: 110, resizeMode: "contain" },
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: "Courier",
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: "700",
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontFamily: "Courier",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  flow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
  },
  flowRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  flowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.textTertiary,
    backgroundColor: "transparent",
  },
  flowN: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    width: 22,
  },
  flowLabel: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1,
  },
  verifying: {
    alignItems: "center",
    gap: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  scanRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  verifyingText: {
    color: COLORS.primary,
    fontFamily: "Courier",
    letterSpacing: 3,
    fontSize: 14,
    fontWeight: "700",
  },
  verifyingSub: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
    textAlign: "center",
  },
  done: { gap: SPACING.lg, alignItems: "center", paddingTop: SPACING.lg },
  checkRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  verifiedCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: 4,
    alignItems: "center",
  },
  verifiedLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 3,
  },
  verifiedName: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 18,
    fontWeight: "700",
  },
  verifiedEmail: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 11,
  },
});
