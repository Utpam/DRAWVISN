import { useEffect, useRef, useState } from "react";

const dateLabel = (timestamp) => {
  if (!timestamp) return "Edited just now";
  const date = typeof timestamp.toDate === "function"
    ? timestamp.toDate()
    : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Edited just now";

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Edited ${days}d ago`;

  return `Edited ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })}`;
};

const finite = (value) => Number.isFinite(Number(value));

const getShapeBounds = (shape) => {
  if (!shape) return null;
  if (shape.type === "rect" && [shape.x, shape.y, shape.width, shape.height].every(finite)) {
    return {
      minX: Math.min(shape.x, shape.x + shape.width),
      minY: Math.min(shape.y, shape.y + shape.height),
      maxX: Math.max(shape.x, shape.x + shape.width),
      maxY: Math.max(shape.y, shape.y + shape.height),
    };
  }
  if (shape.type === "circle" && [shape.x, shape.y, shape.radiusX, shape.radiusY].every(finite)) {
    return {
      minX: shape.x - Math.abs(shape.radiusX),
      minY: shape.y - Math.abs(shape.radiusY),
      maxX: shape.x + Math.abs(shape.radiusX),
      maxY: shape.y + Math.abs(shape.radiusY),
    };
  }
  if (shape.type === "line" && [shape.x1, shape.y1, shape.x2, shape.y2].every(finite)) {
    return {
      minX: Math.min(shape.x1, shape.x2),
      minY: Math.min(shape.y1, shape.y2),
      maxX: Math.max(shape.x1, shape.x2),
      maxY: Math.max(shape.y1, shape.y2),
    };
  }
  if (shape.type === "pen" && Array.isArray(shape.points)) {
    return shape.points.reduce((result, point) => {
      if (!finite(point.x) || !finite(point.y)) return result;
      if (!result) return { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y };
      return {
        minX: Math.min(result.minX, point.x),
        minY: Math.min(result.minY, point.y),
        maxX: Math.max(result.maxX, point.x),
        maxY: Math.max(result.maxY, point.y),
      };
    }, null);
  }
  if (shape.type === "text" && finite(shape.x) && finite(shape.y)) {
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x + Math.max(20, String(shape.text || "").length * 9),
      maxY: shape.y + 24,
    };
  }
  return null;
};

function BoardPreview({ board }) {
  const [failedThumbnail, setFailedThumbnail] = useState(null);

  if (board.thumbnail && failedThumbnail !== board.thumbnail) {
    return (
      <img
        className="board-preview__image"
        src={board.thumbnail}
        alt=""
        loading="lazy"
        onError={() => setFailedThumbnail(board.thumbnail)}
      />
    );
  }

  const shapes = (Array.isArray(board.shapes) ? board.shapes : [])
    .filter((shape) => shape?.type !== "eraser");
  const bounds = shapes.map(getShapeBounds).filter(Boolean);

  if (bounds.length === 0) {
    return (
      <div className="board-preview__empty">
        <span className="board-preview__empty-grid" aria-hidden="true" />
        <span>Empty board</span>
      </div>
    );
  }

  const minX = Math.min(...bounds.map((bound) => bound.minX));
  const minY = Math.min(...bounds.map((bound) => bound.minY));
  const maxX = Math.max(...bounds.map((bound) => bound.maxX));
  const maxY = Math.max(...bounds.map((bound) => bound.maxY));
  const width = Math.max(maxX - minX, 40);
  const height = Math.max(maxY - minY, 40);
  const padding = Math.max(width, height) * 0.12;
  const viewBox = `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`;

  return (
    <svg
      className="board-preview__drawing"
      viewBox={viewBox}
      role="img"
      aria-label={`Preview of ${board.title}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id={`grid-${board.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#353d4b" />
        </pattern>
      </defs>
      <rect
        x={minX - padding}
        y={minY - padding}
        width={width + padding * 2}
        height={height + padding * 2}
        fill={`url(#grid-${board.id})`}
      />
      {shapes.map((shape, index) => {
        const stroke = shape.style?.strokeColor || "#e7eaf0";
        const fill = shape.style?.fillColor && shape.style.fillColor !== "transparent"
          ? shape.style.fillColor
          : "none";
        const strokeWidth = Math.max(1, Number(shape.style?.strokeWidth) || 2);
        const opacity = Number.isFinite(Number(shape.style?.opacity))
          ? Number(shape.style.opacity)
          : 1;
        const common = { stroke, fill, strokeWidth, opacity, key: shape.id || index };

        if (shape.type === "rect" && [shape.x, shape.y, shape.width, shape.height].every(finite)) {
          return (
            <rect
              {...common}
              x={Math.min(shape.x, shape.x + shape.width)}
              y={Math.min(shape.y, shape.y + shape.height)}
              width={Math.abs(shape.width)}
              height={Math.abs(shape.height)}
              rx="3"
            />
          );
        }
        if (shape.type === "circle" && [shape.x, shape.y, shape.radiusX, shape.radiusY].every(finite)) {
          return (
            <ellipse
              {...common}
              cx={shape.x}
              cy={shape.y}
              rx={Math.abs(shape.radiusX)}
              ry={Math.abs(shape.radiusY)}
            />
          );
        }
        if (shape.type === "line" && [shape.x1, shape.y1, shape.x2, shape.y2].every(finite)) {
          return (
            <line
              {...common}
              fill="none"
              x1={shape.x1}
              y1={shape.y1}
              x2={shape.x2}
              y2={shape.y2}
            />
          );
        }
        if (shape.type === "pen" && Array.isArray(shape.points)) {
          const points = shape.points
            .filter((point) => finite(point.x) && finite(point.y))
            .map((point) => `${point.x},${point.y}`)
            .join(" ");
          if (!points) return null;
          return (
            <polyline
              {...common}
              points={points}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        if (shape.type === "text" && finite(shape.x) && finite(shape.y)) {
          return (
            <text
              {...common}
              x={shape.x}
              y={shape.y}
              fill={stroke}
              stroke="none"
              fontSize="16"
            >
              {String(shape.text || "").slice(0, 40)}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}

function BoardCard({ board, busy, onOpen, onRename, onDuplicate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const inputRef = useRef(null);
  const cancelRenameRef = useRef(false);
  const renameCommittedRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startRename = () => {
    cancelRenameRef.current = false;
    renameCommittedRef.current = false;
    setTitle(board.title);
    setEditing(true);
  };

  const saveRename = () => {
    if (cancelRenameRef.current || renameCommittedRef.current) {
      cancelRenameRef.current = false;
      return;
    }
    renameCommittedRef.current = true;
    const nextTitle = title.trim();
    setEditing(false);
    if (nextTitle && nextTitle !== board.title) onRename(nextTitle);
  };

  const handleCardKeyDown = (event) => {
    if (event.currentTarget !== event.target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const stopCardClick = (event) => event.stopPropagation();
  const closeMenu = (event) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };
  const handleMenuRename = (event) => {
    closeMenu(event);
    startRename();
  };
  const handleMenuDuplicate = (event) => {
    closeMenu(event);
    onDuplicate();
  };
  const handleMenuDelete = (event) => {
    closeMenu(event);
    onDelete();
  };

  return (
    <article
      className={`board-card${busy ? " board-card--busy" : ""}`}
      role="link"
      tabIndex={0}
      aria-label={`Open ${board.title}`}
      onClick={onOpen}
      onKeyDown={handleCardKeyDown}
    >
      <div className="board-card__preview">
        <BoardPreview board={board} />
        <details
          className="board-card__menu"
          onClick={stopCardClick}
          onKeyDown={stopCardClick}
        >
          <summary aria-label={`Actions for ${board.title}`} title="Board actions">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <circle cx="4" cy="10" r="1" />
              <circle cx="10" cy="10" r="1" />
              <circle cx="16" cy="10" r="1" />
            </svg>
          </summary>
          <div className="board-card__menu-list">
            <button type="button" onClick={handleMenuRename}>Rename</button>
            <button type="button" onClick={handleMenuDuplicate}>Duplicate</button>
            <span className="board-card__menu-divider" />
            <button
              className="board-card__menu-delete"
              type="button"
              onClick={handleMenuDelete}
            >
              Delete
            </button>
          </div>
        </details>
        {busy && (
          <div className="board-card__busy" aria-label="Working">
            <span className="button-spinner" />
          </div>
        )}
      </div>

      <div className="board-card__body">
        <div className="board-card__heading">
          {editing ? (
            <input
              ref={inputRef}
              className="board-card__rename"
              value={title}
              aria-label={`Rename ${board.title}`}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              onClick={stopCardClick}
              onBlur={saveRename}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  saveRename();
                } else if (event.key === "Escape") {
                  cancelRenameRef.current = true;
                  setEditing(false);
                  setTitle(board.title);
                }
              }}
            />
          ) : (
            <h3 title={board.title}>{board.title || "Untitled board"}</h3>
          )}
          <span className="board-card__open-indicator" aria-hidden="true">↗</span>
        </div>
        <p className="board-card__edited">{dateLabel(board.updatedAt || board.createdAt)}</p>
      </div>
    </article>
  );
}

export default BoardCard;
