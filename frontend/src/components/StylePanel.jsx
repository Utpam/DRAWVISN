import React, { useCallback, useState } from "react";
import { DEFAULT_STYLE } from "../styles/defaultStyle";
import { getThemeStrokeColor, resolveThemeStrokeColor } from "../utils/themeStroke";

const ALL_COLORS = [
  { label: "Black", value: "#1a1a1a" },
  { label: "White", value: "#ffffff" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
];

const STROKE_COLORS = ALL_COLORS.filter(
  (color) => color.value !== "#1a1a1a" && color.value !== "#ffffff"
);
const FILL_COLORS = [{ label: "No fill", value: "transparent" }, ...ALL_COLORS];
const STROKE_WIDTHS = [1, 2, 4, 6, 8, 10];
const LINE_STYLES = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dash" },
  { value: "dotted", label: "Dot" },
];
const LINE_CAPS = [
  { value: "butt", label: "Butt" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
];
const LINE_JOINS = [
  { value: "miter", label: "Miter" },
  { value: "round", label: "Round" },
  { value: "bevel", label: "Bevel" },
];

function Section({ title, children, className = "" }) {
  return (
    <section className={`property-section ${className}`}>
      <h3 className="property-section__title">{title}</h3>
      {children}
    </section>
  );
}

function Swatch({ color, active, onClick, label }) {
  return (
    <button
      type="button"
      className={`property-swatch${active ? " is-active" : ""}${color === "transparent" ? " is-empty" : ""}`}
      style={color === "transparent" ? undefined : { "--swatch-color": color }}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={() => onClick(color)}
    >
      {color === "transparent" && <span aria-hidden="true" />}
    </button>
  );
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="property-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RangeControl({ label, min, max, step, value, onChange, format }) {
  return (
    <label className="property-range">
      <span className="property-range__heading">
        <span>{label}</span>
        <output>{format(value)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="property-range__limits">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </span>
    </label>
  );
}

function ColorControl({
  title,
  value,
  colors,
  onChange,
  activeValue = value,
  normalizeChange = (color) => color,
}) {
  const handleChange = (color) => onChange(normalizeChange(color));

  return (
    <Section title={title}>
      <div className="property-color-row">
        {colors.map((color) => (
          <Swatch
            key={color.value}
            color={color.value}
            label={color.label}
            active={activeValue === color.value}
            onClick={handleChange}
          />
        ))}
        <label className="property-custom-color" title={`Custom ${title.toLowerCase()}`}>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
            aria-label={`Custom ${title.toLowerCase()}`}
            onChange={(event) => handleChange(event.target.value)}
          />
          <span aria-hidden="true">+</span>
        </label>
      </div>
    </Section>
  );
}

function StylePanel({ currentStyle, setCurrentStyle, selectedIds, shapes, setShapes, tool, isDark }) {
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia("(max-width: 700px)").matches
  );
  const hasSelection = selectedIds?.length > 0;
  const selectedShape = hasSelection
    ? shapes?.find((shape) => shape.id === selectedIds[0])
    : null;
  const activeTool = selectedShape?.type || tool;
  const activeStyle = {
    ...DEFAULT_STYLE,
    ...(selectedShape?.style ?? currentStyle),
  };
  const activeStrokeColor = resolveThemeStrokeColor(activeStyle.strokeColor, isDark);
  const themeStrokeColors = [
    ...STROKE_COLORS,
    { label: isDark ? "White" : "Black", value: getThemeStrokeColor(isDark) },
  ];

  const update = useCallback((key, value) => {
    if (hasSelection) {
      setShapes((previous) => previous.map((shape) => (
        selectedIds.includes(shape.id)
          ? {
              ...shape,
              style: { ...DEFAULT_STYLE, ...(shape.style ?? {}), [key]: value },
            }
          : shape
      )));
    } else {
      setCurrentStyle((previous) => ({ ...previous, [key]: value }));
    }
  }, [hasSelection, selectedIds, setShapes, setCurrentStyle]);

  const needsSelection = tool === "selectBox" && !hasSelection;
  const isEraser = tool === "eraser" && !hasSelection;
  const supportsFill = activeTool === "rect" || activeTool === "circle";
  const supportsLineEnds = activeTool === "pen" || activeTool === "line";
  const panelLabel = needsSelection
    ? "Selection"
    : isEraser
      ? "Eraser"
      : hasSelection
        ? `${selectedIds.length} selected`
        : `${activeTool} properties`;

  return (
    <aside className={`properties-panel${collapsed ? " is-collapsed" : ""}`}>
      <div className="properties-panel__header">
        {!collapsed && (
          <div className="properties-panel__heading">
            <h2>Properties</h2>
            <span>{panelLabel}</span>
          </div>
        )}
        <button
          type="button"
          className="properties-panel__collapse"
          aria-label={collapsed ? "Expand properties panel" : "Collapse properties panel"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((previous) => !previous)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d={collapsed ? "m7 4 6 6-6 6" : "m13 4-6 6 6 6"} />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="properties-panel__body">
          {needsSelection ? (
            <p className="properties-panel__message">
              Select a shape to edit its appearance and style.
            </p>
          ) : isEraser ? (
            <p className="properties-panel__message">
              The eraser removes whole shapes. Choose a shape and click it to remove it.
            </p>
          ) : (
            <>
              <ColorControl
                title="Stroke"
                value={activeStrokeColor}
                activeValue={activeStrokeColor}
                colors={themeStrokeColors}
                normalizeChange={(value) => resolveThemeStrokeColor(value, isDark)}
                onChange={(value) => update("strokeColor", value)}
              />

              {supportsFill && (
                <ColorControl
                  title="Fill"
                  value={activeStyle.fillColor}
                  colors={FILL_COLORS}
                  onChange={(value) => update("fillColor", value)}
                />
              )}

              {activeTool !== "text" && (
                <Section title="Stroke width">
                  <div className="property-widths" role="group" aria-label="Stroke width presets">
                    {STROKE_WIDTHS.map((width) => (
                      <button
                        key={width}
                        type="button"
                        aria-label={`${width} pixel stroke`}
                        aria-pressed={activeStyle.strokeWidth === width}
                        className={activeStyle.strokeWidth === width ? "is-active" : ""}
                        onClick={() => update("strokeWidth", width)}
                      >
                        {width}
                      </button>
                    ))}
                  </div>
                  <RangeControl
                    label="Stroke width"
                    min={1}
                    max={20}
                    step={1}
                    value={activeStyle.strokeWidth}
                    onChange={(value) => update("strokeWidth", value)}
                    format={(value) => `${value}px`}
                  />
                </Section>
              )}

              {activeTool !== "text" && (
                <Section title="Line style">
                  <SegmentedControl
                    label="Line style"
                    options={LINE_STYLES}
                    value={activeStyle.lineStyle}
                    onChange={(value) => update("lineStyle", value)}
                  />
                </Section>
              )}

              {supportsLineEnds && (
                <>
                  <Section title="Line cap">
                    <SegmentedControl
                      label="Line cap"
                      options={LINE_CAPS}
                      value={activeStyle.lineCap}
                      onChange={(value) => update("lineCap", value)}
                    />
                  </Section>
                  <Section title="Line join">
                    <SegmentedControl
                      label="Line join"
                      options={LINE_JOINS}
                      value={activeStyle.lineJoin}
                      onChange={(value) => update("lineJoin", value)}
                    />
                  </Section>
                </>
              )}

              <Section title="Opacity">
                <RangeControl
                  label="Opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={activeStyle.opacity}
                  onChange={(value) => update("opacity", value)}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
              </Section>

              <Section title="Shadow">
                <label className="property-toggle">
                  <span>{activeStyle.shadow ? "On" : "Off"}</span>
                  <input
                    type="checkbox"
                    checked={activeStyle.shadow}
                    onChange={(event) => update("shadow", event.target.checked)}
                    aria-label="Enable shadow"
                  />
                </label>
                {activeStyle.shadow && (
                  <>
                    <div className="property-color-row property-color-row--compact">
                      {ALL_COLORS.map((color) => (
                        <Swatch
                          key={color.value}
                          color={color.value}
                          label={`Shadow ${color.label.toLowerCase()}`}
                          active={activeStyle.shadowColor === color.value}
                          onClick={(value) => update("shadowColor", value)}
                        />
                      ))}
                    </div>
                    <RangeControl
                      label="Shadow blur"
                      min={0}
                      max={50}
                      step={1}
                      value={activeStyle.shadowBlur}
                      onChange={(value) => update("shadowBlur", value)}
                      format={(value) => `${value}px`}
                    />
                  </>
                )}
              </Section>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

export default StylePanel;
