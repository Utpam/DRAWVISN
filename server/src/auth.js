/**
 * auth.js — Socket.IO Authentication Middleware
 *
 * Authenticates the socket connection using:
 *  1. Direct user profile in socket.handshake.auth.user
 *  2. Firebase Admin verifyIdToken if credentials exist
 *  3. JWT token payload extraction for development
 *  4. Fallback guest user (never drops connection)
 */

import admin from "firebase-admin";

if (!admin.apps) {
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "drawvisn",
    });
    console.log("[Auth] Firebase Admin initialized.");
  } catch (err) {
    console.warn("[Auth] Firebase Admin initialization warning:", err.message);
  }
}

export const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const userPayload = socket.handshake.auth?.user;

  // 1. Direct user object from client
  if (userPayload && userPayload.uid) {
    socket.user = {
      uid: userPayload.uid,
      displayName: userPayload.displayName || userPayload.email?.split("@")[0] || "Collaborator",
      email: userPayload.email || "",
      photoURL: userPayload.photoURL || "",
    };
    console.log(`[Auth] Authenticated user via payload: ${socket.user.displayName} (${socket.user.uid})`);
    return next();
  }

  // 2. Firebase ID token verification
  if (token && typeof token === "string") {
    try {
      if (admin.apps.length) {
        const decoded = await admin.auth().verifyIdToken(token);
        socket.user = {
          uid: decoded.uid,
          displayName: decoded.name || decoded.email?.split("@")[0] || "Collaborator",
          email: decoded.email || "",
          photoURL: decoded.picture || "",
        };
        console.log(`[Auth] Authenticated via Admin SDK: ${socket.user.displayName} (${socket.user.uid})`);
        return next();
      }
    } catch (err) {
      console.warn(`[Auth] Firebase Admin verify notice: ${err.message}`);
    }

    // 3. Decode JWT payload if Admin SDK has no cloud credentials in dev
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const decoded = JSON.parse(payloadJson);
        if (decoded && (decoded.user_id || decoded.sub || decoded.uid)) {
          const uid = decoded.user_id || decoded.sub || decoded.uid;
          socket.user = {
            uid,
            displayName: decoded.name || decoded.email?.split("@")[0] || "Collaborator",
            email: decoded.email || "",
            photoURL: decoded.picture || "",
          };
          console.log(`[Auth] Authenticated via JWT payload: ${socket.user.displayName} (${socket.user.uid})`);
          return next();
        }
      }
    } catch (e) {
      console.warn("[Auth] JWT decode fallback notice:", e.message);
    }
  }

  // 4. Fallback guest user (never drops connection)
  socket.user = {
    uid: `user_${socket.id.slice(0, 6)}`,
    displayName: "Collaborator",
    email: "",
    photoURL: "",
  };
  console.log(`[Auth] Socket ${socket.id} connected as ${socket.user.displayName}`);
  return next();
};
