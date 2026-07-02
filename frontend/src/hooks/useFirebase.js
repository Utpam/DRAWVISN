/**
 * useFirebase.js — Consolidated Firebase Hooks
 *
 * Provides clean, component-friendly hooks that abstract Firebase operations.
 * Components should import from here rather than from context or services directly.
 *
 * Hooks:
 *  - useAuth()        — authentication state and actions
 *  - useBoard(boardId) — loads and manages a single board document
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  getBoard,
  saveBoard,
  updateViewport,
} from "../services/board.service";

// ============================================================================
// useAuth — Authentication state and actions
// ============================================================================
/**
 * Returns the current authentication state and action helpers.
 * Backed by AuthContext (which subscribes to Firebase's onAuthStateChanged).
 *
 * @returns {{
 *   user: import("firebase/auth").User | null,
 *   loading: boolean,
 *   login: () => Promise<void>,
 *   logout: () => Promise<void>
 * }}
 *
 * @example
 * const { user, loading, login, logout } = useAuth();
 */
export const useAuth = () => {
  return useAuthContext();
};

// ============================================================================
// useBoard — Load and manage a single board document
// ============================================================================
/**
 * Fetches a board from Firestore and provides helpers to save shapes
 * and update the viewport.
 *
 * @param {string | null | undefined} boardId - The Firestore board document ID.
 *   Pass null to skip fetching (useful while auth/routing is resolving).
 *
 * @returns {{
 *   board: Object | null,
 *   loading: boolean,
 *   error: Error | null,
 *   save: (shapes: Array) => Promise<void>,
 *   saveViewport: (viewport: Object) => Promise<void>,
 *   refetch: () => Promise<void>
 * }}
 *
 * @example
 * const { board, loading, error, save } = useBoard(boardId);
 */
export const useBoard = (boardId) => {
  /** @type {[Object | null, Function]} */
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch board from Firestore
  const fetchBoard = useCallback(async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getBoard(boardId);
      setBoard(data);
    } catch (err) {
      console.error("[useBoard] fetchBoard error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  // Fetch when boardId changes (or on initial mount)
  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // save — Persist shapes to Firestore manually (also used by useAutosave)

  /**
   * Saves the given shapes array to Firestore for this board.
   * Also updates the local `board` state to keep it in sync.
   *
   * @param {Array<Object>} shapes - Canvas shapes to persist.
   * @returns {Promise<void>}
   */
  const save = useCallback(
    async (shapes) => {
      if (!boardId) return;
      try {
        await saveBoard(boardId, shapes);
        // Keep local state in sync
        setBoard((prev) => (prev ? { ...prev, shapes } : prev));
      } catch (err) {
        console.error("[useBoard] save error:", err);
        throw err;
      }
    },
    [boardId]
  );

  // saveViewport — Persist camera/viewport state
  /**
   * Saves the viewport (camera x, y, zoom) to Firestore so the view is
   * restored when the board is re-opened.
   *
   * @param {{ x: number, y: number, zoom: number }} viewport
   * @returns {Promise<void>}
   */
  const saveViewport = useCallback(
    async (viewport) => {
      if (!boardId) return;
      try {
        await updateViewport(boardId, viewport);
        // Keep local board state in sync
        setBoard((prev) => (prev ? { ...prev, viewport } : prev));
      } catch (err) {
        console.error("[useBoard] saveViewport error:", err);
        throw err;
      }
    },
    [boardId]
  );

  return {
    board,      // Board data object | null
    loading,    // boolean — true while fetching
    error,      // Error | null
    save,       // (shapes) => Promise<void>
    saveViewport, // (viewport) => Promise<void>
    refetch: fetchBoard, // () => Promise<void> — manually re-fetch if needed
  };
};
