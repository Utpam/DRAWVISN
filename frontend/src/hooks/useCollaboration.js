/**
 * useCollaboration.js — Collaboration Layer Hook
 *
 * Coordinates:
 *  - Real-time Socket.IO networking via useSocket
 *  - Multi-user presence state (online collaborators list)
 *  - Remote cursor tracking (throttled at ~30fps)
 *  - In-progress live pen strokes streaming
 *  - Remote selections tracking
 *  - Shape delta emissions (create, update, delete, clear)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";

export const useCollaboration = ({
  boardId,
  user,
  role = "editor",
  onRemoteShapeCreate,
  onRemoteShapesUpdate,
  onRemoteShapesDelete,
  onRemoteCanvasClear,
}) => {
  const { connectionStatus, isConnected, emit, on, socketId } = useSocket(
    boardId,
    user,
    role
  );

  // ── Presence & Collaborators ─────────────────────────────────────────────
  const [collaborators, setCollaborators] = useState([]);

  // ── Remote Cursors: Map<socketId, { user, x, y, lastSeen }> ──────────────
  const [remoteCursors, setRemoteCursors] = useState({});

  // ── Remote Selections: Map<socketId, { user, selectedIds }> ──────────────
  const [remoteSelections, setRemoteSelections] = useState({});

  // ── In-progress Remote Pen Strokes: Map<strokeId, Stroke> ────────────────
  const [remoteStrokes, setRemoteStrokes] = useState({});

  // Throttling ref for cursor moves (~30ms throttle = ~33 fps)
  const lastCursorEmitRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Subscribe to real-time events from server
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Presence update (full list of connected users)
    const unsubPresence = on("presence:update", ({ users }) => {
      setCollaborators(users || []);
    });

    // 2. User joined notification
    const unsubUserJoined = on("user:joined", ({ user: joinedUser }) => {
      console.log(`[Collaboration] ${joinedUser.displayName} joined the board`);
    });

    // 3. User left notification
    const unsubUserLeft = on("user:left", ({ socketId: sId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[sId];
        return next;
      });
      setRemoteSelections((prev) => {
        const next = { ...prev };
        delete next[sId];
        return next;
      });
    });

    // 4. Remote shape created
    const unsubShapeCreate = on("shape:create", ({ shape }) => {
      if (onRemoteShapeCreate) onRemoteShapeCreate(shape);
    });

    // 5. Remote shapes updated
    const unsubShapeUpdate = on("shape:update", ({ shapes }) => {
      if (onRemoteShapesUpdate) onRemoteShapesUpdate(shapes);
    });

    // 6. Remote shapes deleted
    const unsubShapeDelete = on("shape:delete", ({ shapeIds }) => {
      if (onRemoteShapesDelete) onRemoteShapesDelete(shapeIds);
    });

    // 7. Remote canvas cleared
    const unsubCanvasClear = on("canvas:clear", () => {
      if (onRemoteCanvasClear) onRemoteCanvasClear();
    });

    // 8. Remote cursor movement
    const unsubCursorMove = on("cursor:move", ({ socketId: sId, user: u, cursor }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [sId]: { user: u, ...cursor, lastSeen: Date.now() },
      }));
    });

    // 9. Remote cursor left canvas
    const unsubCursorLeave = on("cursor:leave", ({ socketId: sId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[sId];
        return next;
      });
    });

    // 10. Remote in-progress pen stroke started
    const unsubStrokeStart = on("stroke:start", ({ stroke }) => {
      if (!stroke || !stroke.id) return;
      setRemoteStrokes((prev) => ({
        ...prev,
        [stroke.id]: stroke,
      }));
    });

    // 11. Remote in-progress pen stroke streaming points
    const unsubStrokeUpdate = on("stroke:update", ({ strokeId, points }) => {
      setRemoteStrokes((prev) => {
        const existing = prev[strokeId];
        if (!existing) return prev;
        return {
          ...prev,
          [strokeId]: {
            ...existing,
            points: [...existing.points, ...points],
          },
        };
      });
    });

    // 12. Remote in-progress pen stroke finished
    const unsubStrokeEnd = on("stroke:end", ({ strokeId, shape }) => {
      // Remove temporary stroke and add completed shape
      setRemoteStrokes((prev) => {
        const next = { ...prev };
        delete next[strokeId];
        return next;
      });
      if (shape && onRemoteShapeCreate) {
        onRemoteShapeCreate(shape);
      }
    });

    // 13. Remote selection updated
    const unsubSelectionUpdate = on("selection:update", ({ socketId: sId, user: u, selectedIds }) => {
      setRemoteSelections((prev) => ({
        ...prev,
        [sId]: { user: u, selectedIds },
      }));
    });

    return () => {
      unsubPresence();
      unsubUserJoined();
      unsubUserLeft();
      unsubShapeCreate();
      unsubShapeUpdate();
      unsubShapeDelete();
      unsubCanvasClear();
      unsubCursorMove();
      unsubCursorLeave();
      unsubStrokeStart();
      unsubStrokeUpdate();
      unsubStrokeEnd();
      unsubSelectionUpdate();
    };
  }, [
    on,
    onRemoteShapeCreate,
    onRemoteShapesUpdate,
    onRemoteShapesDelete,
    onRemoteCanvasClear,
  ]);

  // ---------------------------------------------------------------------------
  // Emission Helpers
  // ---------------------------------------------------------------------------

  /**
   * Emits throttled cursor movement (~33 updates/sec max).
   */
  const sendCursorMove = useCallback(
    (worldCoords) => {
      if (!boardId) return;
      const now = Date.now();
      if (now - lastCursorEmitRef.current > 30) {
        lastCursorEmitRef.current = now;
        emit("cursor:move", { boardId, cursor: worldCoords });
      }
    },
    [boardId, emit]
  );

  const sendCursorLeave = useCallback(() => {
    if (boardId) emit("cursor:leave", { boardId });
  }, [boardId, emit]);

  const sendShapeCreate = useCallback(
    (shape) => {
      if (!boardId || !shape) return;
      emit("shape:create", { boardId, shape });
    },
    [boardId, emit]
  );

  const sendShapesUpdate = useCallback(
    (shapes) => {
      if (!boardId || !shapes?.length) return;
      emit("shape:update", { boardId, shapes });
    },
    [boardId, emit]
  );

  const sendShapesDelete = useCallback(
    (shapeIds) => {
      if (!boardId || !shapeIds?.length) return;
      emit("shape:delete", { boardId, shapeIds });
    },
    [boardId, emit]
  );

  const sendCanvasClear = useCallback(() => {
    if (boardId) emit("canvas:clear", { boardId });
  }, [boardId, emit]);

  const sendStrokeStart = useCallback(
    (stroke) => {
      if (boardId && stroke) emit("stroke:start", { boardId, stroke });
    },
    [boardId, emit]
  );

  const sendStrokeUpdate = useCallback(
    (strokeId, points) => {
      if (boardId && strokeId && points?.length) {
        emit("stroke:update", { boardId, strokeId, points });
      }
    },
    [boardId, emit]
  );

  const sendStrokeEnd = useCallback(
    (strokeId, shape) => {
      if (boardId && strokeId) {
        emit("stroke:end", { boardId, strokeId, shape });
      }
    },
    [boardId, emit]
  );

  const sendSelectionUpdate = useCallback(
    (selectedIds) => {
      if (boardId) {
        emit("selection:update", { boardId, selectedIds });
      }
    },
    [boardId, emit]
  );

  return {
    connectionStatus,
    isConnected,
    socketId,
    collaborators,
    remoteCursors,
    remoteSelections,
    remoteStrokes,
    sendCursorMove,
    sendCursorLeave,
    sendShapeCreate,
    sendShapesUpdate,
    sendShapesDelete,
    sendCanvasClear,
    sendStrokeStart,
    sendStrokeUpdate,
    sendStrokeEnd,
    sendSelectionUpdate,
  };
};

export default useCollaboration;
