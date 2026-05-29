import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Portal = {
  id: string;
  name: string;
  short: string;
  color: string;
  url: string;
  mfa_method: string;
  mascot: string;
};

export default function PortalSelect() {
  const { lang } = useApp();
  const [portals, setPortals] = useState<Portal[]>([]);

  useEffect(() => {
    api.get<Portal[]>("/agent/portals").then((p) => p && setPortals(p));
  }, []);

  return (
    <ScreenShell tacticalBg testID="portal-select">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="portal-back">
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>AI LIAISON • DEPLOY</Text>
          <LangToggle compact />
        </View>

        <View style={styles.intro}>
          <Text style={styles.tag}>⬢ STEP 01 / 04</Text>
          <Text style={styles.title}>{t("selectPortal", lang)}</Text>
          <Text style={styles.body}>{t("selectPortalSub", lang)}</Text>
        </View>

        <View style={{ gap: SPACING.md }}>
          {portals.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/agent/credentials?portal=${p.id}`)}
              testID={`portal-${p.id}`}
            >
              <TacticalCard>
                <View style={styles.portalRow}>
                  <View
                    style={[
                      styles.crest,
                      { borderColor: p.color, backgroundColor: `${p.color}1A` },
                    ]}
                  >
                    <Text style={[styles.crestText, { color: p.color }]}>
                      {p.short}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.portalName}>{p.name}</Text>
                    <Text style={styles.portalSub}>
                      {p.mascot.toUpperCase()} • {p.mfa_method.replace("_", " ").toUpperCase()}
                    </Text>
                    <View style={styles.portalUrlRow}>
                      <Ionicons name="lock-closed" size={10} color={COLORS.primary} />
                      <Text style={styles.portalUrl}>{p.url}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </View>
              </TacticalCard>
            </Pressable>
          ))}
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
          <Text style={styles.noticeTxt}>
            ZERO-KNOWLEDGE • CREDENTIALS NEVER STORED
          </Text>
        </View>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  portalRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  crest: {
    width: 56,
    height: 56,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  crestText: {
    fontFamily: "Georgia",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
  portalName: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 14,
    fontWeight: "700",
  },
  portalSub: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  portalUrlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  portalUrl: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: SPACING.lg,
  },
  noticeTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
  },
});
