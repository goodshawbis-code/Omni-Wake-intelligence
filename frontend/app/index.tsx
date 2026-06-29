import { useEffect } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import Footer from "@/src/components/Footer";

const HERO_BG =
  "https://images.pexels.com/photos/34929879/pexels-photo-34929879.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const GOLD_SEAL =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/3a7a5fe1dc994fc9d457cebe840cc70f7999afd619f94d15e916df116376a787.png";

export default function Onboarding() {
  const { user, lang } = useApp();

  // If we already have a verified session, jump straight to the command center.
  useEffect(() => {
    if (user?.id_me_verified) {
      router.replace("/(tabs)");
    }
  }, [user]);

  return (
    <ImageBackground
      source={{ uri: HERO_BG }}
      style={styles.bg}
      imageStyle={{ opacity: 0.35 }}
    >
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeTxt}>OCT</Text>
              </View>
              <Text style={styles.brand}>OMNI WAKE INTELLIGENCE</Text>
            </View>
            <LangToggle compact />
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={{ uri: GOLD_SEAL }} style={styles.seal} />
            <Text style={styles.classifiedTag}>
              ⬢ CLASSIFIED • TIER-1 IDENTITY
            </Text>
            <Text style={styles.title} testID="welcome-title">
              {t("welcomeTitle", lang)}
            </Text>
            <Text style={styles.body}>{t("welcomeBody", lang)}</Text>
          </View>

          {/* Action zone */}
          <View style={styles.actions}>
            <Btn
              label={t("verifyWithIdMe", lang)}
              onPress={() => router.push("/idme")}
              testID="verify-idme-btn"
            />
            <Btn
              label={t("alreadyVerified", lang)}
              variant="secondary"
              onPress={() => router.push("/(tabs)")}
              testID="skip-verify-btn"
            />
            <Text style={styles.whyVerify}>{t("whyVerify", lang)}</Text>
          </View>

          {/* Trust pillars */}
          <View style={styles.pillars}>
            <Pillar label="AES-256" sub="ENCRYPTION" />
            <View style={styles.pillarDiv} />
            <Pillar label="ID.ME" sub="VERIFIED" />
            <View style={styles.pillarDiv} />
            <Pillar label="FERPA" sub="ALIGNED" />
          </View>
        </ScrollView>

        <Footer />
      </View>
    </ImageBackground>
  );
}

function Pillar({ label, sub }: { label: string; sub: string }) {
  return (
    <View style={styles.pillar}>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Text style={styles.pillarSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.primary,
    fontFamily: "Courier",
    letterSpacing: 3,
    fontSize: 11,
  },
  bg: { flex: 1, backgroundColor: COLORS.background },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.85)",
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 1,
  },
  brand: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 12,
  },
  hero: {
    marginTop: SPACING.xl,
    alignItems: "center",
    gap: SPACING.md,
  },
  seal: {
    width: 130,
    height: 130,
    resizeMode: "contain",
  },
  classifiedTag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 38,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  whyVerify: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "Courier",
    letterSpacing: 1,
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  pillars: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(15,23,42,0.6)",
    paddingVertical: SPACING.md,
  },
  pillar: { flex: 1, alignItems: "center", gap: 2 },
  pillarDiv: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  pillarLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  pillarSub: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
  },
});
