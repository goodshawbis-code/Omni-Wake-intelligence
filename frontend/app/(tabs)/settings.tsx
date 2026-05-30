import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import LangToggle from "@/src/components/LangToggle";
import Btn from "@/src/components/Btn";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";

export default function Settings() {
  const { user, lang, setBiometric, signOut } = useApp();

  function confirmSignOut() {    Alert.alert(
      t("signOut", lang),
      t("confirmSignOut", lang),
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("confirm", lang),
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ],
    );
  }

  return (
    <ScreenShell testID="settings-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.tag}>⬢ {t("settings", lang).toUpperCase()}</Text>
            <Text style={styles.title}>{t("settings", lang)}</Text>
          </View>
          <LangToggle compact />
        </View>

        {/* Language */}
        <Text style={styles.section}>⬢ {t("language", lang).toUpperCase()}</Text>
        <TacticalCard>
          <View style={styles.langRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {lang === "en" ? t("english", lang) : t("spanish", lang)}
              </Text>
              <Text style={styles.rowSub}>EN ⇄ ES</Text>
            </View>
            <LangToggle />
          </View>
        </TacticalCard>

        {/* Account */}
        <Text style={styles.section}>⬢ {t("account", lang).toUpperCase()}</Text>
        <TacticalCard>
          <View style={styles.row}>
            <Ionicons
              name={user?.id_me_verified ? "shield-checkmark" : "shield-outline"}
              size={20}
              color={user?.id_me_verified ? COLORS.primary : COLORS.warning}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {user?.id_me_verified
                  ? t("identityVerified", lang)
                  : t("notVerified", lang)}
              </Text>
              {user?.id_me_full_name && (
                <Text style={styles.rowSub}>{user.id_me_full_name}</Text>
              )}
            </View>
            {!user?.id_me_verified && (
              <Pressable
                onPress={() => router.push("/idme")}
                testID="settings-verify-btn"
              >
                <Text style={styles.actionTxt}>VERIFY ›</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons name="finger-print" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("biometricLock", lang)}</Text>
              <Text style={styles.rowSub}>
                {user?.biometric_lock ? t("enabled", lang) : t("disabled", lang)}
              </Text>
            </View>
            <Switch
              value={!!user?.biometric_lock}
              onValueChange={setBiometric}
              trackColor={{
                false: COLORS.surfaceElevated,
                true: COLORS.primary,
              }}
              thumbColor={COLORS.textPrimary}
              testID="biometric-switch"
            />
          </View>
        </TacticalCard>

        {/* About */}
        <Text style={styles.section}>⬢ ABOUT</Text>
        <TacticalCard>
          <View style={styles.row}>
            <Ionicons name="business-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>ONE CLICK TRANSCRIPT</Text>
              <Text style={styles.rowSub}>
                A Division of Brick Outdoor Living, Inc.
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>VERSION</Text>
              <Text style={styles.rowSub}>1.0.0 • TIER-1</Text>
            </View>
          </View>
        </TacticalCard>

        <View style={{ marginTop: SPACING.lg }}>
          <Btn
            label={t("signOut", lang)}
            variant="danger"
            onPress={confirmSignOut}
            testID="signout-btn"
          />
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
  principalHeader: { display: "none" },
  principalBadge: { display: "none" },
  principalName: { display: "none" },
  principalRank: { display: "none" },
  principalChip: { display: "none" },
  principalChipTxt: { display: "none" },
  pRow: { display: "none" },
  pRowLabel: { display: "none" },
  pRowValue: { display: "none" },
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
  langRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  rowTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  rowSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  actionTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
