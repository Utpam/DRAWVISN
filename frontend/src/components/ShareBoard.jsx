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
    <div className="share-board">
      {/* ── Share Trigger Button ── */}
      <button
        id="btn-share-board"
        onClick={() => setIsOpen(true)}
        className="share-board__trigger"
        title={`Share ${boardTitle}`}
        aria-label={`Share ${boardTitle}`}
      >
        <svg
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
            className="share-board__backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="share-board__dialog"
            style={{ animation: "fadeIn 0.15s ease-out" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
          >
            <div className="share-board__dialog-header">
              <h4 id="share-dialog-title">Share board</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="share-board__close"
                aria-label="Close share dialog"
              >
                ×
              </button>
            </div>

            <p className="share-board__description">
              Anyone with this link can view and collaborate in real-time.
            </p>

            {/* URL Display & Copy */}
            <div className="share-board__copy-row">
              <input
                readOnly
                value={shareUrl}
                aria-label="Share link"
                className="share-board__url"
              />
              <button
                id="btn-copy-share-url"
                type="button"
                onClick={handleCopyLink}
                className="share-board__copy"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="share-board__access">
              <span>Link access</span>
              <span>Real-time collaboration</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareBoard;
