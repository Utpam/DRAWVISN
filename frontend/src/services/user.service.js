/**
 * user.service.js — Firestore User Service
 *
 * All Firestore operations for the `users` collection.
 * Pure async functions — no React, no hooks.
 *
 * User document schema:
 * {
 *   uid: string,
 *   displayName: string,
 *   email: string,
 *   photoURL: string,
 *   plan: "free" | "pro",
 *   boardLimit: number,
 *   boardCount: number,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 * }
 */

import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const USERS_COLLECTION = "users";
const DEFAULT_PLAN = "free";
const DEFAULT_BOARD_LIMIT = 5;

// ---------------------------------------------------------------------------
// createUserDocument — Upsert user profile on login
// ---------------------------------------------------------------------------
/**
 * Creates or merges a user document in Firestore.
 * Safe to call on every login — `merge: true` prevents overwriting existing data.
 *
 * @param {string} uid - Firebase Auth UID.
 * @param {{ displayName: string, email: string, photoURL: string }} profile
 * @returns {Promise<void>}
 * @throws On Firestore write failure.
 */
export const createUserDocument = async (uid, profile) => {
  try {
    if (!uid) throw new Error("createUserDocument: uid is required.");

    const userRef = doc(db, USERS_COLLECTION, uid);

    // Check if the document already exists to avoid overwriting boardCount
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      // First-time login — create the document with defaults
      await setDoc(userRef, {
        uid,
        displayName: profile.displayName ?? "",
        email: profile.email ?? "",
        photoURL: profile.photoURL ?? "",
        plan: DEFAULT_PLAN,
        boardLimit: DEFAULT_BOARD_LIMIT,
        boardCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Returning user — update mutable profile fields only
      await setDoc(
        userRef,
        {
          displayName: profile.displayName ?? "",
          email: profile.email ?? "",
          photoURL: profile.photoURL ?? "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error("[user.service] createUserDocument error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// getUserDocument — Read user profile
// ---------------------------------------------------------------------------
/**
 * Fetches the user's Firestore profile document.
 *
 * @param {string} uid - Firebase Auth UID.
 * @returns {Promise<Object | null>} User data or null if not found.
 * @throws On Firestore read failure.
 */
export const getUserDocument = async (uid) => {
  try {
    if (!uid) throw new Error("getUserDocument: uid is required.");

    const userRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("[user.service] getUserDocument error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// incrementBoardCount — Atomic transaction
// ---------------------------------------------------------------------------
/**
 * Atomically increments the user's `boardCount` if under their `boardLimit`.
 * Uses a Firestore transaction to prevent race conditions across concurrent tabs.
 *
 * @param {string} uid - Firebase Auth UID.
 * @returns {Promise<void>}
 * @throws {Error} With message "BOARD_LIMIT_REACHED" if at limit.
 * @throws On Firestore transaction failure.
 */
export const incrementBoardCount = async (uid) => {
  try {
    if (!uid) throw new Error("incrementBoardCount: uid is required.");

    const userRef = doc(db, USERS_COLLECTION, uid);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(userRef);

      if (!snapshot.exists()) {
        throw new Error("incrementBoardCount: User document not found.");
      }

      const { boardCount, boardLimit } = snapshot.data();

      if (boardCount >= boardLimit) {
        throw new Error("BOARD_LIMIT_REACHED");
      }

      transaction.update(userRef, {
        boardCount: boardCount + 1,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Re-throw as-is so callers can distinguish BOARD_LIMIT_REACHED
    console.error("[user.service] incrementBoardCount error:", error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// decrementBoardCount — Atomic transaction
// ---------------------------------------------------------------------------
/**
 * Atomically decrements the user's `boardCount`, floored at 0.
 * Uses a Firestore transaction for consistency.
 *
 * @param {string} uid - Firebase Auth UID.
 * @returns {Promise<void>}
 * @throws On Firestore transaction failure.
 */
export const decrementBoardCount = async (uid) => {
  try {
    if (!uid) throw new Error("decrementBoardCount: uid is required.");

    const userRef = doc(db, USERS_COLLECTION, uid);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(userRef);

      if (!snapshot.exists()) {
        throw new Error("decrementBoardCount: User document not found.");
      }

      const { boardCount } = snapshot.data();

      transaction.update(userRef, {
        boardCount: Math.max(0, boardCount - 1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("[user.service] decrementBoardCount error:", error);
    throw error;
  }
};
