/**
 * ShareBoard.jsx — Shareable Board Link & Collaboration Modal
 *
 * Provides a "Share" button with a popover modal to:
 *  - Copy the board link to clipboard
 *  - View shareable URL
 *  - Manage collaboration access
 */

import React, { useState } from "react";

export const ShareBoard = ({ boardId, boardTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/dashboard/${boardId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy URL:", err);
    }
  };

  return (
    <div className="relative">
      {/* ── Share Trigger Button ── */}
      <button
        id="btn-share-board"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-indigo-600/60 bg-indigo-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition backdrop-blur-sm"
        title="Share this whiteboard"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>Share</span>
      </button>

      {/* ── Share Modal / Popover ── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-10 right-0 z-50 w-80 rounded-2xl border border-gray-800 bg-gray-900/95 p-4 shadow-2xl backdrop-blur-md"
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Share Whiteboard</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="mb-3 text-xs text-gray-400">
              Anyone with this link can view and collaborate in real-time.
            </p>

            {/* URL Display & Copy */}
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950/80 p-1.5">
              <input
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2 text-xs text-gray-300 outline-none select-all font-mono"
              />
              <button
                id="btn-copy-share-url"
                onClick={handleCopyLink}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mt-4 border-t border-gray-800/80 pt-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Access Permission</span>
                <span className="rounded bg-indigo-950 px-2 py-0.5 text-indigo-300 font-mono font-medium">
                  Real-time Editor
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareBoard;
