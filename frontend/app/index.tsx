import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { api } from "@/src/api/client";
import { Operator } from "@/src/context/AppContext";

export default function Onboarding() {
  const { operator, lang, setOperator, loading } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Skip loading branch entirely \u2014 render the form immediately, bootstrap runs in background.
  if (operator?.ingress_verified) {
    setTimeout(() => router.replace("/(tabs)/capture"), 50);
  }

  async function authorise() {
    if (!operator) return;
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Missing fields", "Provide your full name and enterprise email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<Operator>("/ingress/verify", {
        operator_id: operator.operator_id,
        full_name: fullName.trim(),
        email: email.trim(),
      });
      if (res) {
        setOperator(res);
        router.replace("/(tabs)/capture");
      }
    } catch (e) {
      Alert.alert("Ingress failed", String(e).slice(0, 200));
    } finally {
      setSubmitting(false);
    }
  }

  function skip() {
    router.replace("/(tabs)/capture");
  }

  return (
    <SafeAreaView style={styles.shell}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.crestRow}>
              <Ionicons name="shield-half" size={28} color={COLORS.primary} />
              <Text style={styles.crest}>OMNI WAKE INTELLIGENCE</Text>
            </View>
            <LangToggle />
          </View>

          <Text style={styles.tag}>{t("onbTag", lang)}</Text>
          <Text style={styles.title}>{t("onbWelcome", lang)}</Text>
          <Text style={styles.subtitle}>{t("appTagline", lang)}</Text>
          <Text style={styles.body}>{t("onbBody", lang)}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>{t("onbFullName", lang)}</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="Operator Hatchett"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
              testID="onb-name"
            />
            <Text style={[styles.label, { marginTop: SPACING.md }]}>{t("onbEmail", lang)}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="operator@enterprise.com"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="onb-email"
            />
            <View style={{ marginTop: SPACING.lg }}>
              <Btn
                label={submitting ? "…" : t("onbProceed", lang)}
                onPress={authorise}
                disabled={submitting}
                testID="onb-authorise"
              />
            </View>
            <View style={{ marginTop: SPACING.md }}>
              <Btn
                label={t("onbSkip", lang)}
                onPress={skip}
                variant="secondary"
                testID="onb-skip"
              />
            </View>
          </View>

          <Text style={styles.foot}>{t("ownerLine", lang)}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  crestRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  crest: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700",
  },
  tag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },
  subtitle: { color: COLORS.primary, fontSize: 13, marginTop: 4 },
  body: { color: COLORS.textSecondary, fontSize: 13, marginTop: SPACING.md },
  card: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  label: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
  },
  input: {
    marginTop: 6,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
  },
  foot: {
    color: COLORS.textTertiary,
    fontSize: 10,
    textAlign: "center",
    marginTop: SPACING.xxl,
    fontFamily: "Courier",
    letterSpacing: 1.5,
  },
});
