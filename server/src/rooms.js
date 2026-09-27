/**
 * rooms.js — In-Memory Room & Presence Manager
 *
 * Tracks connected users, socket IDs, and presence information per whiteboard room.
 * Keeps presence completely transient in memory (not stored to Firestore).
 */

class RoomManager {
  constructor() {
    // Map<boardId, Map<socketId, UserPresence>>
    this.rooms = new Map();
  }

  /**
   * Registers a socket client joining a board room.
   * @param {string} boardId
   * @param {string} socketId
   * @param {Object} user - User metadata { uid, displayName, email, photoURL }
   * @param {string} role - "owner" | "editor" | "viewer"
   */
  joinRoom(boardId, socketId, user, role = "editor") {
    if (!this.rooms.has(boardId)) {
      this.rooms.set(boardId, new Map());
    }

    const room = this.rooms.get(boardId);
    room.set(socketId, {
      socketId,
      userId: user.uid,
      displayName: user.displayName || "Collaborator",
      email: user.email || "",
      photoURL: user.photoURL || "",
      role,
      joinedAt: Date.now(),
    });

    console.log(
      `[RoomManager] User "${user.displayName}" (${user.uid}) joined board "${boardId}" as ${role} (${room.size} active)`
    );
  }

  /**
   * Unregisters a socket client leaving a board room.
   * @param {string} boardId
   * @param {string} socketId
   * @returns {Object | null} The user presence that left
   */
  leaveRoom(boardId, socketId) {
    if (this.rooms.has(boardId)) {
      const room = this.rooms.get(boardId);
      const user = room.get(socketId);
      room.delete(socketId);
      console.log(`[RoomManager] Socket ${socketId} left board "${boardId}"`);

      if (room.size === 0) {
        this.rooms.delete(boardId);
      }
      return user || null;
    }
    return null;
  }

  /**
   * Cleans up room memberships when a socket disconnects.
   * @param {string} socketId
   * @returns {Array<{ boardId: string, user: Object }>}
   */
  handleDisconnect(socketId) {
    const leftRooms = [];
    for (const [boardId, room] of this.rooms.entries()) {
      if (room.has(socketId)) {
        const user = room.get(socketId);
        room.delete(socketId);
        if (room.size === 0) {
          this.rooms.delete(boardId);
        }
        leftRooms.push({ boardId, user });
      }
    }
    return leftRooms;
  }

  /**
   * Gets the array of active user presences in a room.
   * @param {string} boardId
   * @returns {Array<Object>}
   */
  getRoomUsers(boardId) {
    if (!this.rooms.has(boardId)) return [];
    return Array.from(this.rooms.get(boardId).values());
  }
}

export const roomManager = new RoomManager();
