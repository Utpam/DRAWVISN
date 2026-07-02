/**
 * auth.service.js — Firebase Authentication Service
 *
 * Pure functions for all Firebase Auth interactions.
 * No React, no hooks — these are plain async utilities.
 * React components must call these through AuthContext or hooks,
 * never import from this file directly inside a component.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";

// ---------------------------------------------------------------------------
// Google Auth Provider (configured once, reused)
// ---------------------------------------------------------------------------
const googleProvider = new GoogleAuthProvider();

/**
 * Signs the user in via a Google OAuth popup.
 *
 * @returns {Promise<import("firebase/auth").User>} The authenticated Firebase user.
 * @throws Will throw a Firebase AuthError if the popup is closed or auth fails.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    // Re-throw so the calling layer (AuthContext) can handle UI feedback
    console.error("[auth.service] signInWithGoogle error:", error.code, error.message);
    throw error;
  }
};

/**
 * Signs the currently authenticated user out.
 *
 * @returns {Promise<void>}
 * @throws Will throw a Firebase AuthError on failure.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[auth.service] signOutUser error:", error.code, error.message);
    throw error;
  }
};

/**
 * Returns the currently signed-in user synchronously, or null if unauthenticated.
 * Note: This reflects the cached SDK state — prefer onAuthChange for reactive updates.
 *
 * @returns {import("firebase/auth").User | null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Subscribes to Firebase Authentication state changes.
 * Calls `callback` immediately with the current user, then on every change.
 *
 * @param {(user: import("firebase/auth").User | null) => void} callback
 * @returns {() => void} Unsubscribe function — call on cleanup.
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
