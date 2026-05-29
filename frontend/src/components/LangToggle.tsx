import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS } from "@/src/theme/colors";
import { useApp } from "@/src/context/AppContext";

export default function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useApp();
  return (
    <View
      style={[styles.wrap, compact && styles.compact]}
      testID="language-toggle"
    >
      <Pressable
        onPress={() => setLang("en")}
        style={[styles.pill, lang === "en" && styles.pillActive]}
        testID="lang-toggle-en"
      >
        <Text style={[styles.txt, lang === "en" && styles.txtActive]}>EN</Text>
      </Pressable>
      <Pressable
        onPress={() => setLang("es")}
        style={[styles.pill, lang === "es" && styles.pillActive]}
        testID="lang-toggle-es"
      >
        <Text style={[styles.txt, lang === "es" && styles.txtActive]}>ES</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.sm,
    padding: 3,
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
  },
  compact: {
    padding: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    minWidth: 44,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: COLORS.primary,
  },
  txt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  txtActive: {
    color: COLORS.accentNavy,
  },
});
