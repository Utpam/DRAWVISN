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
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { getBoard, renameBoard } from "../services/board.service";
import useAutosave from "../hooks/useAutosave";
import WhiteBoard from "../components/WhiteBoard";
import { useToast } from "../components/Toast";
import AppLoading from "../components/AppLoading";

// ---------------------------------------------------------------------------
// Loading Screen
// ---------------------------------------------------------------------------
function BoardLoadingScreen() {
  return <AppLoading message="Loading whiteboard..." />;
}

// ---------------------------------------------------------------------------
// Board Not Found Screen
// ---------------------------------------------------------------------------
function BoardNotFoundScreen() {
  return (
    <main className="app-status">
      <span className="app-status__mark" aria-hidden="true">—</span>
      <h2 className="app-status__title">Board not found</h2>
      <p className="app-status__copy">
        This board doesn't exist or you may not have permission to view it.
      </p>
      <Link
        to="/dashboard"
        className="app-status__action"
      >
        Back to Dashboard
      </Link>
    </main>
  );
}

// ---------------------------------------------------------------------------
// BoardPage Component
// ---------------------------------------------------------------------------
function BoardPage() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleRenameBoard = useCallback(async (title) => {
    try {
      await renameBoard(boardId, title);
      setBoard((current) => current ? { ...current, title } : current);
      return true;
    } catch (error) {
      console.error("[BoardPage] rename error:", error);
      toast.error("Could not rename this board. Please try again.");
      return false;
    }
  }, [boardId, toast]);

  if (loading) return <BoardLoadingScreen />;
  if (notFound) return <BoardNotFoundScreen />;
  if (!board) return null;

  return (
    <div className="w-full h-screen relative">
      <WhiteBoard
        initialShapes={board.shapes ?? []}
        onShapesChange={handleShapesChange}
        boardId={board.id}
        boardTitle={board.title}
        onRenameBoard={handleRenameBoard}
        user={user}
        role={userRole}
      />
    </div>
  );
}

export default BoardPage;
