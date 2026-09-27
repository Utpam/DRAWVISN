/**
 * useSocket.js — Socket.IO Connection & Lifecycle Hook
 *
 * Manages:
 *  - Firebase ID Token authentication for socket connection
 *  - Connection, disconnection, reconnecting, and error states
 *  - Joining & leaving board room (`board:join`, `board:leave`)
 *  - Event emitting and subscription helpers
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { socket, updateSocketAuth } from "../services/socket";

export const useSocket = (boardId, user = null, role = "editor") => {
  const [connectionStatus, setConnectionStatus] = useState(
    socket.connected ? "connected" : "disconnected"
  );
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!boardId) return;

    let isMounted = true;

    const setupConnection = async () => {
      setConnectionStatus("connecting");

      try {
        let token = null;
        if (userRef.current && typeof userRef.current.getIdToken === "function") {
          try {
            token = await userRef.current.getIdToken();
          } catch (e) {
            console.warn("[useSocket] Could not retrieve ID token:", e.message);
          }
        }

        updateSocketAuth(token, userRef.current);

        if (!socket.connected) {
          socket.connect();
        } else {
          // If already connected, join the board room immediately
          socket.emit("board:join", { boardId, role });
          if (isMounted) setConnectionStatus("connected");
        }
      } catch (err) {
        console.warn("[useSocket] Error setting up socket connection:", err.message);
        if (!socket.connected) socket.connect();
      }
    };

    const onConnect = () => {
      console.log(`[useSocket] Connected to server (Socket ID: ${socket.id})`);
      if (isMounted) setConnectionStatus("connected");
      socket.emit("board:join", { boardId, role });
    };

    const onDisconnect = (reason) => {
      console.log(`[useSocket] Disconnected from server (Reason: ${reason})`);
      if (isMounted) setConnectionStatus("disconnected");
    };

    const onConnectError = (err) => {
      console.warn("[useSocket] Connection error:", err.message);
      if (isMounted) setConnectionStatus("error");
    };

    const onReconnectAttempt = () => {
      if (isMounted) setConnectionStatus("reconnecting");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    setupConnection();

    return () => {
      isMounted = false;
      console.log(`[useSocket] Leaving room "${boardId}"`);
      socket.emit("board:leave", { boardId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, [boardId, role, user?.uid]);

  const emit = useCallback((event, data) => {
    if (socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`[useSocket] Cannot emit "${event}": Socket not connected`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === "connected",
    socketId: socket.id,
    emit,
    on,
  };
};

export default useSocket;
