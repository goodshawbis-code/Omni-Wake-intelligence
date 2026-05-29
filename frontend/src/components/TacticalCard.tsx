import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { COLORS, RADIUS, SPACING } from "@/src/theme/colors";

export default function TacticalCard({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.85)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    position: "relative",
    overflow: "hidden",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 12,
    height: 12,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: COLORS.primary,
  },
});
