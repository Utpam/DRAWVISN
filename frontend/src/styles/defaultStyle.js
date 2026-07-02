/**
 * defaultStyle.js — Canonical Shape Style Defaults
 *
 * Single source of truth for every style property.
 * All renderers fall back to this when shape.style is missing (old boards).
 * Extend here when adding new style properties (gradients, blend modes, etc.)
 */

export const DEFAULT_STYLE = {
  /** Stroke / outline colour */
  strokeColor: "#ffffff",

  /** Fill colour — "transparent" means no fill */
  fillColor: "transparent",

  /** Stroke thickness in world-space pixels */
  strokeWidth: 2,

  /** Global opacity 0–1 */
  opacity: 1,

  /** Line dash pattern: "solid" | "dashed" | "dotted" */
  lineStyle: "solid",

  /** ctx.lineCap: "round" | "square" | "butt" */
  lineCap: "round",

  /** ctx.lineJoin: "round" | "bevel" | "miter" */
  lineJoin: "round",

  /**
   * Roughness 0–3 — reserved for future rough.js integration.
   * Not rendered in the current pass.
   */
  roughness: 0,

  /** Drop-shadow toggle */
  shadow: false,

  /** Shadow colour (used when shadow === true) */
  shadowColor: "rgba(0,0,0,0.5)",

  /** Shadow blur radius (used when shadow === true) */
  shadowBlur: 10,
};
