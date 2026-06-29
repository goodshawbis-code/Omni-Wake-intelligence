import { Text, View, StyleSheet } from "react-native";
import { COLORS, SPACING } from "@/src/theme/colors";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";

export default function Footer() {
  const { lang } = useApp();
  return (
    <View style={styles.wrap} testID="legal-footer">
      <View style={styles.bar} />
      <Text style={styles.text}>{t("legalFooter", lang)}</Text>
      <Text style={styles.sub}>© {new Date().getFullYear()} OMNI WAKE INTELLIGENCE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    gap: 4,
  },
  bar: {
    width: 28,
    height: 2,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  text: {
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Courier",
    textAlign: "center",
  },
  sub: {
    color: COLORS.textTertiary,
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: "Courier",
  },
});
