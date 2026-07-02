import { useEffect } from "react";
import eraserCursor from "../assets/Icons/eraser-cursor.png";

/* ─── Tool definitions ────────────────────────────────────────────────────── */

const TOOLS = [
  {
    id: "pen",
    title: "Pen (P)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 19l7-7-3-3-7 7v3h3z"/><path d="M17.5 7.5l-1-1a2 2 0 0 0-2.83 0L12 8.17"/>
      </svg>
    ),
  },
  {
    id: "eraser",
    title: "Eraser (E)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 20H7L3 16l11-11 6 6-3.5 3.5"/><path d="M6.0 11.0 13 18"/>
      </svg>
    ),
  },
  {
    id: "selectBox",
    title: "Select (V)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M5 3l14 9-7 1-3 6z"/>
      </svg>
    ),
  },
  {
    id: "rect",
    title: "Rectangle (R)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
      </svg>
    ),
  },
  {
    id: "circle",
    title: "Circle (C)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
  {
    id: "line",
    title: "Line (L)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
        <line x1="5" y1="19" x2="19" y2="5"/>
      </svg>
    ),
  },
  {
    id: "text",
    title: "Text (T)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
      </svg>
    ),
  },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

function Toolbar({ setTool, tool, isDark }) {
  // Update cursor when tool changes
  useEffect(() => {
    const cursors = {
      eraser:    `url('${eraserCursor}') 0 50, auto`,
      pen:       "crosshair",
      rect:      "crosshair",
      circle:    "crosshair",
      line:      "crosshair",
      text:      "text",
      selectBox: "default",
    };
    document.body.style.cursor = cursors[tool] ?? "default";
  }, [tool]);

  return (
    <>
      {TOOLS.map(({ id, title, icon }) => {
        const isActive = tool === id;
        return (
          <button
            key={id}
            id={`tool-${id}`}
            title={title}
            onClick={() => setTool(id)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
              flexShrink: 0,
              background: isActive
                ? "var(--brand)"
                : "transparent",
              color: isActive
                ? "#fff"
                : "var(--text-secondary)",
              boxShadow: isActive ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = "var(--surface-3)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }
            }}
          >
            {icon}
          </button>
        );
      })}
    </>
  );
}

export { Toolbar };