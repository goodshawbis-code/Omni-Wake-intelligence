import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Btn from "@/src/components/Btn";
import Footer from "@/src/components/Footer";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Thought = {
  id: string;
  title: string;
  content: string;
  capture_mode: string;
  tags: string[];
  created_at: string;
  blueprint_id?: string | null;
};

type Blueprint = {
  id: string;
  title: string;
  summary: string;
  classification: string;
  confidence: number;
  pinned: boolean;
  created_at: string;
  action_items: string[];
};

const CLASS_COLOR: Record<string, string> = {
  OMEGA: "#D9534F",
  CONFIDENTIAL: "#C5A559",
  INTERNAL: "#9DB1C9",
  PUBLIC: "#3FB68E",
};

export default function Blueprints() {
  const { operator, lang } = useApp();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [synth, setSynth] = useState(false);
  const [engine, setEngine] = useState<"oracle" | "gemini" | "dual">("oracle");

  const load = useCallback(async () => {
    if (!operator) return;
    const [tRes, bRes] = await Promise.all([
      api.get<{ items: Thought[] }>(`/thoughts/${operator.operator_id}`),
      api.get<{ items: Blueprint[] }>(`/blueprints/${operator.operator_id}`),
    ]);
    setThoughts(tRes?.items ?? []);
    setBlueprints(bRes?.items ?? []);
  }, [operator]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 12) next.add(id);
      return next;
    });
  }

  async function synthesise() {
    if (!operator || selected.size === 0) return;
    setSynth(true);
    try {
      const path =
        engine === "gemini"
          ? "/blueprints/synthesise-gemini"
          : engine === "dual"
            ? "/blueprints/synthesise-dual"
            : "/blueprints/synthesise";
      const res = await api.post<Blueprint | { oracle: Blueprint; gemini: Blueprint }>(
        path,
        { operator_id: operator.operator_id, thought_ids: Array.from(selected) },
      );
      if (res) {
        setSelected(new Set());
        await load();
        if (engine === "dual" && "oracle" in res) {
          // Land on the Oracle blueprint detail; the Gemini one is also persisted in the gallery.
          router.push(`/blueprint/${res.oracle.id}`);
        } else if (res && "id" in res) {
          router.push(`/blueprint/${res.id}`);
        }
      }
    } catch (e) {
      Alert.alert("Synthesis failed", String(e).slice(0, 200));
    } finally {
      setSynth(false);
    }
  }

  async function togglePin(id: string) {
    await api.post(`/blueprints/item/${id}/pin`);
    await load();
  }

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <FlatList
        ListHeaderComponent={
          <View>
            <Text style={styles.tag}>{t("bpTag", lang)}</Text>
            <Text style={styles.title}>{t("bpTitle", lang)}</Text>
            <Text style={styles.subtitle}>{t("bpSub", lang)}</Text>

            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionLabel}>{t("bpThoughts", lang)}</Text>
              <Text style={styles.selCount}>
                {selected.size}/12
              </Text>
            </View>
            {thoughts.length === 0 && (
              <Text style={styles.empty}>{t("bpEmptyHint", lang)}</Text>
            )}
            {thoughts.map((th) => {
              const isSel = selected.has(th.id);
              return (
                <Pressable
                  key={th.id}
                  onPress={() => toggle(th.id)}
                  style={[styles.thRow, isSel && styles.thRowSel]}
                  testID={`thought-row-${th.id}`}
                >
                  <Ionicons
                    name={isSel ? "checkbox" : "square-outline"}
                    size={18}
                    color={isSel ? COLORS.primary : COLORS.textTertiary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.thTitle} numberOfLines={1}>
                      {th.title}
                    </Text>
                    <Text style={styles.thPreview} numberOfLines={2}>
                      {th.content}
                    </Text>
                  </View>
                  {th.blueprint_id && (
                    <View style={styles.linkedPill}>
                      <Text style={styles.linkedTxt}>LINKED</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <View style={{ marginTop: SPACING.md }}>
              <Text style={styles.sectionLabel}>{t("engineLabel", lang)}</Text>
              <View style={styles.engineRow}>
                {(["oracle", "gemini", "dual"] as const).map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEngine(e)}
                    style={[styles.engineBtn, engine === e && styles.engineBtnActive]}
                    testID={`engine-${e}`}
                  >
                    <Text
                      style={[
                        styles.engineTxt,
                        engine === e && styles.engineTxtActive,
                      ]}
                    >
                      {e === "oracle"
                        ? t("engineOracle", lang)
                        : e === "gemini"
                          ? t("engineGemini", lang)
                          : t("engineDual", lang)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Btn
                label={synth ? t("bpSynthInProgress", lang) : t("bpSynth", lang)}
                onPress={synthesise}
                disabled={synth || selected.size === 0}
                testID="bp-synthesise"
              />
              <Text style={styles.synthHint}>{t("bpSynthHint", lang)}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>{t("bpTitle", lang).toUpperCase()}</Text>
          </View>
        }
        data={blueprints}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t("bpEmpty", lang)}</Text>
        }
        renderItem={({ item }) => {
          const color = CLASS_COLOR[item.classification] ?? COLORS.textTertiary;
          return (
            <Pressable
              onPress={() => router.push(`/blueprint/${item.id}`)}
              style={styles.bpCard}
              testID={`bp-card-${item.id}`}
            >
              <View style={styles.bpHead}>
                <View style={[styles.classPill, { borderColor: color }]}>
                  <Text style={[styles.classTxt, { color }]}>{item.classification}</Text>
                </View>
                {item.pinned && (
                  <Ionicons name="bookmark" size={14} color={COLORS.primary} />
                )}
                <Text style={styles.bpConf}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.bpTitle}>{item.title}</Text>
              <Text style={styles.bpSummary} numberOfLines={3}>
                {item.summary}
              </Text>
              <View style={styles.bpActions}>
                <Pressable
                  onPress={() => togglePin(item.id)}
                  style={styles.bpActionBtn}
                  testID={`bp-pin-${item.id}`}
                >
                  <Text style={styles.bpActionTxt}>
                    {item.pinned ? t("bpUnpin", lang) : t("bpPin", lang)}
                  </Text>
                </Pressable>
                <Text style={styles.bpDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={<Footer />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
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
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.lg,
    marginBottom: 6,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  selCount: { color: COLORS.textTertiary, fontFamily: "Courier", fontSize: 11 },
  thRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginTop: 6,
  },
  thRowSel: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  thTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  thPreview: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  linkedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
  },
  linkedTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  synthHint: { color: COLORS.textTertiary, fontSize: 10, marginTop: 4, textAlign: "center" },
  engineRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  engineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
  },
  engineBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  engineTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  engineTxtActive: { color: COLORS.primary },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  empty: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
  bpCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    gap: 6,
  },
  bpHead: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  classPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  classTxt: { fontFamily: "Courier", fontSize: 9, letterSpacing: 1.5, fontWeight: "700" },
  bpConf: {
    marginLeft: "auto",
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
  },
  bpTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "700",
  },
  bpSummary: { color: COLORS.textSecondary, fontSize: 12 },
  bpActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  bpActionBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bpActionTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  bpDate: { color: COLORS.textTertiary, fontSize: 10 },
});
