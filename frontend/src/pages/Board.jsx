/**
 * Board.jsx — Collaborative Board Editor Page
 *
 * Route: /dashboard/:boardId or /board/:boardId (Protected)
 *
 * Responsibilities:
 *  1. Read :boardId from URL params.
 *  2. Fetch the board from Firestore.
 *  3. Determine user role (owner vs editor/viewer collaborator).
 *  4. Wire liveShapes to useAutosave for debounced persistence.
 *  5. Mount <WhiteBoard /> with real-time collaboration parameters.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { getBoard } from "../services/board.service";
import useAutosave from "../hooks/useAutosave";
import WhiteBoard from "../components/WhiteBoard";

// ---------------------------------------------------------------------------
// Loading Screen
// ---------------------------------------------------------------------------
function BoardLoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      <p className="text-sm text-gray-500 tracking-wide">Loading whiteboard…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board Not Found Screen
// ---------------------------------------------------------------------------
function BoardNotFoundScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 gap-4 text-center px-6">
      <div className="text-4xl">🗒️</div>
      <h2 className="text-xl font-semibold text-white">Board not found</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        This board doesn't exist or you may not have permission to view it.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BoardPage Component
// ---------------------------------------------------------------------------
function BoardPage() {
  const { boardId } = useParams();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userRole, setUserRole] = useState("editor");

  // Live shapes state — fed into useAutosave for debounced Firestore writes
  const [liveShapes, setLiveShapes] = useState([]);

  // -------------------------------------------------------------------------
  // Fetch & verify access
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!boardId || !user?.uid) return;

    let cancelled = false;

    const verify = async () => {
      setLoading(true);
      try {
        const data = await getBoard(boardId);

        if (cancelled) return;

        if (!data) {
          setNotFound(true);
          return;
        }

        // Determine user role
        const isOwner = data.ownerId === user.uid;
        const role = isOwner ? "owner" : "editor";
        setUserRole(role);

        setBoard(data);
        setLiveShapes(data.shapes ?? []);
      } catch (err) {
        console.error("[BoardPage] load error:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [boardId, user?.uid]);

  // -------------------------------------------------------------------------
  // Autosave — only the board owner saves to Firestore to avoid write collisions
  // Collaborators sync their shapes via Socket.IO in real-time
  // -------------------------------------------------------------------------
  const shouldAutosave = board && userRole === "owner";
  useAutosave(shouldAutosave ? boardId : null, liveShapes);

  const handleShapesChange = useCallback((shapes) => {
    setLiveShapes(shapes);
  }, []);

  if (loading) return <BoardLoadingScreen />;
  if (notFound) return <BoardNotFoundScreen />;
  if (!board) return null;

  return (
    <div className="w-full h-screen items-center justify-center relative">
      {/* ── Top-Left: Navigation & Board Title ── */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <Link
          to="/dashboard"
          id="btn-back-to-dashboard"
          className="flex items-center gap-1.5 rounded-lg border border-gray-700/80 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition"
        >
          ← Dashboard
        </Link>
        <span
          className="rounded-lg border border-gray-700/60 bg-gray-900/70 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-300 max-w-[180px] truncate font-medium"
          title={board.title}
        >
          {board.title}
        </span>
      </div>

      {/* ── WhiteBoard Canvas & Collaboration ── */}
      <WhiteBoard
        initialShapes={board.shapes ?? []}
        onShapesChange={handleShapesChange}
        boardId={board.id}
        boardTitle={board.title}
        user={user}
        role={userRole}
      />
    </div>
  );
}

export default BoardPage;
