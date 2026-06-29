import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import BiometricGate from "@/src/components/BiometricGate";
import Footer from "@/src/components/Footer";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Dashboard = {
  operator: {
    full_name?: string | null;
    email?: string | null;
    clearance_level: string;
    ingress_verified: boolean;
  };
  counters: { thoughts: number; blueprints: number; pinned: number };
  by_classification: Record<string, number>;
  activity: { id: string; action: string; detail: string; timestamp: string }[];
  security: { encryption: string; enclave: string; compliance: string[] };
};

export default function Custody() {
  const { operator, lang } = useApp();
  const [data, setData] = useState<Dashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!operator) return;
    const res = await api.get<Dashboard>(`/custody/dashboard/${operator.operator_id}`);
    setData(res);
  }, [operator]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <BiometricGate>
        <FlatList
          data={data?.activity ?? []}
          keyExtractor={(it) => it.id}
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
          ListHeaderComponent={
            <View>
              <Text style={styles.tag}>{t("custodyTag", lang)}</Text>
              <Text style={styles.title}>{t("custodyTitle", lang)}</Text>

              <View style={styles.opCard}>
                <View style={styles.opRow}>
                  <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opName}>
                      {data?.operator.full_name || "Tier-1 Operator"}
                    </Text>
                    <Text style={styles.opEmail}>
                      {data?.operator.email || "unverified@anon"}
                    </Text>
                  </View>
                  <View style={styles.clearancePill}>
                    <Text style={styles.clearanceTxt}>
                      {data?.operator.clearance_level || "TIER-1"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Stat label={t("custodyThoughts", lang).toUpperCase()} value={String(data?.counters.thoughts ?? 0)} />
                <Stat label={t("custodyBlueprints", lang).toUpperCase()} value={String(data?.counters.blueprints ?? 0)} />
                <Stat label={t("custodyPinned", lang).toUpperCase()} value={String(data?.counters.pinned ?? 0)} />
              </View>

              <Text style={styles.sectionLabel}>{t("custodyClassification", lang)}</Text>
              <View style={styles.classCard}>
                {Object.entries(data?.by_classification ?? {}).map(([k, v]) => (
                  <View key={k} style={styles.classRow}>
                    <Text style={styles.classKey}>{k}</Text>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.min(100, (data?.counters.blueprints ?? 0) === 0 ? 0 : (v / (data?.counters.blueprints ?? 1)) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.classVal}>{v}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>{t("custodySecurity", lang)}</Text>
              <View style={styles.secCard}>
                <Text style={styles.secLine}>
                  <Text style={styles.secKey}>Encryption  </Text>
                  {data?.security.encryption || "AES-256-GCM"}
                </Text>
                <Text style={styles.secLine}>
                  <Text style={styles.secKey}>Enclave     </Text>
                  {data?.security.enclave || "Secure Enclave"}
                </Text>
                <Text style={styles.secLine}>
                  <Text style={styles.secKey}>Compliance  </Text>
                  {(data?.security.compliance ?? []).join(" · ") || "SOC 2 · GDPR"}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>{t("custodyActivity", lang)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.actRow}>
              <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actAction}>{item.action}</Text>
                {!!item.detail && (
                  <Text style={styles.actDetail} numberOfLines={1}>
                    {item.detail}
                  </Text>
                )}
              </View>
              <Text style={styles.actTs}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          ListFooterComponent={<Footer />}
        />
      </BiometricGate>
    </SafeAreaView>
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
  opCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  opRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  opName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  opEmail: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  clearancePill: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearanceTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  statValue: {
    color: COLORS.primary,
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
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
  classCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 8,
  },
  classRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  classKey: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    width: 96,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: COLORS.primary },
  classVal: {
    width: 24,
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    textAlign: "right",
  },
  secCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  secLine: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    marginVertical: 2,
  },
  secKey: { color: COLORS.primary, fontWeight: "700" },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  actAction: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "700",
  },
  actDetail: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  actTs: { color: COLORS.textTertiary, fontFamily: "Courier", fontSize: 10 },
});
