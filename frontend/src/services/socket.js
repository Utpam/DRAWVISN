/**
 * socket.js — Socket.IO Client Service
 *
 * Configures and exports the Socket.IO client instance.
 * Reads the server URL from Vite environment variables (VITE_SOCKET_URL).
 */

import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

// Create client instance. autoConnect: false allows explicit connection control.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
});

/**
 * Updates socket auth credentials prior to connecting.
 * @param {string} token - Firebase ID Token
 * @param {Object} user - User metadata
 */
export const updateSocketAuth = (token, user) => {
  socket.auth = {
    token,
    user: user
      ? {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "Collaborator",
          email: user.email || "",
          photoURL: user.photoURL || "",
        }
      : null,
  };
};
