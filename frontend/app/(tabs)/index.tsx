import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import LangToggle from "@/src/components/LangToggle";
import Btn from "@/src/components/Btn";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

const GOLD_SEAL =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/3a7a5fe1dc994fc9d457cebe840cc70f7999afd619f94d15e916df116376a787.png";

type Stats = {
  encryption: string;
  stats: { documents_vaulted: number; shares_created: number; active_links: number };
  id_me_verified: boolean;
};

export default function CommandCenter() {
  const { user, lang } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await api.get<Stats>(`/security/dashboard/${user.user_id}`);
    if (data) setStats(data);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const hour = new Date().getHours();
  const greetKey =
    hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";

  const fullName = user?.id_me_full_name || "STUDENT";
  const firstName = fullName.split(" ")[0]?.toUpperCase() ?? "STUDENT";

  return (
    <ScreenShell tacticalBg testID="command-center">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.tagline}>⬢ {t("commandCenter", lang)}</Text>
            <Text style={styles.greeting}>
              {t(greetKey, lang)}, {firstName}
            </Text>
          </View>
          <LangToggle compact />
        </View>

        {/* Verified badge bar */}
        <View style={styles.identityBar}>
          <Image source={{ uri: GOLD_SEAL }} style={styles.identitySeal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.identityLabel}>
              {user?.id_me_verified ? t("verifiedStudent", lang) : t("unverified", lang)}
            </Text>
            <Text style={styles.identityName}>{fullName.toUpperCase()}</Text>
          </View>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: user?.id_me_verified
                  ? COLORS.success
                  : COLORS.warning,
              },
            ]}
          />
        </View>

        {/* Hero retrieve card */}
        <Pressable
          onPress={() => router.push("/agent/portal")}
          testID="retrieve-transcript-cta"
        >
          <TacticalCard style={styles.retrieveCard}>
            <View style={styles.retrieveRow}>
              <View style={styles.retrieveIcon}>
                <Ionicons name="download-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.retrieveTitle}>
                  {t("retrieveTranscript", lang)}
                </Text>
                <Text style={styles.retrieveSub}>{t("retrieveSub", lang)}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.portalsRow}>
              <PortalChip name="UAPB" />
              <PortalChip name="CSUN" />
              <Text style={styles.portalsMore}>+ MORE</Text>
            </View>
          </TacticalCard>
        </Pressable>

        {/* Bento stats */}
        <View style={styles.bento}>
          <StatTile
            icon="documents-outline"
            value={stats?.stats.documents_vaulted ?? 0}
            label={t("vaultDocs", lang)}
            testID="stat-vault"
          />
          <StatTile
            icon="link-outline"
            value={stats?.stats.active_links ?? 0}
            label={t("activeLinks", lang)}
            testID="stat-links"
          />
        </View>

        <TacticalCard>
          <View style={styles.encRow}>
            <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
            <Text style={styles.encLabel}>{t("encryption", lang).toUpperCase()}</Text>
            <Text style={styles.encVal}>AES-256-GCM</Text>
          </View>
          <View style={styles.encDivider} />
          <View style={styles.encRow}>
            <Ionicons name="key-outline" size={18} color={COLORS.primary} />
            <Text style={styles.encLabel}>KEY VAULT</Text>
            <Text style={styles.encVal}>SECURE ENCLAVE</Text>
          </View>
        </TacticalCard>

        {/* Quick actions */}
        <Text style={styles.section}>⬢ {t("quickActions", lang)}</Text>
        <View style={styles.quickRow}>
          <Btn
            label={t("openVault", lang)}
            variant="secondary"
            onPress={() => router.push("/(tabs)/vault")}
            style={{ flex: 1 }}
            small
            testID="quick-vault"
          />
          <Btn
            label={t("trustDashboard", lang)}
            variant="secondary"
            onPress={() => router.push("/(tabs)/security")}
            style={{ flex: 1 }}
            small
            testID="quick-trust"
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

function PortalChip({ name }: { name: string }) {
  return (
    <View style={styles.portalChip}>
      <Text style={styles.portalChipTxt}>{name}</Text>
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  testID?: string;
}) {
  return (
    <View style={styles.statTile} testID={testID}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
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
    marginBottom: SPACING.sm,
  },
  tagline: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 4,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
  },
  identityBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: SPACING.md,
  },
  identitySeal: { width: 48, height: 48, resizeMode: "contain" },
  identityLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "700",
  },
  identityName: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  retrieveCard: { gap: SPACING.md },
  retrieveRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  retrieveIcon: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryDim,
  },
  retrieveTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 17,
    fontWeight: "700",
  },
  retrieveSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  portalsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  portalChip: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  portalChipTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  portalsMore: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  bento: { flexDirection: "row", gap: SPACING.md },
  statTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 6,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 32,
    fontWeight: "700",
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  encRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  encLabel: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    flex: 1,
  },
  encVal: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  encDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  section: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  quickRow: { flexDirection: "row", gap: SPACING.sm },
});
