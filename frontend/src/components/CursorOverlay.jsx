/**
 * CursorOverlay.jsx — Live Multi-User Remote Cursors
 *
 * Renders remote collaborators' cursor positions over the canvas.
 * Uses `worldToScreen` coordinate transform to map world positions to viewport pixels.
 */

import React from "react";

// Generate a deterministic color for each user/socket
export const getCollaboratorColor = (identifier = "") => {
  const colors = [
    "#f43f5e", // Rose
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#3b82f6", // Blue
    "#14b8a6", // Teal
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const CursorOverlay = ({ remoteCursors, worldToScreen }) => {
  if (!remoteCursors || Object.keys(remoteCursors).length === 0 || !worldToScreen) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 35 }}
    >
      {Object.entries(remoteCursors).map(([socketId, cursorData]) => {
        if (!cursorData || cursorData.x === undefined || cursorData.y === undefined) {
          return null;
        }

        const screenPos = worldToScreen(cursorData.x, cursorData.y);
        const color = getCollaboratorColor(cursorData.user?.uid || socketId);
        const name =
          cursorData.user?.displayName ||
          cursorData.user?.email?.split("@")[0] ||
          "Collaborator";

        return (
          <div
            key={socketId}
            style={{
              position: "absolute",
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: "translate(-2px, -2px)",
              transition: "left 0.04s ease-out, top 0.04s ease-out",
              willChange: "left, top",
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              <path d="M5.653 4.293a.965.965 0 0 0-1.36.002.97.97 0 0 0 0 1.363l6.56 6.56a.965.965 0 0 0 1.362 0l4.24-4.242a.964.964 0 0 0 0-1.363.97.97 0 0 0-1.363 0L12 8.793 5.653 4.293z" transform="rotate(-45 12 12)" />
            </svg>

            {/* User Name Tag */}
            <div
              style={{
                backgroundColor: color,
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "12px",
                marginLeft: "12px",
                marginTop: "-6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorOverlay;
