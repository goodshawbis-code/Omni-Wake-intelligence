import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator } from "react-native";
import { COLORS, RADIUS, SPACING } from "@/src/theme/colors";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export default function Btn({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  testID,
  small = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        variant === "ghost" && styles.ghost,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? COLORS.accentNavy : COLORS.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            small && styles.labelSmall,
            variant === "primary" && styles.labelPrimary,
            variant === "secondary" && styles.labelSecondary,
            variant === "danger" && styles.labelDanger,
            variant === "ghost" && styles.labelGhost,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    minHeight: 38,
  },
  primary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  secondary: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: "transparent",
  },
  danger: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.55)",
    backgroundColor: COLORS.dangerDim,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  label: {
    fontFamily: "Courier",
    fontSize: 13,
    letterSpacing: 2.5,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  labelSmall: {
    fontSize: 11,
    letterSpacing: 2,
  },
  labelPrimary: { color: COLORS.accentNavy },
  labelSecondary: { color: COLORS.primary },
  labelDanger: { color: COLORS.danger },
  labelGhost: { color: COLORS.textSecondary },
});
