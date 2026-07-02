/**
 * Home.jsx — Dashboard Page
 *
 * Route: /dashboard (Protected)
 *
 * Displays the user's board library with full CRUD capabilities:
 *  - User profile + plan badge
 *  - Board count vs limit indicator
 *  - Search boards (client-side)
 *  - Create, open, rename, duplicate, delete boards
 *
 * All Firebase interactions go through useBoards() and useAuth().
 * No Firestore SDK code lives here.
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { useToast } from "../components/Toast";
import useBoards from "../hooks/useBoards";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const timeAgo = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
function DashboardPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    boards,
    userDoc,
    loading,
    error,
    createBoard,
    deleteBoard,
    renameBoard,
    duplicateBoard,
  } = useBoards();

  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const renameInputRef = useRef(null);

  // Focus rename input when it mounts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.focus(), 10);
    }
  }, [renamingId]);

  // -------------------------------------------------------------------------
  // Filtered boards (client-side search)
  // -------------------------------------------------------------------------
  const filteredBoards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter((b) => b.title.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  // -------------------------------------------------------------------------
  // Board limit info
  // -------------------------------------------------------------------------
  const boardCount = userDoc?.boardCount ?? 0;
  const boardLimit = userDoc?.boardLimit ?? 5;
  const atLimit = boardCount >= boardLimit;
  const limitPercent = Math.min((boardCount / boardLimit) * 100, 100);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleCreateBoard = async () => {
    if (atLimit) {
      toast.error("Board limit reached. Upgrade to Pro for unlimited boards.");
      return;
    }
    setActionLoading("new");
    const result = await createBoard();
    setActionLoading(null);
    if (result?.error === "BOARD_LIMIT_REACHED") {
      toast.error("Board limit reached. Upgrade to Pro for unlimited boards.");
    } else if (result?.error) {
      toast.error(result.error);
    }
    // On success, useBoards navigates automatically
  };

  const handleDelete = async (boardId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(boardId);
    const result = await deleteBoard(boardId);
    setActionLoading(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${title}" deleted.`);
    }
  };

  const handleDuplicate = async (boardId, title) => {
    if (atLimit) {
      toast.error("Board limit reached. Delete a board or upgrade to duplicate.");
      return;
    }
    setActionLoading(boardId);
    const result = await duplicateBoard(boardId);
    setActionLoading(null);
    if (result?.error === "BOARD_LIMIT_REACHED") {
      toast.error("Board limit reached. Delete a board or upgrade to duplicate.");
    } else if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`"${title}" duplicated.`);
    }
  };

  const startRename = (board) => {
    setRenamingId(board.id);
    setRenameValue(board.title);
  };

  const commitRename = async (boardId) => {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed) return;
    setActionLoading(boardId);
    const result = await renameBoard(boardId, trimmed);
    setActionLoading(null);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate("/");
    } catch (err) {
      toast.error("Sign-out failed. Please try again.");
      setSigningOut(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ------------------------------------------------------------------
          Header
      ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-gray-950/90 backdrop-blur-md px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight">DRAVISN</span>
        </div>

        {/* User info + sign out */}
        <div className="flex items-center gap-4">
          {/* Plan badge */}
          {userDoc?.plan && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 capitalize">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              {userDoc.plan}
            </span>
          )}

          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="h-8 w-8 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                {(user?.displayName ?? user?.email ?? "U")[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm text-gray-300 max-w-[160px] truncate">
              {user?.displayName ?? user?.email}
            </span>
          </div>

          <button
            id="btn-sign-out"
            onClick={handleLogout}
            disabled={signingOut}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          Main content
      ------------------------------------------------------------------ */}
      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Top bar: title + create button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Boards</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? "Loading…"
                : `${boardCount} / ${boardLimit} boards used`}
            </p>
          </div>

          <button
            id="btn-create-board"
            onClick={handleCreateBoard}
            disabled={actionLoading === "new" || atLimit}
            title={atLimit ? "Board limit reached" : "Create a new board"}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/20"
          >
            {actionLoading === "new" ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              <>+ New Board</>
            )}
          </button>
        </div>

        {/* Board limit progress bar */}
        <div className="mb-8 rounded-xl border border-white/5 bg-gray-900/50 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Storage</span>
            <span className={`text-xs font-medium ${atLimit ? "text-red-400" : "text-gray-400"}`}>
              {boardCount} / {boardLimit} boards
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                atLimit ? "bg-red-500" : limitPercent > 75 ? "bg-yellow-500" : "bg-indigo-500"
              }`}
              style={{ width: `${limitPercent}%` }}
            />
          </div>
          {atLimit && (
            <p className="mt-2 text-xs text-red-400">
              Board limit reached. Delete a board to create more.
            </p>
          )}
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="board-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search boards…"
            className="w-full rounded-xl border border-white/5 bg-gray-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900 transition"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-white/5 bg-gray-900/50 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredBoards.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-800 py-28 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800/60 text-2xl">
              🎨
            </div>
            {searchQuery ? (
              <>
                <p className="text-gray-400 font-medium">No boards match "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 font-medium">No boards yet.</p>
                <button
                  onClick={handleCreateBoard}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  Create your first board →
                </button>
              </>
            )}
          </div>
        )}

        {/* Board grid */}
        {!loading && filteredBoards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                className="group relative flex flex-col rounded-2xl border border-white/5 bg-gray-900/70 p-5 transition-all duration-200 hover:border-indigo-500/30 hover:bg-gray-900 hover:shadow-xl hover:shadow-black/30"
              >
                {/* Board thumbnail / preview area */}
                <div className="mb-4 h-24 w-full rounded-xl bg-gray-800/60 border border-white/5 flex items-center justify-center overflow-hidden">
                  <div className="grid grid-cols-3 gap-1 p-3 w-full opacity-40">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-2 rounded-full bg-indigo-400"
                        style={{ width: `${40 + (i * 13) % 50}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Title — inline rename */}
                {renamingId === board.id ? (
                  <input
                    ref={renameInputRef}
                    id={`rename-input-${board.id}`}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(board.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(board.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="mb-1 w-full rounded-lg bg-gray-800 px-2.5 py-1.5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <h3
                    className="mb-1 truncate text-sm font-semibold text-white cursor-pointer hover:text-indigo-300 transition"
                    onDoubleClick={() => startRename(board)}
                    title="Double-click to rename"
                  >
                    {board.title}
                  </h3>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span>Edited {timeAgo(board.updatedAt)}</span>
                  <span>Created {formatDate(board.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <button
                    id={`btn-open-${board.id}`}
                    onClick={() => navigate(`/dashboard/${board.id}`)}
                    disabled={actionLoading === board.id}
                    className="flex-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    Open
                  </button>
                  <button
                    id={`btn-duplicate-${board.id}`}
                    onClick={() => handleDuplicate(board.id, board.title)}
                    disabled={actionLoading === board.id}
                    title="Duplicate board"
                    className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition disabled:opacity-50"
                  >
                    Copy
                  </button>
                  <button
                    id={`btn-rename-${board.id}`}
                    onClick={() => startRename(board)}
                    disabled={actionLoading === board.id}
                    title="Rename board"
                    className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-400 hover:border-gray-500 hover:text-white transition disabled:opacity-50"
                  >
                    ✎
                  </button>
                  <button
                    id={`btn-delete-${board.id}`}
                    onClick={() => handleDelete(board.id, board.title)}
                    disabled={actionLoading === board.id}
                    title="Delete board"
                    className="rounded-lg border border-red-900/60 px-2.5 py-1.5 text-xs text-red-500 hover:border-red-500 hover:text-red-300 transition disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                {/* Per-card loading overlay */}
                {actionLoading === board.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gray-900/70 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;