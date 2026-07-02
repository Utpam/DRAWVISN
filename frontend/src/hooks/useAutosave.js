/**
 * useAutosave.js — React Hook for Autosaving Board State
 *
 * Wraps the autosave utility in a React hook so canvas components can
 * trigger debounced Firestore saves whenever shapes change.
 *
 * Requirements:
 *  - Debounces saves by 1000ms (configured in autosave.js)
 *  - Only saves when shapes actually change (deep equality check)
 *  - Updates `updatedAt` timestamp automatically via saveBoard()
 *  - Cancels any pending save on unmount to prevent memory leaks
 *  - Skips saving if boardId is not yet available (loading state)
 *
 * Usage:
 *   useAutosave(boardId, shapes);
 */

import { useEffect, useRef } from "react";
import { createAutosave } from "../utils/autosave";

/**
 * Automatically saves `shapes` to Firestore for the given `boardId`
 * whenever `shapes` changes. Debounced by 1000ms.
 *
 * @param {string | null | undefined} boardId - The board's Firestore document ID.
 *   Pass null/undefined to disable autosave (e.g., while loading).
 * @param {Array<Object>} shapes - The current shapes array from canvas state.
 */
const useAutosave = (boardId, shapes) => {
  /**
   * Tracks the last shapes array successfully written to Firestore.
   * Stored in a ref (not state) so updates don't trigger re-renders.
   * Initialised to null — will be populated after the first successful save.
   */
  const lastSavedShapesRef = useRef(null);

  useEffect(() => {
    // createAutosave returns a cancel function; store it for cleanup
    const cancel = createAutosave(boardId, shapes, lastSavedShapesRef);

    // Cancel the pending debounce if shapes change again before 1000ms
    // or if the component unmounts
    return cancel;
  }, [boardId, shapes]); // Re-run whenever boardId or shapes change
};

export default useAutosave;
