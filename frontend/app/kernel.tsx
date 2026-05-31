import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import Btn from "@/src/components/Btn";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import {
  KernelReport,
  KernelStats,
  listReports,
  getStats,
  resolveReport,
  deleteReport,
  reportError,
} from "@/src/kernel/reporter";

const SEV_COLOR: Record<string, string> = {
  CRITICAL: COLORS.danger,
  HIGH: COLORS.danger,
  MEDIUM: COLORS.warning,
  LOW: COLORS.primary,
};

export default function KernelConsole() {
  const { user, lang } = useApp();
  const [reports, setReports] = useState<KernelReport[]>([]);
  const [stats, setStats] = useState<KernelStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [items, s] = await Promise.all([
      listReports(user?.user_id),
      getStats(user?.user_id),
    ]);
    setReports(items);
    setStats(s);
  }, [user?.user_id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function fakeError() {
    // Test hook: lets QA confirm the loop works end-to-end without crashing
    // the app. Pushes a synthetic trace through the kernel and refreshes.
    await reportError({
      user_id: user?.user_id ?? null,
      error: new Error(
        "Synthetic trace from Kernel Console — verifying Sonnet 4.5 triage",
      ),
      route: "/kernel (manual test)",
    });
    await load();
  }

  async function onResolve(id: string) {
    const r = await resolveReport(id);
    if (r) await load();
  }

  async function onDelete(id: string) {
    const ok = await deleteReport(id);
    if (ok) await load();
  }

  return (
    <ScreenShell testID="kernel-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          testID="kernel-back"
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          <Text style={styles.backTxt}>BACK</Text>
        </Pressable>
        <Text style={styles.tag}>⬢ {t("kernelTag", lang)}</Text>
        <Text style={styles.title}>{t("kernelTitle", lang)}</Text>
        <Text style={styles.subtitle}>{t("kernelSub", lang)}</Text>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <Stat label={t("kernelOpenIssues", lang)} value={String(stats.unresolved)} />
          <View style={styles.divCol} />
          <Stat label={t("kernelTotalIssues", lang)} value={String(stats.total)} />
          <View style={styles.divCol} />
          <Stat label="MODEL" value={stats.model.split("/")[1].slice(0, 14)} />
        </View>
      )}
      {stats && !stats.llm_configured && (
        <View style={styles.warnBanner} testID="kernel-llm-missing">
          <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
          <Text style={styles.warnTxt}>{t("kernelLLMDisabled", lang)}</Text>
        </View>
      )}

      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            <Text style={styles.emptyTxt}>{t("kernelEmpty", lang)}</Text>
            <Btn
              label="INJECT TEST TRACE"
              variant="secondary"
              onPress={fakeError}
              testID="kernel-inject-test"
            />
          </View>
        }
        renderItem={({ item }) => {
          const sev = item.analysis?.severity ?? "PENDING";
          const sevColor = SEV_COLOR[sev] ?? COLORS.textTertiary;
          return (
            <TacticalCard
              style={styles.card}
              testID={`kernel-item-${item.id}`}
            >
              <View style={styles.cardHead}>
                <View style={[styles.sevPill, { borderColor: sevColor }]}>
                  <Text style={[styles.sevTxt, { color: sevColor }]}>{sev}</Text>
                </View>
                <Text style={styles.cardSource}>
                  {item.source.toUpperCase()} • {item.platform || "unknown"}
                </Text>
                {item.resolved && (
                  <View style={styles.resolvedPill}>
                    <Text style={styles.resolvedTxt}>
                      {t("kernelResolved", lang)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.errName}>{item.error_name}</Text>
              <Text style={styles.errMsg} numberOfLines={3}>
                {item.error_message}
              </Text>
              {item.analysis ? (
                <>
                  <Text style={styles.fieldLabel}>
                    {t("kernelRootCause", lang)}
                  </Text>
                  <Text style={styles.fieldValue}>
                    {item.analysis.root_cause}
                  </Text>
                  <Text style={styles.fieldLabel}>
                    {t("kernelSuggestedFix", lang)}
                  </Text>
                  <Text style={styles.fieldValue}>
                    {item.analysis.suggested_fix}
                  </Text>
                  {!!item.analysis.suspected_file && (
                    <>
                      <Text style={styles.fieldLabel}>
                        {t("kernelSuspectFile", lang)}
                      </Text>
                      <Text style={styles.mono}>
                        {item.analysis.suspected_file}
                      </Text>
                    </>
                  )}
                  <Text style={styles.fieldLabel}>
                    {t("kernelConfidence", lang)}{" "}
                    {Math.round(item.analysis.confidence * 100)}%
                  </Text>
                </>
              ) : (
                <Text style={styles.fieldLabel}>
                  {item.analysis_status === "failed"
                    ? `Triage failed: ${item.analysis_error ?? "unknown"}`
                    : t("kernelAnalyzing", lang)}
                </Text>
              )}
              {!!item.route && (
                <Text style={styles.routeTxt}>↳ {item.route}</Text>
              )}
              <View style={styles.actionsRow}>
                {!item.resolved && (
                  <Pressable
                    onPress={() => onResolve(item.id)}
                    style={styles.smallBtn}
                    testID={`kernel-resolve-${item.id}`}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.smallBtnTxt}>
                      {t("kernelResolve", lang)}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => onDelete(item.id)}
                  style={[styles.smallBtn, { borderColor: COLORS.danger }]}
                  testID={`kernel-delete-${item.id}`}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                  <Text style={[styles.smallBtnTxt, { color: COLORS.danger }]}>
                    DELETE
                  </Text>
                </Pressable>
              </View>
            </TacticalCard>
          );
        }}
        ListFooterComponent={
          reports.length > 0 ? (
            <View style={{ marginTop: SPACING.md }}>
              <Btn
                label="+ INJECT TEST TRACE"
                variant="secondary"
                onPress={fakeError}
                testID="kernel-inject-test-footer"
              />
            </View>
          ) : null
        }
      />
    </ScreenShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  back: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm },
  backTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
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
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  divCol: { width: 1, backgroundColor: COLORS.border },
  warnBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(234,179,8,0.12)",
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  warnTxt: {
    color: COLORS.warning,
    fontFamily: "Courier",
    fontSize: 10,
    flex: 1,
  },
  list: { padding: SPACING.lg, gap: SPACING.md, flexGrow: 1 },
  empty: { paddingVertical: SPACING.xxl, alignItems: "center", gap: SPACING.md },
  emptyTxt: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  card: { gap: 4 },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  sevPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  sevTxt: {
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  cardSource: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    flex: 1,
  },
  resolvedPill: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resolvedTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  errName: {
    color: COLORS.danger,
    fontFamily: "Courier",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  errMsg: { color: COLORS.textPrimary, fontSize: 12, marginTop: 2 },
  fieldLabel: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  fieldValue: { color: COLORS.textPrimary, fontSize: 12, marginTop: 2 },
  mono: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 11,
    marginTop: 2,
  },
  routeTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  smallBtnTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
