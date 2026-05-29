import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Dashboard = {
  encryption: string;
  key_storage: string;
  id_me_verified: boolean;
  id_me_verified_at?: string;
  biometric_lock: boolean;
  stats: { documents_vaulted: number; shares_created: number; active_links: number };
  recent_activity: { id: string; action: string; detail: string; timestamp: string }[];
  compliance: string[];
};

export default function SecurityDashboard() {
  const { user, lang } = useApp();
  const [data, setData] = useState<Dashboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const d = await api.get<Dashboard>(`/security/dashboard/${user.user_id}`);
    if (d) setData(d);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenShell tacticalBg testID="security-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
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
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.tag}>⬢ TRUST DASHBOARD</Text>
            <Text style={styles.title}>{t("trustDashboardTitle", lang)}</Text>
          </View>
          <LangToggle compact />
        </View>

        {/* Encryption Status */}
        <TacticalCard testID="encryption-card">
          <Row
            icon="lock-closed"
            label={t("encryptionStatus", lang)}
            value={data?.encryption || "AES-256-GCM"}
            success
          />
          <Divider />
          <Row
            icon="key"
            label={t("keyStorage", lang)}
            value={data?.key_storage || "Secure Enclave"}
            success
          />
          <Divider />
          <Row
            icon="shield-checkmark"
            label={t("identityStatus", lang)}
            value={
              data?.id_me_verified
                ? t("verifiedStudent", lang)
                : t("notVerified", lang)
            }
            success={!!data?.id_me_verified}
          />
          <Divider />
          <Row
            icon="finger-print"
            label={t("biometricLock", lang)}
            value={data?.biometric_lock ? t("enabled", lang) : t("disabled", lang)}
            success={!!data?.biometric_lock}
          />
        </TacticalCard>

        {/* Compliance */}
        <Text style={styles.section}>⬢ {t("compliance", lang).toUpperCase()}</Text>
        <View style={styles.complianceRow}>
          {(data?.compliance || ["AES-256-GCM", "FERPA", "SOC 2"]).map((c) => (
            <View key={c} style={styles.complianceTag}>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={COLORS.primary}
              />
              <Text style={styles.complianceTxt}>{c.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Stat label="VAULTED" value={data?.stats.documents_vaulted ?? 0} />
          <Stat label="SHARES" value={data?.stats.shares_created ?? 0} />
          <Stat label="ACTIVE" value={data?.stats.active_links ?? 0} />
        </View>

        {/* Activity Log */}
        <Text style={styles.section}>⬢ {t("recentActivity", lang).toUpperCase()}</Text>
        <TacticalCard>
          {(data?.recent_activity || []).slice(0, 10).map((a, i) => (
            <View key={a.id}>
              <View style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityAction}>{a.action}</Text>
                  {!!a.detail && (
                    <Text style={styles.activityDetail}>{a.detail}</Text>
                  )}
                </View>
                <Text style={styles.activityTime}>
                  {new Date(a.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {i < (data?.recent_activity?.length ?? 0) - 1 && <Divider />}
            </View>
          ))}
          {(!data?.recent_activity || data.recent_activity.length === 0) && (
            <Text style={styles.emptyLog}>NO ACTIVITY YET</Text>
          )}
        </TacticalCard>
      </ScrollView>
    </ScreenShell>
  );
}

function Row({
  icon,
  label,
  value,
  success,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={success ? COLORS.primary : COLORS.warning}
        />
      </View>
      <Text style={styles.rowLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.rowValue, !success && { color: COLORS.warning }]}>
        {value.toUpperCase()}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
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
  tag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  rowIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  rowValue: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  complianceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  complianceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  complianceTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  statsRow: { flexDirection: "row", gap: SPACING.sm },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    alignItems: "center",
    gap: 4,
  },
  statVal: {
    color: COLORS.primary,
    fontFamily: "Georgia",
    fontSize: 24,
    fontWeight: "700",
  },
  statLbl: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  activityAction: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  activityDetail: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  activityTime: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
  },
  emptyLog: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    textAlign: "center",
    paddingVertical: SPACING.md,
  },
});
