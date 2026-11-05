const LIGHT_STROKES = new Set([
  "#fff",
  "#ffffff",
  "white",
  "rgb(255,255,255)",
  "rgb(255, 255, 255)",
]);
const DARK_STROKES = new Set([
  "#000",
  "#000000",
  "#1a1a1a",
  "black",
  "rgb(0,0,0)",
  "rgb(0, 0, 0)",
]);

export const getThemeStrokeColor = (isDark) => isDark ? "#ffffff" : "#000000";

export const resolveThemeStrokeColor = (color, isDark) => {
  if (typeof color !== "string") return color;
  const normalized = color.trim().toLowerCase();
  if (LIGHT_STROKES.has(normalized) || DARK_STROKES.has(normalized)) {
    return getThemeStrokeColor(isDark);
  }
  return color;
};
