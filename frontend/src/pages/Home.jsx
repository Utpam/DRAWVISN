/**
 * Home.jsx — Dashboard Page
 *
 * Route: /dashboard (Protected)
 *
 * Board data and CRUD operations are managed by useBoards; this page handles
 * the workspace controls and layout.
 */

import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { useToast } from "../components/Toast";
import useBoards from "../hooks/useBoards";
import BoardCard from "../components/BoardCard";
import "./Home.css";

const getTimestamp = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function DashboardPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    boards,
    userDoc,
    loading,
    error,
    createBoard,
    deleteBoard,
    renameBoard,
    duplicateBoard,
  } = useBoards();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [actionLoading, setActionLoading] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const filteredBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchingBoards = query
      ? boards.filter((board) => String(board.title || "").toLowerCase().includes(query))
      : [...boards];

    return matchingBoards.sort((a, b) => {
      if (sortBy === "title") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      return getTimestamp(b[sortBy]) - getTimestamp(a[sortBy]);
    });
  }, [boards, searchQuery, sortBy]);

  const boardCount = userDoc?.boardCount ?? boards.length;
  const boardLimit = userDoc?.boardLimit ?? 10;
  const atLimit = boardCount >= boardLimit;
  const limitPercent = boardLimit > 0
    ? Math.min((boardCount / boardLimit) * 100, 100)
    : 0;

  const handleCreateBoard = async () => {
    if (atLimit) {
      toast.error("Board limit reached. Upgrade to Pro for unlimited boards.");
      return;
    }

    setActionLoading("new");
    try {
      const result = await createBoard();
      if (result?.error === "BOARD_LIMIT_REACHED") {
        toast.error("Board limit reached. Upgrade to Pro for unlimited boards.");
      } else if (result?.error) {
        toast.error(result.error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (boardId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(boardId);
    try {
      const result = await deleteBoard(boardId);
      if (result?.error) toast.error(result.error);
      else toast.success(`"${title}" deleted.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (boardId, title) => {
    if (atLimit) {
      toast.error("Board limit reached. Delete a board or upgrade to duplicate.");
      return;
    }

    setActionLoading(boardId);
    try {
      const result = await duplicateBoard(boardId);
      if (result?.error === "BOARD_LIMIT_REACHED") {
        toast.error("Board limit reached. Delete a board or upgrade to duplicate.");
      } else if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${title}" duplicated.`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRename = async (boardId, title) => {
    setActionLoading(boardId);
    try {
      const result = await renameBoard(boardId, title);
      if (result?.error) toast.error(result.error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate("/");
    } catch {
      toast.error("Sign-out failed. Please try again.");
      setSigningOut(false);
    }
  };

  const displayName = user?.displayName || user?.email || "Account";
  const initials = displayName.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link className="dashboard-brand" to="/dashboard" aria-label="DRAVISN workspace">
            <span className="dashboard-brand__mark" aria-hidden="true">D</span>
            <span>DRAVISN</span>
          </Link>

          <details className="account-menu">
            <summary className="account-menu__trigger" aria-label="Open account menu">
              {user?.photoURL ? (
                <img className="account-menu__avatar" src={user.photoURL} alt="" />
              ) : (
                <span className="account-menu__avatar account-menu__avatar--initials">
                  {initials}
                </span>
              )}
              <span className="account-menu__identity">
                <span className="account-menu__name">{displayName}</span>
                <span className="account-menu__plan">{userDoc?.plan || "Free"} plan</span>
              </span>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="account-menu__chevron">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </summary>
            <div className="account-menu__popover">
              <div className="account-menu__details">
                <span className="account-menu__details-name">{displayName}</span>
                {user?.email && <span className="account-menu__email">{user.email}</span>}
                <span className="account-menu__plan-detail">
                  {userDoc?.plan || "Free"} plan · {boardCount} of {boardLimit} boards
                </span>
              </div>
              <button
                id="btn-sign-out"
                className="account-menu__signout"
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </details>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="workspace-heading" aria-labelledby="workspace-title">
          <div>
            <p className="workspace-eyebrow">WORKSPACE</p>
            <h1 id="workspace-title">My boards</h1>
            <p className="workspace-description">
              Your ideas, all in one place.
            </p>
          </div>
          <button
            id="btn-create-board"
            className="create-board-button"
            type="button"
            onClick={handleCreateBoard}
            disabled={actionLoading === "new" || atLimit || loading}
            title={atLimit ? "Board limit reached" : "Create a new board"}
          >
            {actionLoading === "new" ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Creating…
              </>
            ) : (
              <>
                <svg aria-hidden="true" viewBox="0 0 20 20">
                  <path d="M10 4v12M4 10h12" />
                </svg>
                New board
              </>
            )}
          </button>
        </section>

        <section className="board-tools" aria-label="Board controls">
          <label className="board-search">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <circle cx="8.75" cy="8.75" r="5.75" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              id="board-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search boards"
              aria-label="Search boards"
            />
            {searchQuery && (
              <button
                type="button"
                className="board-search__clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <label className="board-sort">
            <span>Sort by</span>
            <select
              id="board-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort boards"
            >
              <option value="updatedAt">Recently edited</option>
              <option value="createdAt">Recently created</option>
              <option value="title">Name</option>
            </select>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </label>
        </section>

        <section className="board-library" aria-label="Your boards">
          <div className="board-library__heading">
            <h2>All boards</h2>
            <span>{loading ? "Loading…" : `${boards.length} ${boards.length === 1 ? "board" : "boards"}`}</span>
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="board-grid" aria-label="Loading boards">
              {[1, 2, 3].map((item) => (
                <div className="board-card-skeleton" key={item} />
              ))}
            </div>
          )}

          {!loading && !error && filteredBoards.length === 0 && (
            <div className="board-empty">
              <h3>{searchQuery ? "No boards found" : "No boards yet"}</h3>
              <p>
                {searchQuery
                  ? `No boards match “${searchQuery}”. Try another search.`
                  : "Create a board to start collecting your ideas."}
              </p>
              {searchQuery ? (
                <button type="button" className="text-button" onClick={() => setSearchQuery("")}>
                  Clear search
                </button>
              ) : (
                <button
                  type="button"
                  className="text-button"
                  onClick={handleCreateBoard}
                  disabled={actionLoading === "new" || atLimit}
                >
                  Create your first board
                </button>
              )}
            </div>
          )}

          {!loading && filteredBoards.length > 0 && (
            <div className="board-grid">
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  busy={actionLoading === board.id}
                  onOpen={() => navigate(`/dashboard/${board.id}`)}
                  onRename={(title) => handleRename(board.id, title)}
                  onDuplicate={() => handleDuplicate(board.id, board.title)}
                  onDelete={() => handleDelete(board.id, board.title)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="usage-summary" aria-label="Board usage">
          <div className="usage-summary__copy">
            <span className="usage-summary__label">Board usage</span>
            <span className="usage-summary__count">
              {boardCount} <span>of {boardLimit} boards</span>
            </span>
          </div>
          <div
            className="usage-summary__track"
            role="progressbar"
            aria-label="Board limit usage"
            aria-valuemin={0}
            aria-valuemax={boardLimit}
            aria-valuenow={Math.min(boardCount, boardLimit)}
          >
            <span style={{ width: `${limitPercent}%` }} />
          </div>
          <span className="usage-summary__plan">{userDoc?.plan || "Free"} plan</span>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
