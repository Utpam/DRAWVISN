import { useRef, useEffect, useState } from 'react';
import { useCanvas } from '../hooks/useCanvas.js';
import { Toolbar } from './ToolBar.jsx';
import StylePanel from './StylePanel.jsx';
import { useTheme } from '../hooks/useTheme.js';

function WhiteBoard({ onShapesChange, initialShapes }) {
    const inputRef = useRef(null);
    const { isDark, toggleTheme } = useTheme();

    const {
        canvasRef, tool, shapes, setShapes, setTool,
        startDrawing, draw, stopDrawing, clearCanvas,
        camera, screenToWorld, worldToScreen,
        startPan, updatePan, stopPan, handleZoom,
        generateId, setTextInput, textInput,
        selectedIds, setSelectedIds,
        currentStyle, setCurrentStyle,
    } = useCanvas();

    // ── Load initial shapes from Firestore once ──────────────────────────────
    useEffect(() => {
        if (initialShapes && initialShapes.length > 0) {
            setShapes(initialShapes);
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
    const saveText = () => {
        if (!textInput || !textInput.value.trim()) {
            setTextInput(null);
            return;
        }
        setShapes(prev => [...prev, {
            id: generateId(),
            type: "text",
            x: textInput.x,
            y: textInput.y,
            text: textInput.value,
            style: { ...currentStyle },
        }]);
        setTextInput(null);
    };

    // ── Keyboard shortcuts (delete, escape, ctrl+d(duplicate)) ───────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setTool("selectBox");
                setSelectedIds([]);
            } else if ((e.key === "Delete" || e.key === "Backspace") && !textInput) {
                if (selectedIds?.length > 0) {
                    setShapes(prev => prev.filter(s => !selectedIds.includes(s.id)));
                    setSelectedIds([]);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === "d" && !textInput) {
                e.preventDefault();
                if (selectedIds?.length > 0) {
                    const newShapes = [];
                    const newSelectedIds = [];
                    shapes.forEach(s => {
                        if (selectedIds.includes(s.id)) {
                            const clone = JSON.parse(JSON.stringify(s));
                            clone.id = generateId();
                            if (clone.x  !== undefined) { clone.x  += 20; clone.y  += 20; }
                            if (clone.x1 !== undefined) { clone.x1 += 20; clone.x2 += 20; }
                            if (clone.y1 !== undefined) { clone.y1 += 20; clone.y2 += 20; }
                            if (clone.points) clone.points = clone.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
                            newShapes.push(clone);
                            newSelectedIds.push(clone.id);
                        }
                    });
                    setShapes(prev => [...prev, ...newShapes]);
                    setSelectedIds(newSelectedIds);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shapes, selectedIds, textInput, setShapes, setSelectedIds, setTool, generateId]);

    const zoomPercent = Math.round(camera.zoom * 100);

    return (
        <>
            {/* ── Canvas surface ─────────────────────────────────────────────── */}
            <div className="canvas-bg relative w-full overflow-hidden" style={{ height: "100dvh" }}>
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    style={{ display: "block", position: "absolute", inset: 0 }}
                    onMouseDown={(e) => {
                        if (e.button === 1) { e.preventDefault(); startPan(e.clientX, e.clientY); return; }
                        startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                        if (e.buttons === 4) { updatePan(e.clientX, e.clientY); return; }
                        draw(e);
                    }}
                    onMouseUp={(e) => { stopPan(); stopDrawing(e); }}
                    onMouseLeave={(e) => { stopPan(); stopDrawing(e); }}
                    onWheel={handleZoom}
                />

                {/* ── Floating text input overlay ────────────────────────────── */}
                {textInput && (
                    <form
                        onSubmit={(e) => { e.preventDefault(); saveText(); }}
                        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                    >
                        <input
                            ref={inputRef}
                            value={textInput.value}
                            onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Escape") setTextInput(null); }}
                            onBlur={saveText}
                            style={{
                                position: "absolute",
                                pointerEvents: "auto",
                                top:  worldToScreen(textInput.x, textInput.y).y,
                                left: worldToScreen(textInput.x, textInput.y).x,
                                fontSize: `${16 * camera.zoom}px`,
                                padding: 0,
                                margin: 0,
                                background: "transparent",
                                color: currentStyle?.strokeColor ?? "#ffffff",
                                outline: "none",
                                border: "none",
                            }}
                        />
                    </form>
                )}

                {/* ── Bottom-center toolbar pill ─────────────────────────────── */}
                <div
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40"
                    style={{
                        background: "var(--toolbar-bg)",
                        border: "1px solid var(--toolbar-border)",
                        borderRadius: "16px",
                        padding: "6px 10px",
                        boxShadow: "var(--shadow-lg)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                    }}
                >
                    <Toolbar setTool={setTool} tool={tool} isDark={isDark} />

                    {/* Divider */}
                    <div style={{ width: 1, height: 24, background: "var(--border-strong)", margin: "0 6px", flexShrink: 0 }} />

                    {/* Clear button */}
                    <button
                        id="btn-clear-canvas"
                        onClick={clearCanvas}
                        title="Clear canvas"
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            border: "none",
                            cursor: "pointer",
                            transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                </div>

                {/* ── Bottom-left: zoom indicator ────────────────────────────── */}
                <div
                    className="absolute bottom-5 left-4 z-40 flex items-center gap-1.5"
                    style={{
                        background: "var(--toolbar-bg)",
                        border: "1px solid var(--toolbar-border)",
                        borderRadius: 10,
                        padding: "5px 10px",
                        boxShadow: "var(--shadow-lg)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 60,
                    }}
                >
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" opacity={0.6}>
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                        <path d="M11 8v6M8 11h6"/>
                    </svg>
                    <span className="remove-input-arrow" style={{ minWidth: 28, textAlign: "center" }}>
                        {zoomPercent}%
                    </span>
                </div>

                {/* ── Bottom-right: theme toggle ─────────────────────────────── */}
                <button
                    id="btn-toggle-theme"
                    onClick={toggleTheme}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="absolute bottom-5 right-4 z-40 flex items-center gap-2"
                    style={{
                        background: "var(--toolbar-bg)",
                        border: "1px solid var(--toolbar-border)",
                        borderRadius: 10,
                        padding: "7px 12px",
                        boxShadow: "var(--shadow-lg)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        fontWeight: 600,
                        transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
                >
                    {isDark ? (
                        /* Sun icon — click to go light */
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                    ) : (
                        /* Moon icon — click to go dark */
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    )}
                    <span>{isDark ? "Light" : "Dark"}</span>
                </button>
            </div>

            {/* ── Style Panel (fixed, right edge) ──────────────────────────── */}
            <StylePanel
                currentStyle={currentStyle}
                setCurrentStyle={setCurrentStyle}
                selectedIds={selectedIds}
                shapes={shapes}
                setShapes={setShapes}
                isDark={isDark}
            />
        </>
    );
}

export default WhiteBoard;