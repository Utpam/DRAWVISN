/**
 * firebase.js — Firebase App Initialization
 *
 * Single source of truth for all Firebase SDK instances.
 * Import `app`, `auth`, or `db` from here across the entire project.
 * Never import from the Firebase SDK directly in components or services.
 *
 * All config values are read from Vite environment variables (.env).
 * See .env.example for the required variable names.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Config — populated from environment variables
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "appId"];
const hasFirebaseConfig = requiredConfigKeys.every((key) => {
  const value = firebaseConfig[key];
  return value?.trim() && !/^your_.*_here$/i.test(value.trim());
});

// ---------------------------------------------------------------------------
// Firebase App (singleton — safe to call initializeApp once)
// ---------------------------------------------------------------------------
export let app = null;
export let auth = null;
export let db = null;

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("[firebase] Firebase initialization failed:", error);
  }
} else {
  console.warn(
    "[firebase] Missing or placeholder Firebase web configuration. " +
      "Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, " +
      "VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID in frontend/.env."
  );
}

export const isFirebaseConfigured = hasFirebaseConfig && Boolean(auth && db);
