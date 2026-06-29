import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Footer from "@/src/components/Footer";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Section = { heading: string; body: string };
type Blueprint = {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
  action_items: string[];
  classification: string;
  confidence: number;
  pinned: boolean;
  created_at: string;
  source_thought_ids: string[];
};

const CLASS_COLOR: Record<string, string> = {
  OMEGA: "#D9534F",
  CONFIDENTIAL: "#C5A559",
  INTERNAL: "#9DB1C9",
  PUBLIC: "#3FB68E",
};

export default function BlueprintDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useApp();
  const [bp, setBp] = useState<Blueprint | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await api.get<Blueprint>(`/blueprints/item/${id}`);
    setBp(res);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePin() {
    if (!bp) return;
    await api.post(`/blueprints/item/${bp.id}/pin`);
    await load();
  }

  async function del() {
    if (!bp) return;
    Alert.alert("Delete blueprint?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.del(`/blueprints/item/${bp.id}`);
          router.back();
        },
      },
    ]);
  }

  if (!bp) {
    return (
      <SafeAreaView style={styles.shell}>
        <Text style={styles.empty}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const color = CLASS_COLOR[bp.classification] ?? COLORS.textTertiary;

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          <Text style={styles.backTxt}>BACK</Text>
        </Pressable>

        <View style={[styles.classPill, { borderColor: color }]}>
          <Text style={[styles.classTxt, { color }]}>{bp.classification}</Text>
        </View>

        <Text style={styles.title}>{bp.title}</Text>
        <Text style={styles.meta}>
          {Math.round(bp.confidence * 100)}% confidence •{" "}
          {new Date(bp.created_at).toLocaleString()}
        </Text>

        <Text style={styles.sectionLabel}>{t("bpSummary", lang)}</Text>
        <Text style={styles.summary}>{bp.summary}</Text>

        {bp.sections.map((s, i) => (
          <View key={i} style={styles.secCard}>
            <Text style={styles.secHead}>{s.heading}</Text>
            <Text style={styles.secBody}>{s.body}</Text>
          </View>
        ))}

        {bp.action_items.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t("bpActionItems", lang)}</Text>
            {bp.action_items.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <Text style={styles.actionNum}>{i + 1}</Text>
                <Text style={styles.actionTxt}>{a}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.btnRow}>
          <Pressable onPress={togglePin} style={styles.bigBtn} testID="bp-detail-pin">
            <Ionicons name={bp.pinned ? "bookmark" : "bookmark-outline"} size={16} color={COLORS.primary} />
            <Text style={styles.bigBtnTxt}>
              {bp.pinned ? t("bpUnpin", lang) : t("bpPin", lang)}
            </Text>
          </Pressable>
          <Pressable onPress={del} style={[styles.bigBtn, { borderColor: COLORS.danger }]} testID="bp-detail-delete">
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.bigBtnTxt, { color: COLORS.danger }]}>{t("bpDelete", lang)}</Text>
          </Pressable>
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  back: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.md },
  backTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  classPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  classTxt: {
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  meta: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    marginTop: 4,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  summary: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  secCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  secHead: {
    color: COLORS.primary,
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "700",
  },
  secBody: {
    color: COLORS.textPrimary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 20,
  },
  actionRow: { flexDirection: "row", gap: SPACING.sm, marginTop: 6 },
  actionNum: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontWeight: "700",
    width: 18,
  },
  actionTxt: { color: COLORS.textPrimary, fontSize: 13, flex: 1 },
  btnRow: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.xl },
  bigBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  bigBtnTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  empty: { color: COLORS.textSecondary, padding: SPACING.lg },
});
