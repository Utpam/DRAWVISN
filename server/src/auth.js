/**
 * auth.js — Socket.IO Authentication Middleware
 *
 * Verifies Firebase ID tokens and assigns a guest identity when no token is
 * provided.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const getFirebaseAuth = () => {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.VITE_FIREBASE_PROJECT_ID;
  const app = getApps()[0] || initializeApp(projectId ? { projectId } : undefined);

  return getAuth(app);
};

export const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (typeof token === "string" && token.trim()) {
    try {
      const decoded = await getFirebaseAuth().verifyIdToken(token);
      socket.user = {
        uid: decoded.uid,
        displayName: decoded.name || decoded.email?.split("@")[0] || "Collaborator",
        email: decoded.email || "",
        photoURL: decoded.picture || "",
      };
      console.log(`[Auth] Verified Firebase user: ${socket.user.displayName} (${socket.user.uid})`);
      return next();
    } catch (err) {
      console.warn("[Auth] Firebase ID token verification failed:", err.code || err.message);
      return next(new Error("Authentication failed"));
    }
  }

  socket.user = {
    uid: `user_${socket.id.slice(0, 6)}`,
    displayName: "Collaborator",
    email: "",
    photoURL: "",
  };
  console.log(`[Auth] Socket ${socket.id} connected as guest`);
  return next();
};
