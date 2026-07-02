/**
 * useBoards.js — Board Management Hook
 *
 * Encapsulates all board CRUD operations with integrated boardCount tracking.
 * All Firestore interactions go through board.service and user.service.
 *
 * Returns:
 *  - boards: Array<Object>   — user's boards ordered by updatedAt desc
 *  - loading: boolean        — true while fetching boards
 *  - error: string | null    — human-readable error message
 *  - userDoc: Object | null  — user's Firestore document (plan, boardCount, boardLimit)
 *  - createBoard()           — enforce limit → create → increment count → navigate
 *  - deleteBoard(boardId)    — delete → decrement count
 *  - renameBoard(id, title)  — update title + updatedAt
 *  - duplicateBoard(boardId) — enforce limit → duplicate → increment count
 *  - refetch()               — manually reload boards list
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useFirebase";
import {
  createBoard as svcCreateBoard,
  getBoardsByUser,
  deleteBoard as svcDeleteBoard,
  renameBoard as svcRenameBoard,
  duplicateBoard as svcDuplicateBoard,
} from "../services/board.service";
import {
  incrementBoardCount,
  decrementBoardCount,
  getUserDocument,
} from "../services/user.service";

const useBoards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true); // true by default — data loads on mount
  const [error, setError] = useState(null);


  // -------------------------------------------------------------------------
  // Fetch boards and user document
  // -------------------------------------------------------------------------
  const refetch = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    // Fetch boards and userDoc independently so one failure doesn't block the other
    const [boardResult, userResult] = await Promise.allSettled([
      getBoardsByUser(user.uid),
      getUserDocument(user.uid),
    ]);

    if (boardResult.status === "fulfilled") {
      setBoards(boardResult.value);
    } else {
      console.error("[useBoards] getBoardsByUser error:", boardResult.reason);
      setError("Failed to load boards. Please try again.");
    }

    if (userResult.status === "fulfilled") {
      setUserDoc(userResult.value);
    } else {
      console.error("[useBoards] getUserDocument error:", userResult.reason);
      // Don't block the UI — userDoc might load on next refetch
    }

    setLoading(false);
  }, [user?.uid]);


  useEffect(() => {
    refetch();
  }, [refetch]);

  // -------------------------------------------------------------------------
  // createBoard
  // -------------------------------------------------------------------------
  /**
   * Creates a new board after enforcing the board limit via atomic transaction.
   * On success, navigates to /dashboard/:boardId.
   *
   * @returns {Promise<{ boardId: string } | { error: string }>}
   */
  const createBoard = useCallback(async () => {
    if (!user?.uid) return { error: "Not authenticated." };

    try {
      // Atomically check limit and increment — throws "BOARD_LIMIT_REACHED" if at limit
      await incrementBoardCount(user.uid);

      // Count is incremented — safe to create the board
      const boardId = await svcCreateBoard(user.uid);

      // Optimistically update userDoc count in local state
      setUserDoc((prev) =>
        prev ? { ...prev, boardCount: prev.boardCount + 1 } : prev
      );

      navigate(`/dashboard/${boardId}`);
      return { boardId };
    } catch (err) {
      if (err.message === "BOARD_LIMIT_REACHED") {
        return { error: "BOARD_LIMIT_REACHED" };
      }
      console.error("[useBoards] createBoard error:", err);
      return { error: "Failed to create board. Please try again." };
    }
  }, [user?.uid, navigate]);

  // -------------------------------------------------------------------------
  // deleteBoard
  // -------------------------------------------------------------------------
  /**
   * Deletes a board and decrements the user's boardCount.
   *
   * @param {string} boardId
   * @returns {Promise<{ error?: string }>}
   */
  const deleteBoard = useCallback(
    async (boardId) => {
      if (!user?.uid || !boardId) return { error: "Invalid arguments." };

      try {
        await svcDeleteBoard(boardId);
        await decrementBoardCount(user.uid);

        // Update local state
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        setUserDoc((prev) =>
          prev ? { ...prev, boardCount: Math.max(0, prev.boardCount - 1) } : prev
        );

        return {};
      } catch (err) {
        console.error("[useBoards] deleteBoard error:", err);
        return { error: "Failed to delete board." };
      }
    },
    [user?.uid]
  );

  // -------------------------------------------------------------------------
  // renameBoard
  // -------------------------------------------------------------------------
  /**
   * Renames a board and updates local state optimistically.
   *
   * @param {string} boardId
   * @param {string} title
   * @returns {Promise<{ error?: string }>}
   */
  const renameBoard = useCallback(async (boardId, title) => {
    if (!boardId || !title?.trim()) return { error: "Title cannot be empty." };

    try {
      await svcRenameBoard(boardId, title);

      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId ? { ...b, title: title.trim() } : b
        )
      );

      return {};
    } catch (err) {
      console.error("[useBoards] renameBoard error:", err);
      return { error: "Failed to rename board." };
    }
  }, []);

  // -------------------------------------------------------------------------
  // duplicateBoard
  // -------------------------------------------------------------------------
  /**
   * Duplicates a board after checking the board limit.
   * Increments boardCount on success.
   *
   * @param {string} boardId
   * @returns {Promise<{ newBoardId?: string, error?: string }>}
   */
  const duplicateBoard = useCallback(
    async (boardId) => {
      if (!user?.uid || !boardId) return { error: "Invalid arguments." };

      try {
        // Enforce limit atomically before duplicating
        await incrementBoardCount(user.uid);

        const newBoardId = await svcDuplicateBoard(boardId);

        // Update local userDoc count
        setUserDoc((prev) =>
          prev ? { ...prev, boardCount: prev.boardCount + 1 } : prev
        );

        // Refetch boards to show the new copy in the list
        await refetch();

        return { newBoardId };
      } catch (err) {
        if (err.message === "BOARD_LIMIT_REACHED") {
          return { error: "BOARD_LIMIT_REACHED" };
        }
        console.error("[useBoards] duplicateBoard error:", err);
        return { error: "Failed to duplicate board." };
      }
    },
    [user?.uid, refetch]
  );

  return {
    boards,
    userDoc,
    loading,
    error,
    createBoard,
    deleteBoard,
    renameBoard,
    duplicateBoard,
    refetch,
  };
};

export default useBoards;
