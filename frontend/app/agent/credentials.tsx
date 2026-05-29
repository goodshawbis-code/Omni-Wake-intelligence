import { useState } from "react";
import {
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

export default function Credentials() {
  const { portal } = useLocalSearchParams<{ portal: string }>();
  const { user, lang } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user || !portal) return;
    if (!username.trim() || !password.trim()) return;
    setSubmitting(true);
    const res = await api.post<{
      session_id: string;
      mfa_method: string;
      portal_name: string;
      portal_short: string;
    }>("/agent/start", {
      user_id: user.user_id,
      portal,
      username: username.trim(),
      password,
    });
    setSubmitting(false);
    if (res) {
      router.push(`/agent/mfa?session=${res.session_id}&method=${res.mfa_method}&portal=${encodeURIComponent(res.portal_short)}`);
    }
  }

  const portalShort = (portal || "").toUpperCase();

  return (
    <ScreenShell tacticalBg testID="credentials-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} testID="creds-back">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>{portalShort} • LOGIN</Text>
            <LangToggle compact />
          </View>

          <View style={styles.intro}>
            <Text style={styles.tag}>⬢ STEP 02 / 04</Text>
            <Text style={styles.title}>{t("portalCreds", lang)}</Text>
            <Text style={styles.body}>{t("credsNotice", lang)}</Text>
          </View>

          <TacticalCard style={{ gap: SPACING.md }}>
            <View>
              <Text style={styles.label}>{t("username", lang).toUpperCase()}</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="m.johnson"
                placeholderTextColor={COLORS.textTertiary}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                testID="agent-username"
              />
            </View>
            <View>
              <Text style={styles.label}>{t("password", lang).toUpperCase()}</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••"
                  placeholderTextColor={COLORS.textTertiary}
                  secureTextEntry={!showPwd}
                  style={[styles.input, { flex: 1 }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="agent-password"
                />
                <Pressable
                  onPress={() => setShowPwd((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  testID="agent-show-pwd"
                >
                  <Ionicons
                    name={showPwd ? "eye-off" : "eye"}
                    size={18}
                    color={COLORS.primary}
                  />
                </Pressable>
              </View>
            </View>
            <Btn
              label={t("deployAgent", lang)}
              onPress={submit}
              loading={submitting}
              disabled={!username.trim() || !password.trim()}
              testID="deploy-agent-btn"
            />
          </TacticalCard>

          <View style={styles.terminal}>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>$ </Text>
              <Text style={styles.term2}>oct-agent --portal {portalShort.toLowerCase()} --secure-channel ON</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>TLS 1.3 ESTABLISHED</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>AWAITING OPERATOR CREDENTIALS…</Text>
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
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
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
  },
  pwdRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  eyeBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  terminal: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: 4,
    marginTop: SPACING.md,
  },
  terminalLine: { fontFamily: "Courier", fontSize: 11 },
  term1: { color: COLORS.primary, fontWeight: "700" },
  term2: { color: COLORS.textPrimary },
  term3: { color: COLORS.success },
});
