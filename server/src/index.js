/**
 * index.js — Express + Socket.IO Server Entry Point
 *
 * Starts an HTTP server with Express, attaches Socket.IO, configures CORS,
 * and initializes real-time socket handlers.
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { registerSocketHandlers } from "./socket.js";
import { socketAuthMiddleware } from "./auth.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Drawvisn Realtime Collaboration Server",
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP serve r wrapping Express
const server= http.createServer(app);

// Attach Socket.IO to HTTP server with CORS support
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Apply Firebase Authentication middleware
io.use(socketAuthMiddleware);

// Register all socket event listeners
registerSocketHandlers(io);

// Start listening
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Drawvisn Realtime Server running on port ${PORT}`);
  console.log(`🌐 Allowed Client Origin: ${CLIENT_URL}`);
  console.log(`=======================================================`);
});