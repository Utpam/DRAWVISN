/**
 * Board.jsx — Board Editor Page
 *
 * Route: /dashboard/:boardId (Protected)
 *
 * Responsibilities:
 *  1. Read :boardId from URL params.
 *  2. Fetch the board from Firestore.
 *  3. Verify ownerId === currentUser.uid → redirect to /403 if not.
 *  4. Pass initialShapes and onShapesChange to <WhiteBoard /> for autosave.
 *
 * The canvas drawing engine (useDrawing, useCamera, etc.) is NOT modified.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { getBoard } from "../services/board.service";
import useAutosave from "../hooks/useAutosave";
import WhiteBoard from "../components/WhiteBoard";

// ---------------------------------------------------------------------------
// Loading Spinner — full screen while verifying ownership
// ---------------------------------------------------------------------------
function BoardLoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
      <p className="text-sm text-gray-500 tracking-wide">Loading board…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error Screen — board not found
// ---------------------------------------------------------------------------
function BoardNotFoundScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 gap-4 text-center px-6">
      <div className="text-4xl">🗒️</div>
      <h2 className="text-xl font-semibold text-white">Board not found</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        This board doesn't exist or may have been deleted.
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
// BoardPage
// ---------------------------------------------------------------------------
function BoardPage() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Live shapes state — updated via onShapesChange from WhiteBoard
  // and fed into useAutosave for debounced Firestore writes
  const [liveShapes, setLiveShapes] = useState([]);

  // -------------------------------------------------------------------------
  // Fetch & verify ownership
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

        // Ownership check — redirect to 403 if this board belongs to someone else
        if (data.ownerId !== user.uid) {
          navigate("/403", { replace: true });
          return;
        }

        setBoard(data);
        // Seed liveShapes from the saved board data
        setLiveShapes(data.shapes ?? []);
      } catch (err) {
        console.error("[BoardPage] ownership check error:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [boardId, user?.uid, navigate]);

  // -------------------------------------------------------------------------
  // Autosave — debounced Firestore write whenever liveShapes changes
  // Only active once we have a confirmed boardId and the board has loaded
  // -------------------------------------------------------------------------
  useAutosave(board ? boardId : null, liveShapes);

  // Stable callback so WhiteBoard's useEffect dep array doesn't re-run on every render
  const handleShapesChange = useCallback((shapes) => {
    setLiveShapes(shapes);
  }, []);

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------
  if (loading) return <BoardLoadingScreen />;
  if (notFound) return <BoardNotFoundScreen />;
  if (!board) return null;

  // -------------------------------------------------------------------------
  // Board editor
  // -------------------------------------------------------------------------
  return (
    <div className="w-full h-screen items-center justify-center relative">
      {/* Back button + title — overlaid on the canvas, doesn't interfere with drawing */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <Link
          to="/dashboard"
          id="btn-back-to-dashboard"
          className="flex items-center gap-1.5 rounded-lg border border-gray-700/80 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition"
        >
          ← Dashboard
        </Link>
        <span className="rounded-lg border border-gray-700/60 bg-gray-900/70 backdrop-blur-sm px-3 py-1.5 text-xs text-gray-500 max-w-[180px] truncate">
          {board.title}
        </span>
      </div>

      {/* WhiteBoard — receives initialShapes from Firestore and reports changes back */}
      <WhiteBoard
        initialShapes={board.shapes ?? []}
        onShapesChange={handleShapesChange}
      />
    </div>
  );
}

export default BoardPage;
