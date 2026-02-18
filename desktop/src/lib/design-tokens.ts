/** Exported design tokens for programmatic use */

export const colors = {
  dummyYellow: "#FFD700",
  dummyYellowBright: "#FFE94A",
  dummyYellowDeep: "#F5C800",
  dummyBlack: "#1A1A1A",
  dummyBlackLight: "#2D2D2D",
  dummyWhite: "#FFFFFF",
  dummyRed: "#CC0000",
} as const;

export const vibeColors = {
  clean: { bg: "#F8F9FA", accent: "#2563EB", text: "#1A1A1A" },
  warm: { bg: "#FFF8F0", accent: "#D97706", text: "#3D2B1F" },
  bold: { bg: "#FFF0F5", accent: "#DC2626", text: "#1A1A1A" },
  dark: { bg: "#0F172A", accent: "#818CF8", text: "#F8FAFC" },
} as const;
