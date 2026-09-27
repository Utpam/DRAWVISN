/**
 * boardPermissions.js — Board Permission & Role Authorization
 *
 * Validates board access roles:
 *  - "owner": Full access (create, edit, delete, manage members)
 *  - "editor": Collaborative access (create, update, delete shapes)
 *  - "viewer": Read-only access (receives realtime updates, cannot modify shapes)
 */

class PermissionManager {
  constructor() {
    // Map<`${boardId}_${socketId}`, { role: "owner" | "editor" | "viewer", userId: string }>
    this.sessionPermissions = new Map();
  }

  setRole(boardId, socketId, userId, role = "editor") {
    this.sessionPermissions.set(`${boardId}_${socketId}`, { role, userId });
  }

  getRole(boardId, socketId) {
    const perm = this.sessionPermissions.get(`${boardId}_${socketId}`);
    return perm ? perm.role : "editor";
  }

  canEdit(boardId, socketId) {
    const role = this.getRole(boardId, socketId);
    return role === "owner" || role === "editor";
  }

  removeSession(boardId, socketId) {
    this.sessionPermissions.delete(`${boardId}_${socketId}`);
  }

  handleDisconnect(socketId) {
    for (const key of this.sessionPermissions.keys()) {
      if (key.endsWith(`_${socketId}`)) {
        this.sessionPermissions.delete(key);
      }
    }
  }
}

export const permissionManager = new PermissionManager();
