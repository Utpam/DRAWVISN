/**
 * autosave.js — Debounced Autosave Utility
 *
 * A framework-agnostic utility (no React) that debounces Firestore saves.
 *
 * Features:
 *  - 1000ms debounce delay
 *  - Prevents duplicate writes by deep-comparing shapes with the last saved snapshot
 *  - Automatically updates `updatedAt` timestamp via saveBoard()
 *  - Returns a cleanup function to cancel any pending save on unmount
 *
 * Usage:
 *   const cancel = createAutosave(boardId, shapes);
 *   // ... later, on unmount:
 *   cancel();
 */

import { saveBoard } from "../services/board.service";

// ---------------------------------------------------------------------------
// Internal deep-equality helper for shape arrays
// ---------------------------------------------------------------------------
/**
 * Performs a fast structural equality check between two arrays using JSON.
 * Suitable for shape arrays which contain plain serialisable objects.
 *
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------------------
// createAutosave
// ---------------------------------------------------------------------------
/**
 * Schedules a debounced Firestore save for the given board's shapes.
 * Skips the write if shapes haven't changed since the last successful save.
 *
 * @param {string} boardId - The Firestore board document ID.
 * @param {Array<Object>} shapes - Current shapes array from canvas state.
 * @param {Array<Object>} lastSavedShapesRef - A mutable ref (plain object with
 *   `.current`) that holds the last snapshot saved to Firestore. Must be shared
 *   across calls so the duplicate-write guard works correctly.
 * @param {number} [debounceMs=1000] - Debounce delay in milliseconds.
 * @returns {() => void} Cancel function — call this to cancel the pending save.
 */
export const createAutosave = (boardId, shapes, lastSavedShapesRef, debounceMs = 1000) => {
  // Guard: board must exist before we attempt to save
  if (!boardId) {
    console.warn("[autosave] No boardId provided — skipping autosave.");
    return () => {};
  }

  // Guard: skip write if shapes are identical to the last save
  if (isEqual(shapes, lastSavedShapesRef.current)) {
    return () => {};
  }

  // Schedule the debounced write
  const timeoutId = setTimeout(async () => {
    try {
      await saveBoard(boardId, shapes);
      // Update the ref so subsequent calls can detect no-change
      lastSavedShapesRef.current = shapes;
      console.debug(`[autosave] Saved board "${boardId}" — ${shapes.length} shape(s).`);
    } catch (error) {
      console.error("[autosave] Failed to save board:", error);
      // Do NOT update the ref on failure so the next trigger will retry
    }
  }, debounceMs);

  // Return a cancel function for cleanup
  return () => clearTimeout(timeoutId);
};
