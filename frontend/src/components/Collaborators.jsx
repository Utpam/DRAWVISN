import React, { useState } from "react";
import { getCollaboratorColor } from "./CursorOverlay";

const STATUS = {
  connected: { label: "Connected", className: "is-connected" },
  connecting: { label: "Connecting", className: "is-connecting" },
  reconnecting: { label: "Reconnecting", className: "is-connecting" },
  disconnected: { label: "Offline", className: "is-offline" },
  error: { label: "Offline", className: "is-offline" },
};

export const Collaborators = ({
  collaborators = [],
  currentUser = null,
  connectionStatus = "disconnected",
}) => {
  const [showList, setShowList] = useState(false);
  const connected = connectionStatus === "connected";
  const effectiveCollaborators = collaborators.length > 0
    ? collaborators
    : connected && currentUser
      ? [{
          socketId: "self",
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "You",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          role: "owner",
        }]
      : [];
  const status = STATUS[connectionStatus] || STATUS.disconnected;

  return (
    <div className="collaboration-presence">
      <div
        className={`connection-status ${status.className}`}
        role="status"
        aria-live="polite"
        title={`Real-time collaboration: ${status.label.toLowerCase()}`}
      >
        <span className="connection-status__dot" aria-hidden="true" />
        <span>{status.label}</span>
      </div>

      {connected && effectiveCollaborators.length > 0 && (
        <div className="collaborator-list">
          <button
            type="button"
            className="collaborator-list__trigger"
            onClick={() => setShowList((previous) => !previous)}
            aria-label={`Show ${effectiveCollaborators.length} active collaborator${effectiveCollaborators.length === 1 ? "" : "s"}`}
            aria-expanded={showList}
            title="Active collaborators"
          >
            {effectiveCollaborators.slice(0, 3).map((collaborator, index) => {
              const color = getCollaboratorColor(collaborator.userId || collaborator.socketId);
              const initial = (collaborator.displayName || collaborator.email || "U")
                .charAt(0).toUpperCase();
              return (
                <span
                  key={collaborator.socketId || collaborator.userId || index}
                  className="collaborator-avatar"
                  style={{ "--collaborator-color": color }}
                  title={collaborator.displayName || collaborator.email || "Collaborator"}
                >
                  {collaborator.photoURL ? (
                    <img src={collaborator.photoURL} alt="" />
                  ) : initial}
                </span>
              );
            })}
            {effectiveCollaborators.length > 3 && (
              <span className="collaborator-avatar collaborator-avatar--more">
                +{effectiveCollaborators.length - 3}
              </span>
            )}
          </button>

          {showList && (
            <>
              <button
                type="button"
                className="collaborator-list__dismiss"
                aria-label="Close collaborator list"
                onClick={() => setShowList(false)}
              />
              <div className="collaborator-list__popover">
                <h2>In this board</h2>
                {effectiveCollaborators.map((collaborator) => {
                  const isYou = currentUser && collaborator.userId === currentUser.uid;
                  return (
                    <div
                      className="collaborator-list__item"
                      key={collaborator.socketId || collaborator.userId}
                    >
                      <span className="collaborator-list__name">
                        {collaborator.displayName || collaborator.email || "Collaborator"}
                        {isYou ? " (you)" : ""}
                      </span>
                      <span>{collaborator.role || "editor"}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Collaborators;
