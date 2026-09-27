/**
 * Collaborators.jsx — Real-Time Presence & Collaborator Avatars
 *
 * Displays:
 *  - Live avatar list of users currently in the whiteboard
 *  - Connection health badge (Connected, Reconnecting, Offline)
 *  - Popover with active user names and roles
 */

import React, { useState } from "react";
import { getCollaboratorColor } from "./CursorOverlay";

export const Collaborators = ({
  collaborators = [],
  currentUser = null,
  connectionStatus = "connected",
}) => {
  const [showList, setShowList] = useState(false);

  // If connected and collaborators list hasn't arrived yet, include local user
  const effectiveCollaborators =
    collaborators.length > 0
      ? collaborators
      : currentUser
      ? [
          {
            socketId: "self",
            userId: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "You",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            role: "owner",
          },
        ]
      : [];

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return { label: "LIVE", color: "#10b981", title: "Connected to real-time server" };
      case "connecting":
      case "reconnecting":
        return { label: "CONNECTING", color: "#f59e0b", title: "Connecting to server..." };
      case "error":
      case "disconnected":
      default:
        return { label: "OFFLINE", color: "#9ca3af", title: "Disconnected from server" };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="relative flex items-center gap-2">
      {/* ── Status Indicator Pill ── */}
      <div
        className="flex items-center gap-1.5 rounded-lg border border-gray-700/60 bg-gray-900/80 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
        style={{ color: status.color }}
        title={status.title}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: status.color,
            boxShadow: connectionStatus === "connected" ? `0 0 6px ${status.color}` : "none",
          }}
        />
        <span className="text-[10px] tracking-wider font-mono">{status.label}</span>
      </div>

      {/* ── Collaborator Avatar Stack ── */}
      <div
        onClick={() => setShowList((prev) => !prev)}
        className="flex cursor-pointer items-center -space-x-2 rounded-lg border border-gray-700/60 bg-gray-900/80 p-1 backdrop-blur-sm hover:border-gray-500 transition"
        title="View active collaborators"
      >
        {effectiveCollaborators.slice(0, 4).map((c, i) => {
          const color = getCollaboratorColor(c.userId || c.socketId);
          const initial = (c.displayName || c.email || "U").charAt(0).toUpperCase();

          return (
            <div
              key={c.socketId || i}
              style={{
                backgroundColor: color,
                borderColor: "var(--toolbar-border, #1f2937)",
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold text-white shadow-sm"
              title={`${c.displayName} (${c.role || "collaborator"})`}
            >
              {c.photoURL ? (
                <img
                  src={c.photoURL}
                  alt={c.displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
          );
        })}

        {effectiveCollaborators.length > 4 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-[10px] font-semibold text-gray-300">
            +{effectiveCollaborators.length - 4}
          </div>
        )}
      </div>

      {/* ── Collaborators Dropdown Popover ── */}
      {showList && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowList(false)}
          />
          <div
            className="absolute top-10 right-0 z-50 w-56 rounded-xl border border-gray-800 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-md"
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            <div className="mb-2 flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-semibold text-gray-300">
                Active Users ({effectiveCollaborators.length})
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Real-time</span>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {effectiveCollaborators.map((c) => {
                const color = getCollaboratorColor(c.userId || c.socketId);
                const isYou = currentUser && c.userId === currentUser.uid;
                return (
                  <div
                    key={c.socketId}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-xs text-gray-200">
                        {c.displayName || c.email || "Collaborator"} {isYou ? "(You)" : ""}
                      </span>
                    </div>
                    <span className="text-[10px] capitalize text-gray-500 font-mono">
                      {c.role || "editor"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Collaborators;
