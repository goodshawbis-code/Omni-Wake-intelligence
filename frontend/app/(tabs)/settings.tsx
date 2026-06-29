import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Btn from "@/src/components/Btn";
import Footer from "@/src/components/Footer";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { vaultKeyFingerprint } from "@/src/security/vaultKey";

export default function Settings() {
  const { operator, lang, setBiometric, signOut } = useApp();
  const [fp, setFp] = useState("…");

  useEffect(() => {
    let alive = true;
    vaultKeyFingerprint()
      .then((v) => alive && setFp(v))
      .catch(() => alive && setFp("UNAVAILABLE"));
    return () => {
      alive = false;
    };
  }, []);

  function confirmSignOut() {
    Alert.alert("End session?", "This wipes the device link and rebootstraps.", [
      { text: "Cancel", style: "cancel" },
      { text: "End Session", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.tag}>{t("settingsTag", lang)}</Text>
        <Text style={styles.title}>{t("settingsTitle", lang)}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
            <Text style={styles.rowTitle}>{t("settingsLang", lang)}</Text>
            <View style={{ flex: 1 }} />
            <LangToggle />
          </View>
          <View style={styles.div} />
          <View style={styles.row}>
            <Ionicons name="finger-print" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("settingsBio", lang)}</Text>
              <Text style={styles.rowSub}>{t("settingsBioHint", lang)}</Text>
            </View>
            <Switch
              value={!!operator?.biometric_lock}
              onValueChange={setBiometric}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
              thumbColor={COLORS.textPrimary}
              testID="biometric-switch"
            />
          </View>
          <View style={styles.div} />
          <View style={styles.row}>
            <Ionicons name="key-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("vaultKeyFp", lang)}</Text>
              <Text style={styles.rowSub} testID="vault-key-fp">
                {fp} • {t("vaultKeyFpHint", lang)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("kernelTag", lang)}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={() => router.push("/kernel")}
            style={styles.row}
            testID="settings-kernel-link"
          >
            <Ionicons name="pulse-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("kernelTitle", lang)}</Text>
              <Text style={styles.rowSub}>{t("kernelSub", lang)}</Text>
            </View>
            <Text style={styles.openTxt}>OPEN ›</Text>
          </Pressable>
        </View>

        <View style={styles.opCard}>
          <Text style={styles.opName}>{operator?.full_name || "Tier-1 Operator"}</Text>
          <Text style={styles.opEmail}>{operator?.email || "unverified@anon"}</Text>
          <Text style={styles.opClear}>
            {operator?.clearance_level || "TIER-1"} •{" "}
            {operator?.ingress_verified ? "INGRESS VERIFIED" : "NOT VERIFIED"}
          </Text>
        </View>

        <View style={{ marginTop: SPACING.lg }}>
          <Btn
            label={t("signOut", lang)}
            onPress={confirmSignOut}
            variant="danger"
            testID="settings-signout"
          />
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
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
  card: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: SPACING.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 10,
  },
  rowTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  rowSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  div: { height: 1, backgroundColor: COLORS.borderSoft, marginVertical: 4 },
  openTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  opCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: "center",
  },
  opName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  opEmail: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  opClear: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 6,
  },
});
