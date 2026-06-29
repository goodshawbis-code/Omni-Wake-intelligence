// Omni Wake intelligence — Enterprise Gold + Navy palette.
export const COLORS = {
  // Backgrounds
  background: "#0A1628",       // deep navy
  backgroundAlt: "#0F1E33",    // slightly elevated navy
  surface: "#1B2838",          // card surface
  surfaceElevated: "#1E3A5F",  // hover/active
  surfaceMuted: "#0E1A2D",     // sunken surface

  // Brand gold
  primary: "#C5A559",          // executive gold
  primaryHover: "#FFD700",     // bright gold accent
  primaryDim: "rgba(197,165,89,0.12)",
  primaryGlow: "rgba(255,215,0,0.18)",
  primaryDeep: "#8C7A3F",      // darkened gold

  // Navy accents
  accentNavy: "#1E3A5F",
  accentNavyDeep: "#0A1628",

  // Text
  textPrimary: "#F5F0E1",      // warm ivory
  textSecondary: "#9DB1C9",    // muted blue-grey
  textTertiary: "#5F7894",     // softer

  // Borders
  border: "rgba(197,165,89,0.18)",
  borderStrong: "rgba(255,215,0,0.45)",
  borderSoft: "rgba(255,255,255,0.06)",

  // States
  success: "#3FB68E",
  warning: "#E8A53A",
  danger: "#D9534F",
  dangerDim: "rgba(217,83,79,0.14)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const FONTS = {
  serif: "Georgia",
  mono: "Courier",
  sans: "System",
} as const;
