/**
 * board.service.js — Firestore Board Service
 *
 * All Firestore operations for the `boards` collection.
 * Pure async functions — no React, no hooks.
 *
 * Board document schema:
 * {
 *   title: string,
 *   ownerId: string,           // Firebase Auth UID
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   viewport: { x: number, y: number, zoom: number },
 *   shapes: Array<Shape>
 * }
 *
 * The document ID serves as the board's `id`.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BOARDS_COLLECTION = "boards";

/**
 * Returns a default board data object for a given user.
 * @param {string} uid - Firebase Auth UID of the board owner.
 * @returns {Object} Board document data (without id).
 */
const defaultBoardData = (uid) => ({
  title: "Untitled Board",
  ownerId: uid,
  collaborators: [],
  visibility: "private",
  thumbnail: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  viewport: { x: 0, y: 0, zoom: 1 },
  shapes: [],
});

// ---------------------------------------------------------------------------
// createBoard — Create a new board document
// ---------------------------------------------------------------------------
/**
 * Creates a new board in Firestore for the given user.
 *
 * @param {string} uid - Firebase Auth UID of the owner.
 * @returns {Promise<string>} The newly created board's Firestore document ID.
 * @throws On Firestore write failure.
 */
export const createBoard = async (uid) => {
  try {
    if (!uid) throw new Error("createBoard: uid is required.");

    const docRef = await addDoc(
      collection(db, BOARDS_COLLECTION),
      defaultBoardData(uid)
    );

    return docRef.id;
  } catch (error) {
    console.error("[board.service] createBoard error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// getBoard — Fetch a single board by ID
// ---------------------------------------------------------------------------
/**
 * Fetches a single board document by its ID.
 *
 * @param {string} boardId - The Firestore document ID of the board.
 * @returns {Promise<Object | null>} Board data including its `id`, or null if not found.
 * @throws On Firestore read failure.
 */
export const getBoard = async (boardId) => {
  try {
    if (!boardId) throw new Error("getBoard: boardId is required.");

    const docRef = doc(db, BOARDS_COLLECTION, boardId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("[board.service] getBoard error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// getBoardsByUser — Fetch all boards owned by a user
// ---------------------------------------------------------------------------
/**
 * Retrieves all boards owned by the given user, ordered by most recently updated.
 *
 * @param {string} uid - Firebase Auth UID of the board owner.
 * @returns {Promise<Array<Object>>} Array of board objects (each includes `id`).
 * @throws On Firestore read failure.
 */
export const getBoardsByUser = async (uid) => {
  try {
    if (!uid) throw new Error("getBoardsByUser: uid is required.");

    // NOTE: orderBy("updatedAt") combined with where() requires a composite
    // Firestore index. To avoid that dependency, we filter client-side and
    // sort manually. This is safe for the board counts in a free-tier app.
    const q = query(
      collection(db, BOARDS_COLLECTION),
      where("ownerId", "==", uid)
    );

    const snapshot = await getDocs(q);

    const boards = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by updatedAt descending — Firestore Timestamps have a .toMillis() method
    boards.sort((a, b) => {
      const aMs = a.updatedAt?.toMillis?.() ?? 0;
      const bMs = b.updatedAt?.toMillis?.() ?? 0;
      return bMs - aMs;
    });

    return boards;
  } catch (error) {
    console.error("[board.service] getBoardsByUser error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// saveBoard — Persist shapes to Firestore
// ---------------------------------------------------------------------------
/**
 * Saves the current shapes array to a board and updates the `updatedAt` timestamp.
 * Used by the autosave utility.
 *
 * @param {string} boardId - The board's Firestore document ID.
 * @param {Array<Object>} shapes - The current array of canvas shapes to persist.
 * @returns {Promise<void>}
 * @throws On Firestore write failure.
 */
export const saveBoard = async (boardId, shapes) => {
  try {
    if (!boardId) throw new Error("saveBoard: boardId is required.");

    const docRef = doc(db, BOARDS_COLLECTION, boardId);

    await updateDoc(docRef, {
      shapes: shapes ?? [],
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[board.service] saveBoard error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// updateViewport — Persist camera viewport state
// ---------------------------------------------------------------------------
/**
 * Updates the board's viewport (camera x, y, zoom) in Firestore.
 * Called when the user navigates/zooms so the view is restored on reload.
 *
 * @param {string} boardId - The board's Firestore document ID.
 * @param {{ x: number, y: number, zoom: number }} viewport - Camera state to save.
 * @returns {Promise<void>}
 * @throws On Firestore write failure.
 */
export const updateViewport = async (boardId, viewport) => {
  try {
    if (!boardId) throw new Error("updateViewport: boardId is required.");
    if (!viewport) throw new Error("updateViewport: viewport is required.");

    const docRef = doc(db, BOARDS_COLLECTION, boardId);

    await updateDoc(docRef, {
      viewport,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[board.service] updateViewport error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// deleteBoard — Delete a board permanently
// ---------------------------------------------------------------------------
/**
 * Permanently deletes a board document from Firestore.
 *
 * @param {string} boardId - The board's Firestore document ID.
 * @returns {Promise<void>}
 * @throws On Firestore delete failure.
 */
export const deleteBoard = async (boardId) => {
  try {
    if (!boardId) throw new Error("deleteBoard: boardId is required.");

    const docRef = doc(db, BOARDS_COLLECTION, boardId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("[board.service] deleteBoard error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// duplicateBoard — Clone an existing board
// ---------------------------------------------------------------------------
/**
 * Creates a copy of an existing board with a new ID and reset timestamps.
 * The duplicate is owned by the same user as the original.
 *
 * @param {string} boardId - The Firestore document ID of the board to duplicate.
 * @returns {Promise<string>} The new board's Firestore document ID.
 * @throws If the source board is not found, or on any Firestore failure.
 */
export const duplicateBoard = async (boardId) => {
  try {
    if (!boardId) throw new Error("duplicateBoard: boardId is required.");

    // 1. Read the source board
    const source = await getBoard(boardId);
    if (!source) throw new Error(`duplicateBoard: board "${boardId}" not found.`);

    // 2. Build new doc data — strip the id field, reset timestamps, append " (Copy)"
    const { id: _ignored, createdAt: _ca, updatedAt: _ua, ...rest } = source;
    const newBoardData = {
      ...rest,
      title: `${source.title} (Copy)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Write to Firestore and return the new ID
    const newDocRef = await addDoc(collection(db, BOARDS_COLLECTION), newBoardData);
    return newDocRef.id;
  } catch (error) {
    console.error("[board.service] duplicateBoard error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// renameBoard — Update a board's title
// ---------------------------------------------------------------------------
/**
 * Updates the title of a board and refreshes the `updatedAt` timestamp.
 *
 * @param {string} boardId - The board's Firestore document ID.
 * @param {string} title - The new title string.
 * @returns {Promise<void>}
 * @throws On Firestore write failure or if title is empty.
 */
export const renameBoard = async (boardId, title) => {
  try {
    if (!boardId) throw new Error("renameBoard: boardId is required.");
    if (!title || !title.trim()) throw new Error("renameBoard: title cannot be empty.");

    const docRef = doc(db, BOARDS_COLLECTION, boardId);

    await updateDoc(docRef, {
      title: title.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[board.service] renameBoard error:", error);
    throw error;
  }
};
