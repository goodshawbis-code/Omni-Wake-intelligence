// Command Center Navy/Gold — Military-HBCU tactical theme
export const COLORS = {
  background: "#020617",
  surface: "#0F172A",
  surfaceElevated: "#1E293B",
  surfaceMuted: "#0B1220",
  primary: "#D4AF37", // HBCU gold
  primaryHover: "#FDE047",
  primaryDim: "rgba(212,175,55,0.12)",
  primaryGlow: "rgba(212,175,55,0.25)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(212,175,55,0.35)",
  accentNavy: "#0A1128",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
  dangerDim: "rgba(239,68,68,0.12)",
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
  sm: 4,
  md: 6,
  lg: 8,
  pill: 999,
} as const;

export const FONTS = {
  serif: "Georgia", // Playfair Display fallback
  body: "System",
  mono: "Courier",
} as const;

export const LEGAL_FOOTER = "A DIVISION OF BRICK OUTDOOR LIVING, INC.";
