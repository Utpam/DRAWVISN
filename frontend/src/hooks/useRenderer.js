import { useEffect, useMemo } from "react";
import { getBoundingBox, getSelectionBounds } from "./useTransform.js";
import { applyStyle } from "../utils/applyStyle.js";
import { DEFAULT_STYLE } from "../styles/defaultStyle.js";
import { resolveThemeStrokeColor } from "../utils/themeStroke.js";

const getThemeStyle = (style, isDark) => {
    const resolvedStyle = { ...DEFAULT_STYLE, ...style };
    return {
        ...resolvedStyle,
        strokeColor: resolveThemeStrokeColor(resolvedStyle.strokeColor, isDark),
    };
};

export const useRenderer = (
    canvasRef,
    shapes,
    camera = { x: 0, y: 0, zoom: 1 },
    selectedIds = [],
    remoteStrokes = {},
    remoteSelections = {},
    renderKey,
    isDark = true
) => {

    // -------------------------------------------------------------------------
    // Renderer functions
    // Each renderer:
    //  1. Calls ctx.save()
    //  2. Calls applyStyle(ctx, shape.style ?? DEFAULT_STYLE)
    //  3. Draws geometry (fill then stroke where applicable)
    //  4. Calls ctx.restore()
    //
    // selectBox and eraser keep hardcoded styles — they are internal tools,
    // not user-styleable shapes.
    // -------------------------------------------------------------------------
    const renderers = useMemo(() => ({

        // ── Selection box preview (not a user shape) ──────────────────────────
        selectBox: (ctx, shape) => {
            ctx.save();
            ctx.strokeStyle = isDark ? "rgba(220, 220, 220, 0.82)" : "rgba(45, 45, 45, 0.78)";
            ctx.fillStyle   = isDark ? "rgba(220, 220, 220, 0.06)" : "rgba(45, 45, 45, 0.05)";
            ctx.lineWidth   = 1;
            ctx.lineCap     = "round";
            ctx.lineJoin    = "round";
            ctx.setLineDash([5, 3]);
            ctx.globalAlpha = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = "transparent";
            if (shape.width !== undefined && shape.height !== undefined) {
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            }
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            ctx.restore();
        },

        // ── Rectangle ─────────────────────────────────────────────────────────
        rect: (ctx, shape) => {
            const s = getThemeStyle(shape.style, isDark);
            ctx.save();
            applyStyle(ctx, s);
            if (s.fillColor !== "transparent") {
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
            }
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            ctx.restore();
        },

        // ── Freehand pen ──────────────────────────────────────────────────────
        pen: (ctx, shape) => {
            if (!shape || !shape.points || shape.points.length < 2) return;

            ctx.save();
            applyStyle(ctx, getThemeStyle(shape.style, isDark));

            const points = shape.points;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length - 1; i++) {
                const midX = (points[i].x + points[i + 1].x) / 2;
                const midY = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
            }

            ctx.lineTo(
                points[points.length - 1].x,
                points[points.length - 1].y
            );
            ctx.stroke();
            ctx.restore();
        },

        // ── Eraser (internal — renders nothing; eraser acts by filtering shapes) ──
        eraser: () => {},

        // ── Circle / ellipse ──────────────────────────────────────────────────
        circle: (ctx, shape) => {
            const s = getThemeStyle(shape.style, isDark);
            ctx.save();
            applyStyle(ctx, s);
            ctx.beginPath();
            // ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            ctx.ellipse(
                shape.x,
                shape.y,
                Math.abs(shape.radiusX),
                Math.abs(shape.radiusY),
                0,
                0,
                2 * Math.PI
            );
            if (s.fillColor !== "transparent") {
                ctx.fill();
            }
            ctx.stroke();
            ctx.restore();
        },

        // ── Straight line ─────────────────────────────────────────────────────
        line: (ctx, shape) => {
            ctx.save();
            applyStyle(ctx, getThemeStyle(shape.style, isDark));
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
            ctx.restore();
        },

        // ── Text ──────────────────────────────────────────────────────────────
        // strokeColor drives text colour (same convention as Excalidraw).
        // fillColor is not applicable to text shapes.
        text: (ctx, shape) => {
            const s = getThemeStyle(shape.style, isDark);
            ctx.save();
            ctx.globalAlpha   = s.opacity;
            ctx.font          = `${shape.fontSize ?? 16}px Arial`;
            ctx.fillStyle     = s.strokeColor;   // text colour = strokeColor
            ctx.textBaseline  = "top";
            ctx.shadowColor   = s.shadow ? s.shadowColor : "transparent";
            ctx.shadowBlur    = s.shadow ? s.shadowBlur  : 0;
            ctx.fillText(shape.text, shape.x, shape.y);
            ctx.restore();
        },
    }), [isDark]);

    // -------------------------------------------------------------------------
    // Main render effect — reruns whenever shapes, camera, or selection changes
    // -------------------------------------------------------------------------
    useEffect(() => {
        const canvas = canvasRef?.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Clear canvas and reset to identity
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply camera transform
        ctx.setTransform(
            camera.zoom,
            0,
            0,
            camera.zoom,
            -camera.x * camera.zoom,
            -camera.y * camera.zoom
        );

        // 1. Draw all saved shapes
        shapes.forEach(shape => {
            if (!shape || !shape.type || !renderers[shape.type]) return;
            renderers[shape.type](ctx, shape);
        });

        // 2. Draw live in-progress remote pen strokes
        if (remoteStrokes && Object.keys(remoteStrokes).length > 0) {
            Object.values(remoteStrokes).forEach(stroke => {
                if (stroke && renderers.pen) {
                    renderers.pen(ctx, stroke);
                }
            });
        }

        // 3. Draw one resize frame around the full local selection.
        const selectedShapes = shapes.filter((shape) => selectedIds?.includes(shape.id));
        const selectionBounds = getSelectionBounds(selectedShapes);
        if (selectionBounds) {
            ctx.save();
            ctx.strokeStyle = isDark ? "rgba(220, 220, 220, 0.82)" : "rgba(45, 45, 45, 0.78)";
            ctx.lineWidth = 1 / camera.zoom;
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = "transparent";
            ctx.strokeRect(
                selectionBounds.minX,
                selectionBounds.minY,
                selectionBounds.maxX - selectionBounds.minX,
                selectionBounds.maxY - selectionBounds.minY
            );

            const centerX = (selectionBounds.minX + selectionBounds.maxX) / 2;
            const centerY = (selectionBounds.minY + selectionBounds.maxY) / 2;
            const handleRadius = 4 / camera.zoom;
            ctx.fillStyle = isDark ? "#171717" : "#f8f8f6";

            const drawHandle = (x, y) => {
                ctx.beginPath();
                ctx.arc(x, y, handleRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            };

            drawHandle(selectionBounds.minX, selectionBounds.minY);
            drawHandle(centerX, selectionBounds.minY);
            drawHandle(selectionBounds.maxX, selectionBounds.minY);
            drawHandle(selectionBounds.maxX, centerY);
            drawHandle(selectionBounds.maxX, selectionBounds.maxY);
            drawHandle(centerX, selectionBounds.maxY);
            drawHandle(selectionBounds.minX, selectionBounds.maxY);
            drawHandle(selectionBounds.minX, centerY);
            ctx.restore();
        }

        // 4. Draw remote collaborator selections with subtle colored dashes
        if (remoteSelections && Object.keys(remoteSelections).length > 0) {
            Object.values(remoteSelections).forEach((selData) => {
                if (!selData || !selData.selectedIds) return;
                shapes.forEach(shape => {
                    if (selData.selectedIds.includes(shape.id)) {
                        const bb = getBoundingBox(shape);
                        if (!bb) return;
                        ctx.save();
                        ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
                        ctx.lineWidth = 1.5 / camera.zoom;
                        ctx.setLineDash([4, 4]);
                        ctx.strokeRect(bb.minX - 2, bb.minY - 2, bb.maxX - bb.minX + 4, bb.maxY - bb.minY + 4);
                        ctx.restore();
                    }
                });
            });
        }

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, [canvasRef, shapes, camera, selectedIds, remoteStrokes, remoteSelections, renderers, renderKey, isDark]);

    return { renderers };
};