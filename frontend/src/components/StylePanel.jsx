/**
 * StylePanel.jsx — Floating Shape Style Inspector & Editor
 *
 * Context-aware:
 *  - No selection → edits `currentStyle` (future shapes)
 *  - 1+ shapes selected → immediately edits every selected shape's style
 *
 * Fully theme-aware via CSS custom properties (no hardcoded dark colours).
 * Collapses to an icon strip on the right edge of the viewport.
 */

import React, { useState, useCallback } from "react";
import { DEFAULT_STYLE } from "../styles/defaultStyle";

// ─── Preset palettes ─────────────────────────────────────────────────────────

const STROKE_COLORS = [
  { label: "Black",  value: "#1a1a1a" },
  { label: "White",  value: "#ffffff" },
  { label: "Red",    value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green",  value: "#22c55e" },
  { label: "Cyan",   value: "#06b6d4" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink",   value: "#ec4899" },
];

const FILL_COLORS = [
  { label: "None", value: "transparent" },
  ...STROKE_COLORS,
];

const STROKE_WIDTHS = [1, 2, 4, 6, 8, 10];

const LINE_STYLES = [
  { value: "solid",  label: "—",   title: "Solid" },
  { value: "dashed", label: "╌╌",  title: "Dashed" },
  { value: "dotted", label: "···", title: "Dotted" },
];

const LINE_CAPS  = [
  { value: "butt",   label: "Butt"   },
  { value: "round",  label: "Round"  },
  { value: "square", label: "Square" },
];

const LINE_JOINS = [
  { value: "miter", label: "Miter" },
  { value: "round", label: "Round" },
  { value: "bevel", label: "Bevel" },
];

// ─── Shared styles (inline, so they respond to CSS vars) ─────────────────────

const panelStyle = {
  background:         "var(--surface-1)",
  border:             "1px solid var(--border)",
  boxShadow:          "var(--shadow-lg)",
  backdropFilter:     "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
};

const headerStyle = {
  borderBottom: "1px solid var(--border)",
  cursor: "pointer",
};

const labelStyle = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 6,
  marginTop: 4,
};

const btnBase = {
  border: "none",
  cursor: "pointer",
  transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <span style={labelStyle}>{children}</span>;
}

function Swatch({ color, active, onClick, title }) {
  const isTransparent = color === "transparent";
  return (
    <button
      title={title}
      onClick={() => onClick(color)}
      style={{
        ...btnBase,
        width: 20, height: 20,
        borderRadius: "50%",
        flexShrink: 0,
        backgroundColor: isTransparent ? "transparent" : color,
        outline: active ? "2px solid var(--brand)" : "2px solid transparent",
        outlineOffset: 2,
        transform: active ? "scale(1.15)" : "scale(1)",
        padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {isTransparent && (
        <svg viewBox="0 0 20 20" fill="none" style={{ width: "100%", height: "100%" }}>
          <circle cx="10" cy="10" r="8" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="3" y1="17" x2="17" y2="3" stroke="#ef4444" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 2,
      background: "var(--surface-2)",
      borderRadius: 9,
      padding: 2,
    }}>
      {options.map(opt => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            title={opt.title ?? opt.label}
            onClick={() => onChange(opt.value)}
            style={{
              ...btnBase,
              flex: 1,
              paddingTop: 4, paddingBottom: 4,
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 600,
              background: isActive ? "var(--brand)" : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
              boxShadow: isActive ? "0 1px 6px rgba(99,102,241,0.3)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      style={{
        ...btnBase,
        position: "relative",
        width: 36, height: 20,
        borderRadius: 10,
        background: enabled ? "var(--brand)" : "var(--surface-3)",
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2, left: enabled ? 17 : 2,
        width: 16, height: 16,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.18s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function StyledRange({ min, max, step, value, onChange, label }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{min}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{max}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: 4,
          borderRadius: 99,
          appearance: "none",
          WebkitAppearance: "none",
          cursor: "pointer",
          background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${pct}%, var(--surface-3) ${pct}%, var(--surface-3) 100%)`,
          outline: "none",
          border: "none",
        }}
      />
    </div>
  );
}

// ─── Custom colour picker button ──────────────────────────────────────────────

function CustomColorPicker({ value, onChange, title = "Custom colour" }) {
  return (
    <label
      title={title}
      style={{
        width: 20, height: 20, flexShrink: 0,
        borderRadius: "50%",
        border: "2px dashed var(--border-strong)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 0.12s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-strong)"}
    >
      <input
        type="color"
        value={/^#/.test(value) ? value : "#ffffff"}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
      <svg width="9" height="9" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </label>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   currentStyle: object,
 *   setCurrentStyle: Function,
 *   selectedIds: string[],
 *   shapes: object[],
 *   setShapes: Function,
 *   isDark: boolean,
 * }} props
 */
function StylePanel({ currentStyle, setCurrentStyle, selectedIds, shapes, setShapes, isDark }) {
  const [collapsed, setCollapsed] = useState(false);

  const hasSelection = selectedIds?.length > 0;

  const selectedShape = hasSelection
    ? shapes?.find(s => s.id === selectedIds[0])
    : null;

  const activeStyle = {
    ...DEFAULT_STYLE,
    ...(selectedShape?.style ?? currentStyle),
  };

  // Update selected shapes or currentStyle
  const update = useCallback((key, value) => {
    if (hasSelection) {
      setShapes(prev =>
        prev.map(s =>
          selectedIds.includes(s.id)
            ? { ...s, style: { ...DEFAULT_STYLE, ...(s.style ?? {}), [key]: value } }
            : s
        )
      );
    } else {
      setCurrentStyle(prev => ({ ...prev, [key]: value }));
    }
  }, [hasSelection, selectedIds, setShapes, setCurrentStyle]);

  const modeLabel = hasSelection
    ? selectedIds.length === 1 ? "Shape" : `${selectedIds.length} shapes`
    : "Drawing";

  return (
    <div
      id="style-panel"
      style={{
        position: "fixed",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 50,
        userSelect: "none",
      }}
    >
      <div
        style={{
          ...panelStyle,
          borderRadius: 18,
          overflow: "hidden",
          width: collapsed ? 40 : 240,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          onClick={() => setCollapsed(c => !c)}
          style={{
            ...headerStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "10px 12px",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              {/* Live stroke colour dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                backgroundColor: activeStyle.strokeColor,
                boxShadow: `0 0 0 1.5px var(--border-strong)`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {modeLabel}
              </span>
              {hasSelection && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "var(--brand-muted)",
                  color: "var(--brand)",
                  borderRadius: 99,
                  padding: "2px 6px",
                  flexShrink: 0,
                }}>
                  {selectedIds.length === 1 ? selectedShape?.type : "Multi"}
                </span>
              )}
            </div>
          )}
          <button
            style={{
              ...btnBase,
              background: "transparent",
              color: "var(--text-muted)",
              padding: 2, borderRadius: 6,
              flexShrink: 0,
              marginLeft: collapsed ? 0 : "auto",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            )}
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {!collapsed && (
          <div style={{
            padding: "10px 12px",
            maxHeight: "76vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}>

            {/* ── Stroke Color ── */}
            <div>
              <SectionLabel>Stroke Color</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STROKE_COLORS.map(c => (
                  <Swatch key={c.value} color={c.value} title={c.label}
                    active={activeStyle.strokeColor === c.value}
                    onClick={v => update("strokeColor", v)} />
                ))}
                <CustomColorPicker
                  value={activeStyle.strokeColor}
                  onChange={v => update("strokeColor", v)}
                  title="Custom stroke colour"
                />
              </div>
            </div>

            {/* ── Fill Color ── */}
            <div>
              <SectionLabel>Fill Color</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FILL_COLORS.map(c => (
                  <Swatch key={c.value} color={c.value} title={c.label}
                    active={activeStyle.fillColor === c.value}
                    onClick={v => update("fillColor", v)} />
                ))}
                <CustomColorPicker
                  value={activeStyle.fillColor === "transparent" ? "#000000" : activeStyle.fillColor}
                  onChange={v => update("fillColor", v)}
                  title="Custom fill colour"
                />
              </div>
            </div>

            {/* ── Stroke Width ── */}
            <div>
              <SectionLabel>Stroke Width</SectionLabel>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {STROKE_WIDTHS.map(w => {
                  const isActive = activeStyle.strokeWidth === w;
                  return (
                    <button
                      key={w}
                      onClick={() => update("strokeWidth", w)}
                      title={`${w}px`}
                      style={{
                        ...btnBase,
                        minWidth: 28, padding: "3px 5px",
                        borderRadius: 7,
                        fontSize: 10, fontFamily: "monospace",
                        background: isActive ? "var(--brand)" : "var(--surface-2)",
                        color: isActive ? "#fff" : "var(--text-secondary)",
                        boxShadow: isActive ? "0 1px 6px rgba(99,102,241,0.3)" : "none",
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
              <StyledRange
                min={1} max={20} step={1}
                value={activeStyle.strokeWidth}
                onChange={v => update("strokeWidth", v)}
                label={`${activeStyle.strokeWidth}px`}
              />
            </div>

            {/* ── Line Style ── */}
            <div>
              <SectionLabel>Line Style</SectionLabel>
              <SegmentedControl options={LINE_STYLES} value={activeStyle.lineStyle} onChange={v => update("lineStyle", v)} />
            </div>

            {/* ── Line Cap ── */}
            <div>
              <SectionLabel>Line Cap</SectionLabel>
              <SegmentedControl options={LINE_CAPS} value={activeStyle.lineCap} onChange={v => update("lineCap", v)} />
            </div>

            {/* ── Line Join ── */}
            <div>
              <SectionLabel>Line Join</SectionLabel>
              <SegmentedControl options={LINE_JOINS} value={activeStyle.lineJoin} onChange={v => update("lineJoin", v)} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)" }} />

            {/* ── Opacity ── */}
            <div>
              <SectionLabel>Opacity</SectionLabel>
              <StyledRange
                min={0} max={1} step={0.01}
                value={activeStyle.opacity}
                onChange={v => update("opacity", v)}
                label={`${Math.round(activeStyle.opacity * 100)}%`}
              />
            </div>

            {/* ── Shadow ── */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <SectionLabel>Shadow</SectionLabel>
                <Toggle enabled={activeStyle.shadow} onChange={v => update("shadow", v)} />
              </div>

              {activeStyle.shadow && (
                <div style={{
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "10px 10px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div>
                    <SectionLabel>Shadow Color</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {STROKE_COLORS.map(c => (
                        <Swatch key={c.value} color={c.value} title={c.label}
                          active={activeStyle.shadowColor === c.value}
                          onClick={v => update("shadowColor", v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Blur</SectionLabel>
                    <StyledRange
                      min={0} max={50} step={1}
                      value={activeStyle.shadowBlur}
                      onChange={v => update("shadowBlur", v)}
                      label={`${activeStyle.shadowBlur}px`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StylePanel;
