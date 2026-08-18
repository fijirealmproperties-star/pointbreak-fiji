export const theme = {
  bg: "#07141F",
  surface: "#0C2031",
  surfaceAlt: "#123145",
  surfaceSunken: "#07101A",
  border: "#1C4058",
  borderStrong: "#2A5875",
  text: "#EAF6FF",
  textMuted: "#93B4C9",
  textFaint: "#5D7E94",
  accent: "#00B4D8",
  accentBright: "#22D3EE",
  accentDeep: "#0077B6",
  accentSoft: "#0E2C3F",
  gold: "#FFC93C",
  ocean: "#0091AD",
  wave: "#4DD6E8",
  success: "#2DD4A0",
  successSoft: "#0E3A30",
  danger: "#FF5A5A",
  dangerSoft: "#3A1414",
  warning: "#FFC93C",
  warningSoft: "#3A2E0E",
  info: "#60A5FA",
  rider: "#22D3EE",
  driver: "#FFC93C",
  inputBg: "#0E283A",
  card: "#0E2740",
  overlay: "rgba(4,12,20,0.82)",
} as const;

export type Theme = typeof theme;

export const isDark = true;
