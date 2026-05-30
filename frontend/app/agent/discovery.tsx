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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

export default function DiscoveryScreen() {
  const { user, lang } = useApp();
  const [school, setSchool] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) return;
    if (!school.trim() || !username.trim() || !password.trim()) return;
    setSubmitting(true);
    const res = await api.post<{
      session_id: string;
      mfa_method: string;
      portal_short: string;
    }>("/agent/discovery/start", {
      user_id: user.user_id,
      school_name: school.trim(),
      portal_url: portalUrl.trim() || undefined,
      username: username.trim(),
      password,
    });
    setSubmitting(false);
    if (res) {
      router.replace(
        `/agent/mfa?session=${res.session_id}&method=${res.mfa_method}&portal=${encodeURIComponent(res.portal_short)}`,
      );
    }
  }

  return (
    <ScreenShell tacticalBg testID="discovery-screen">
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
              testID="discovery-back"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>AI DISCOVERY</Text>
            <LangToggle compact />
          </View>

          <View style={styles.intro}>
            <View style={styles.discIconWrap}>
              <Ionicons
                name="planet-outline"
                size={56}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.tag}>⬢ EXPLORATION MODE • UNMAPPED</Text>
            <Text style={styles.title}>{t("discoveryTitle", lang)}</Text>
            <Text style={styles.body}>{t("discoverySub", lang)}</Text>
          </View>

          <TacticalCard style={{ gap: SPACING.md }}>
            <Field
              label={t("schoolName", lang)}
              value={school}
              onChange={setSchool}
              placeholder={t("schoolNamePh", lang)}
              testID="discovery-school"
            />
            <Field
              label={t("portalUrlOptional", lang)}
              value={portalUrl}
              onChange={setPortalUrl}
              placeholder="https://my.school.edu"
              testID="discovery-url"
              keyboardType="url"
            />
            <Field
              label={t("username", lang)}
              value={username}
              onChange={setUsername}
              placeholder="username"
              testID="discovery-username"
              autoCapitalize="none"
            />
            <Field
              label={t("password", lang)}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              testID="discovery-password"
              secureTextEntry
              autoCapitalize="none"
            />
            <Btn
              label={t("beginDiscovery", lang)}
              onPress={submit}
              loading={submitting}
              disabled={!school.trim() || !username.trim() || !password.trim()}
              testID="begin-discovery-btn"
            />
          </TacticalCard>

          <View style={styles.terminal}>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>$ </Text>
              <Text style={styles.term2}>oct-agent --mode discover --llm-rank ON</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>SSO LANDING RESOLVED</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>BUILDING LINK GRAPH…</Text>
            </Text>
            <Text style={styles.terminalLine}>
              <Text style={styles.term1}>{">"} </Text>
              <Text style={styles.term3}>RANKING TRANSCRIPT CANDIDATES</Text>
            </Text>
          </View>
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
  testID,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: "default" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  secureTextEntry?: boolean;
}) {
  return (
    <View>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        style={styles.input}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        secureTextEntry={!!secureTextEntry}
        testID={testID}
      />
    </View>
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
  intro: { alignItems: "center", gap: SPACING.sm, marginVertical: SPACING.md },
  discIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
    alignItems: "center",
    justifyContent: "center",
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
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
