/**
 * applyStyle.js — Canvas Context Style Applicator
 *
 * Reads a shape's style object and writes every property to a 2D canvas context.
 * ALWAYS call this inside ctx.save() / ctx.restore() so styles don't leak
 * between shape renders.
 *
 * Usage:
 *   ctx.save();
 *   applyStyle(ctx, shape.style ?? DEFAULT_STYLE);
 *   // … draw geometry …
 *   ctx.restore();
 */

import { DEFAULT_STYLE } from "../styles/defaultStyle";

/**
 * Line-dash lookup table for the three supported lineStyle values.
 * @type {Record<string, number[]>}
 */
const LINE_DASH_MAP = {
  solid:  [],
  dashed: [10, 5],
  dotted: [2,  4],
};

/**
 * Applies all relevant style properties to a canvas 2D context.
 *
 * Missing properties are filled from DEFAULT_STYLE, so this is safe to call
 * even on partially-defined style objects (e.g. old boards missing new fields).
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to configure.
 * @param {Partial<typeof DEFAULT_STYLE>} style - Style object from a shape or currentStyle.
 */
export const applyStyle = (ctx, style) => {
  // Merge with defaults so callers don't have to worry about missing keys
  const s = { ...DEFAULT_STYLE, ...style };

  // ── Opacity (must be set before any draw call) ────────────────────────────
  ctx.globalAlpha = s.opacity;

  // ── Stroke properties ─────────────────────────────────────────────────────
  ctx.strokeStyle = s.strokeColor;
  ctx.lineWidth   = s.strokeWidth;
  ctx.lineCap     = s.lineCap;
  ctx.lineJoin    = s.lineJoin;

  // ── Fill ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = s.fillColor;

  // ── Line dash ─────────────────────────────────────────────────────────────
  ctx.setLineDash(LINE_DASH_MAP[s.lineStyle] ?? []);

  // ── Shadow ────────────────────────────────────────────────────────────────
  if (s.shadow) {
    ctx.shadowColor = s.shadowColor;
    ctx.shadowBlur  = s.shadowBlur;
  } else {
    // Explicitly clear shadow so it doesn't bleed from a previous render
    ctx.shadowColor = "transparent";
    ctx.shadowBlur  = 0;
  }
};
