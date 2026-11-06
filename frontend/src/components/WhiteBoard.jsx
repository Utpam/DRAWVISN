/**
 * WhiteBoard.jsx — Real-Time Collaborative Canvas Component
 *
 * Coordinates:
 *  - Canvas drawing engine (useCanvas, useDrawing, useCamera, useRenderer)
 *  - Real-time collaboration layer (useCollaboration)
 *  - Remote cursor rendering (CursorOverlay)
 *  - Active collaborator presence (Collaborators)
 *  - Share board link modal (ShareBoard)
 *  - Style panel & Toolbar
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useCanvas } from "../hooks/useCanvas.js";
import { Toolbar } from "./ToolBar.jsx";
import StylePanel from "./StylePanel.jsx";
import { resolveThemeStrokeColor } from "../utils/themeStroke.js";
import { useTheme } from "../hooks/useTheme.js";
import { useCollaboration } from "../hooks/useCollaboration.js";
import CursorOverlay from "./CursorOverlay.jsx";
import Collaborators from "./Collaborators.jsx";
import ShareBoard from "./ShareBoard.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import "./WhiteBoard.css";

function WhiteBoard({
  onShapesChange,
  initialShapes = [],
  boardId,
  boardTitle = "Whiteboard",
  onRenameBoard,
  user,
  role = "editor",
}) {
  const inputRef = useRef(null);
  const titleInputRef = useRef(null);
  const skipTitleBlurRef = useRef(false);
  const canvasHostRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [titleDraft, setTitleDraft] = useState(boardTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const { toggleTheme, isDark } = useTheme();
  const previousIsDarkRef = useRef(null);

  // ── Collaboration Layer ──────────────────────────────────────────────────
  const {
    connectionStatus,
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
  } = useCollaboration({
    boardId,
    user,
    role,
    onRemoteShapeCreate: (shape) => addShape(shape),
    onRemoteShapesUpdate: (updatedList) => updateShapes(updatedList),
    onRemoteShapesDelete: (shapeIds) => deleteShapes(shapeIds),
    onRemoteCanvasClear: () => clearAllShapes(),
  });

  // ── Local Canvas State & Drawing Engine ───────────────────────────────────
  const {
    canvasRef,
    tool,
    shapes,
    setShapes,
    replaceShapes,
    undoShapes,
    canUndo,
    addShape,
    updateShapes,
    deleteShapes,
    clearAllShapes,
    setTool,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    camera,
    screenToWorld,
    worldToScreen,
    startPan,
    updatePan,
    stopPan,
    handleZoom,
    zoomBy,
    resetZoom,
    generateId,
    setTextInput,
    textInput,
    selectedIds,
    setSelectedIds,
    currentStyle,
    setCurrentStyle,
  } = useCanvas({
    onShapeCreated: (shape) => sendShapeCreate(shape),
    onShapesUpdated: (updatedList) => sendShapesUpdate(updatedList),
    onShapesDeleted: (shapeIds) => sendShapesDelete(shapeIds),
    onCanvasCleared: () => sendCanvasClear(),
    onStrokeStart: (stroke) => sendStrokeStart(stroke),
    onStrokeUpdate: (strokeId, points) => sendStrokeUpdate(strokeId, points),
    onStrokeEnd: (strokeId, shape) => sendStrokeEnd(strokeId, shape),
    onSelectionUpdate: (selIds) => sendSelectionUpdate(selIds),
    remoteStrokes,
    remoteSelections,
    canvasSize,
    isDark,
    ownerId: user?.uid,
    creatorName: user?.displayName || user?.email?.split("@")[0] || "Collaborator",
  });

  useEffect(() => {
    if (previousIsDarkRef.current === null) {
      setCurrentStyle((previous) => (
        previous.strokeColor === "#ffffff" || previous.strokeColor === "#000000"
          ? { ...previous, strokeColor: isDark ? "#ffffff" : "#000000" }
          : previous
      ));
      previousIsDarkRef.current = isDark;
      return;
    }

    const previousDefaultColor = previousIsDarkRef.current ? "#ffffff" : "#000000";
    const nextDefaultColor = isDark ? "#ffffff" : "#000000";

    if (previousDefaultColor !== nextDefaultColor) {
      setCurrentStyle((previous) => (
        previous.strokeColor === previousDefaultColor
          ? { ...previous, strokeColor: nextDefaultColor }
          : previous
      ));
      previousIsDarkRef.current = isDark;
    }
  }, [isDark, setCurrentStyle]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return undefined;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCanvasSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    });
    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setTitleDraft(boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const commitTitle = async () => {
    if (skipTitleBlurRef.current) {
      skipTitleBlurRef.current = false;
      return;
    }
    const nextTitle = titleDraft.trim();
    setEditingTitle(false);
    if (!nextTitle || nextTitle === boardTitle) {
      setTitleDraft(boardTitle);
      return;
    }
    const saved = await onRenameBoard?.(nextTitle);
    if (!saved) setTitleDraft(boardTitle);
  };

  // ── Load initial shapes from Firestore once on mount ─────────────────────
  useEffect(() => {
    if (initialShapes && initialShapes.length > 0) {
      replaceShapes(initialShapes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Notify parent (autosave) whenever shapes change ───────────────────────
  useEffect(() => {
    if (onShapesChange) onShapesChange(shapes);
  }, [shapes, onShapesChange]);

  // ── Focus the text input overlay ─────────────────────────────────────────
  useEffect(() => {
    if (textInput && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [textInput, shapes]);

  // ── Commit text shape ─────────────────────────────────────────────────────
  const saveText = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const newShape = {
      id: generateId(),
      type: "text",
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
      fontSize: textInput.fontSize ?? 16,
      style: { ...currentStyle },
      owner: user?.uid || "anon",
      createdBy: user?.uid || "anon",
      creatorName: user?.displayName || "Collaborator",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setShapes((prev) => [...prev, newShape]);
    sendShapeCreate(newShape);
    setTextInput(null);
  }, [textInput, generateId, currentStyle, user, setShapes, sendShapeCreate, setTextInput]);

  const undoLastChange = useCallback(() => {
    const restoredShapes = undoShapes();
    if (!restoredShapes) return;

    const currentById = new Map(shapes.map((shape) => [shape.id, shape]));
    const restoredById = new Map(restoredShapes.map((shape) => [shape.id, shape]));
    const deletedIds = shapes
      .filter((shape) => !restoredById.has(shape.id))
      .map((shape) => shape.id);
    const createdShapes = restoredShapes.filter((shape) => !currentById.has(shape.id));
    const updatedShapes = restoredShapes.filter((shape) => {
      const current = currentById.get(shape.id);
      return current && JSON.stringify(current) !== JSON.stringify(shape);
    });

    if (deletedIds.length > 0) sendShapesDelete(deletedIds);
    createdShapes.forEach((shape) => sendShapeCreate(shape));
    if (updatedShapes.length > 0) sendShapesUpdate(updatedShapes);
    const restoredSelection = selectedIds.filter((id) => restoredById.has(id));
    setSelectedIds(restoredSelection);
    sendSelectionUpdate(restoredSelection);
  }, [
    undoShapes,
    shapes,
    selectedIds,
    sendShapesDelete,
    sendShapeCreate,
    sendShapesUpdate,
    sendSelectionUpdate,
    setSelectedIds,
  ]);

  // ── Keyboard shortcuts (undo, delete, escape, ctrl+d duplicate) ───────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isEditingText = target instanceof HTMLElement
        && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !textInput && !isEditingText) {
        e.preventDefault();
        undoLastChange();
        return;
      }

      if (e.key === "Escape") {
        setTool("selectBox");
        setSelectedIds([]);
        sendSelectionUpdate([]);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !textInput) {
        if (selectedIds?.length > 0) {
          const idsToDelete = [...selectedIds];
          setShapes((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
          setSelectedIds([]);
          sendShapesDelete(idsToDelete);
          sendSelectionUpdate([]);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d" && !textInput) {
        e.preventDefault();
        if (selectedIds?.length > 0) {
          const newShapes = [];
          const newSelectedIds = [];
          shapes.forEach((s) => {
            if (selectedIds.includes(s.id)) {
              const clone = JSON.parse(JSON.stringify(s));
              clone.id = generateId();
              clone.createdBy = user?.uid || "anon";
              clone.owner = user?.uid || "anon";
              clone.creatorName = user?.displayName || "Collaborator";
              clone.createdAt = Date.now();
              clone.updatedAt = Date.now();
              if (clone.x !== undefined) { clone.x += 20; clone.y += 20; }
              if (clone.x1 !== undefined) { clone.x1 += 20; clone.x2 += 20; }
              if (clone.y1 !== undefined) { clone.y1 += 20; clone.y2 += 20; }
              if (clone.points) clone.points = clone.points.map((p) => ({ x: p.x + 20, y: p.y + 20 }));
              newShapes.push(clone);
              newSelectedIds.push(clone.id);
              sendShapeCreate(clone);
            }
          });
          setShapes((prev) => [...prev, ...newShapes]);
          setSelectedIds(newSelectedIds);
          sendSelectionUpdate(newSelectedIds);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    shapes,
    selectedIds,
    textInput,
    setShapes,
    setSelectedIds,
    setTool,
    undoLastChange,
    generateId,
    user,
    sendShapeCreate,
    sendShapesDelete,
    sendSelectionUpdate,
  ]);

  // ── Canvas Mouse Move & Throttled Cursor Emission ────────────────────────
  const handleCanvasMouseMove = (e) => {
    if (e.buttons === 4) {
      updatePan(e.clientX, e.clientY);
      return;
    }
    draw(e);

    if (boardId && screenToWorld) {
      const worldCoords = screenToWorld(e.clientX, e.clientY);
      sendCursorMove(worldCoords);
    }
  };

  const zoomPercent = Math.round(camera.zoom * 100);
  const gridSize = 24 * camera.zoom;
  const gridPositionX = -camera.x * camera.zoom;
  const gridPositionY = -camera.y * camera.zoom;

  return (
    <div className="whiteboard-shell">
      <button
        className="whiteboard-menu-toggle"
        type="button"
        aria-label={headerVisible ? "Hide top bar" : "Show top bar"}
        aria-expanded={headerVisible}
        aria-controls="whiteboard-topbar"
        onClick={() => setHeaderVisible((visible) => !visible)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      {headerVisible && <header id="whiteboard-topbar" className="whiteboard-header">
        <div className="whiteboard-header__left">
          <Link
            to="/dashboard"
            id="btn-back-to-dashboard"
            className="whiteboard-back"
            aria-label="Back to dashboard"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5M7 10h10" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <span className="whiteboard-header__divider" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="whiteboard-title-input"
              value={titleDraft}
              maxLength={100}
              aria-label="Board title"
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                } else if (event.key === "Escape") {
                  skipTitleBlurRef.current = true;
                  setTitleDraft(boardTitle);
                  setEditingTitle(false);
                }
              }}
            />
          ) : (
            <button
              className="whiteboard-title"
              type="button"
              title="Rename board"
              onClick={() => setEditingTitle(true)}
            >
              <span>{boardTitle}</span>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m10.5 3.5 2 2M3 13l3.6-.7 6.7-6.7a1.4 1.4 0 0 0-2-2l-6.7 6.7L3 13Z" />
              </svg>
            </button>
          )}
        </div>

        <div className="whiteboard-header__right">
          <Collaborators
            collaborators={collaborators}
            currentUser={user}
            connectionStatus={connectionStatus}
          />
          <ShareBoard boardId={boardId} boardTitle={boardTitle} />
        </div>
      </header>}

      {/* ── Canvas container ───────────────────────────────────────────────── */}
      <div
        ref={canvasHostRef}
        className="canvas-bg whiteboard-canvas relative w-full overflow-hidden"
        style={{
          height: "100dvh",
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${gridPositionX}px ${gridPositionY}px`,
        }}
      >
        {/* ── Remote Live Cursors ── */}
        <CursorOverlay
          remoteCursors={remoteCursors}
          worldToScreen={worldToScreen}
        />

        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="whiteboard-drawing-canvas"
          onMouseDown={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              startPan(e.clientX, e.clientY);
              return;
            }
            startDrawing(e);
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={(e) => {
            stopPan();
            stopDrawing(e);
          }}
          onMouseLeave={(e) => {
            stopPan();
            stopDrawing(e);
            sendCursorLeave();
          }}
          onWheel={handleZoom}
        />

        {/* ── Floating text input overlay ──────────────────────────────────── */}
        {textInput && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveText();
            }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <input
              ref={inputRef}
              value={textInput.value}
              onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Escape") setTextInput(null);
              }}
              onBlur={saveText}
              style={{
                position: "absolute",
                pointerEvents: "auto",
                top: worldToScreen(textInput.x, textInput.y).y,
                left: worldToScreen(textInput.x, textInput.y).x,
                fontSize: `${(textInput.fontSize ?? 16) * camera.zoom}px`,
                padding: 0,
                margin: 0,
                background: "transparent",
                color: resolveThemeStrokeColor(currentStyle?.strokeColor ?? "#ffffff", isDark),
                outline: "none",
                border: "none",
              }}
            />
          </form>
        )}

        <div className="whiteboard-toolbar">
          <Toolbar setTool={setTool} tool={tool} />
          <span className="whiteboard-toolbar__divider" />
          <button
            className="whiteboard-icon-button"
            type="button"
            onClick={undoLastChange}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14h-2" />
            </svg>
          </button>
          <span className="whiteboard-toolbar__divider" />
          <button
            id="btn-clear-canvas"
            className="whiteboard-icon-button whiteboard-icon-button--clear"
            type="button"
            onClick={clearCanvas}
            title="Clear canvas"
            aria-label="Clear canvas"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
            </svg>
          </button>
        </div>

        <div className="whiteboard-zoom-controls" role="group" aria-label="Canvas zoom">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.2, canvasSize.width, canvasSize.height)}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" /></svg>
          </button>
          <button
            type="button"
            className="whiteboard-zoom-controls__value"
            onClick={resetZoom}
            aria-label={`Zoom ${zoomPercent} percent. Reset zoom`}
            title="Reset zoom"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1.2, canvasSize.width, canvasSize.height)}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12m-6-6h12" /></svg>
          </button>
        </div>
      </div>

      <aside className="whiteboard-theme-panel" aria-label="Theme settings">
        <span className="whiteboard-theme-panel__title">Appearance</span>
        <ThemeToggle
          id="btn-toggle-theme"
          className="whiteboard-theme-panel__toggle"
          isDark={isDark}
          onToggle={toggleTheme}
        />
      </aside>

      {/* ── Style Panel (fixed, right edge) ──────────────────────────────── */}
      <StylePanel
        currentStyle={currentStyle}
        setCurrentStyle={setCurrentStyle}
        selectedIds={selectedIds}
        shapes={shapes}
        setShapes={setShapes}
        tool={tool}
        isDark={isDark}
      />
    </div>
  );
}

export default WhiteBoard;