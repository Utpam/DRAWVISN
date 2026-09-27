/**
 * socket.js — Collaborative Socket.IO Handlers
 *
 * Implements real-time collaboration:
 *  - Real-time presence (presence:update, user:joined, user:left)
 *  - Shape CRUD (shape:create, shape:update, shape:delete)
 *  - Live pen stroke streaming (stroke:start, stroke:update, stroke:end)
 *  - Live multi-user cursors (cursor:move, cursor:leave)
 *  - Selection sharing (selection:update)
 *  - Canvas reset (canvas:clear)
 */

import { roomManager } from "./rooms.js";
import { permissionManager } from "./boardPermissions.js";  

export const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    const user = socket.user || {
      uid: `anon_${socket.id.slice(0, 8)}`,
      displayName: "Collaborator",
      email: "",
      photoURL: "",
    };

    console.log(`[Socket.IO] Connected: ${socket.id} (${user.displayName} / ${user.uid})`);

    // -------------------------------------------------------------------------
    // board:join — Handles both object { boardId, role } and string "boardId"
    // -------------------------------------------------------------------------
    socket.on("board:join", (payload) => {
      const boardId = typeof payload === "string" ? payload : payload?.boardId;
      const role = (typeof payload === "object" && payload?.role) ? payload.role : "editor";

      if (!boardId || typeof boardId !== "string") {
        console.warn(`[Socket.IO] Invalid board:join payload from ${socket.id}:`, payload);
        return;
      }

      socket.join(boardId);
      permissionManager.setRole(boardId, socket.id, user.uid, role);
      roomManager.joinRoom(boardId, socket.id, user, role);

      const activeUsers = roomManager.getRoomUsers(boardId);
      console.log(`[Socket.IO] Presence update for board "${boardId}" (${activeUsers.length} user(s))`);

      // Broadcast updated presence to ALL sockets in this board room (including sender)
      io.to(boardId).emit("presence:update", { boardId, users: activeUsers });

      // Notify others that someone joined
      socket.to(boardId).emit("user:joined", {
        socketId: socket.id,
        user,
        role,
      });
    });

    // -------------------------------------------------------------------------
    // board:leave
    // -------------------------------------------------------------------------
    socket.on("board:leave", (payload) => {
      const boardId = typeof payload === "string" ? payload : payload?.boardId;
      if (!boardId || typeof boardId !== "string") return;

      socket.leave(boardId);
      const leftUser = roomManager.leaveRoom(boardId, socket.id);
      permissionManager.removeSession(boardId, socket.id);

      const activeUsers = roomManager.getRoomUsers(boardId);
      io.to(boardId).emit("presence:update", { boardId, users: activeUsers });

      socket.to(boardId).emit("user:left", {
        socketId: socket.id,
        user: leftUser || user,
      });
      socket.to(boardId).emit("cursor:leave", { socketId: socket.id });
    });

    // -------------------------------------------------------------------------
    // shape:create
    // -------------------------------------------------------------------------
    socket.on("shape:create", ({ boardId, shape }) => {
      if (!boardId || !shape) return;

      if (!permissionManager.canEdit(boardId, socket.id)) {
        console.warn(`[Socket.IO] Viewer ${socket.id} attempted shape:create on ${boardId}`);
        return;
      }

      const enrichedShape = {
        ...shape,
        createdBy: shape.createdBy || user.uid,
        creatorName: shape.creatorName || user.displayName,
        createdAt: shape.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      socket.to(boardId).emit("shape:create", { boardId, shape: enrichedShape });
    });

    // -------------------------------------------------------------------------
    // shape:update
    // -------------------------------------------------------------------------
    socket.on("shape:update", ({ boardId, shapes }) => {
      if (!boardId || !shapes || !Array.isArray(shapes)) return;

      if (!permissionManager.canEdit(boardId, socket.id)) {
        console.warn(`[Socket.IO] Viewer ${socket.id} attempted shape:update on ${boardId}`);
        return;
      }

      const updatedShapes = shapes.map((s) => ({
        ...s,
        updatedAt: Date.now(),
        updatedBy: user.uid,
      }));

      socket.to(boardId).emit("shape:update", { boardId, shapes: updatedShapes });
    });

    // -------------------------------------------------------------------------
    // shape:delete
    // -------------------------------------------------------------------------
    socket.on("shape:delete", ({ boardId, shapeIds }) => {
      if (!boardId || !shapeIds || !Array.isArray(shapeIds)) return;

      if (!permissionManager.canEdit(boardId, socket.id)) {
        console.warn(`[Socket.IO] Viewer ${socket.id} attempted shape:delete on ${boardId}`);
        return;
      }

      socket.to(boardId).emit("shape:delete", { boardId, shapeIds });
    });

    // -------------------------------------------------------------------------
    // stroke:start — Live Pen Stroke Streaming Start
    // -------------------------------------------------------------------------
    socket.on("stroke:start", ({ boardId, stroke }) => {
      if (!boardId || !stroke) return;
      if (!permissionManager.canEdit(boardId, socket.id)) return;

      const liveStroke = {
        ...stroke,
        createdBy: user.uid,
        creatorName: user.displayName,
      };

      socket.to(boardId).emit("stroke:start", { boardId, stroke: liveStroke });
    });

    // -------------------------------------------------------------------------
    // stroke:update — Live Pen Stroke Streaming Points Batch
    // -------------------------------------------------------------------------
    socket.on("stroke:update", ({ boardId, strokeId, points }) => {
      if (!boardId || !strokeId || !points) return;
      if (!permissionManager.canEdit(boardId, socket.id)) return;

      socket.to(boardId).emit("stroke:update", { boardId, strokeId, points });
    });

    // -------------------------------------------------------------------------
    // stroke:end — Live Pen Stroke Finished
    // -------------------------------------------------------------------------
    socket.on("stroke:end", ({ boardId, strokeId, shape }) => {
      if (!boardId || !strokeId) return;
      if (!permissionManager.canEdit(boardId, socket.id)) return;

      socket.to(boardId).emit("stroke:end", { boardId, strokeId, shape });
    });

    // -------------------------------------------------------------------------
    // cursor:move — Throttled Live Cursor Position
    // -------------------------------------------------------------------------
    socket.on("cursor:move", ({ boardId, cursor }) => {
      if (!boardId || !cursor) return;

      socket.to(boardId).emit("cursor:move", {
        socketId: socket.id,
        user,
        cursor,
      });
    });

    // -------------------------------------------------------------------------
    // cursor:leave
    // -------------------------------------------------------------------------
    socket.on("cursor:leave", ({ boardId }) => {
      if (!boardId) return;
      socket.to(boardId).emit("cursor:leave", { socketId: socket.id });
    });

    // -------------------------------------------------------------------------
    // selection:update — Share selected shapes
    // -------------------------------------------------------------------------
    socket.on("selection:update", ({ boardId, selectedIds }) => {
      if (!boardId || !selectedIds) return;

      socket.to(boardId).emit("selection:update", {
        socketId: socket.id,
        user,
        selectedIds,
      });
    });

    // -------------------------------------------------------------------------
    // canvas:clear
    // -------------------------------------------------------------------------
    socket.on("canvas:clear", ({ boardId }) => {
      if (!boardId) return;
      if (!permissionManager.canEdit(boardId, socket.id)) return;

      socket.to(boardId).emit("canvas:clear", { boardId });
    });

    // -------------------------------------------------------------------------
    // disconnect
    // -------------------------------------------------------------------------
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Disconnected: ${socket.id} (${reason})`);

      const leftRooms = roomManager.handleDisconnect(socket.id);
      permissionManager.handleDisconnect(socket.id);

      leftRooms.forEach(({ boardId, user: u }) => {
        const activeUsers = roomManager.getRoomUsers(boardId);
        io.to(boardId).emit("presence:update", { boardId, users: activeUsers });
        io.to(boardId).emit("user:left", { socketId: socket.id, user: u });
        io.to(boardId).emit("cursor:leave", { socketId: socket.id });
      });
    });

    // -------------------------------------------------------------------------
    // error
    // -------------------------------------------------------------------------
    socket.on("error", (error) => {
      console.error(`[Socket.IO] Error on socket ${socket.id}:`, error);
    });
  });
};
