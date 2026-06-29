import { StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING } from "@/src/theme/colors";

export default function Footer() {
  return (
    <View style={styles.shell}>
      <View style={styles.line} />
      <Text style={styles.brand}>OMNI WAKE INTELLIGENCE</Text>
      <Text style={styles.sub}>© {new Date().getFullYear()} • A Division of Brick Outdoor Living, Inc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
    gap: 6,
  },
  line: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.primary,
    marginBottom: 6,
  },
  brand: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
  sub: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1,
  },
});
