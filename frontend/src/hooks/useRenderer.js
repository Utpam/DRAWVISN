import { useEffect } from "react";
import { getBoundingBox } from "./useTransform.js";
import { applyStyle } from "../utils/applyStyle.js";
import { DEFAULT_STYLE } from "../styles/defaultStyle.js";

export const useRenderer = (canvasRef, shapes, camera = { x: 0, y: 0, zoom: 1 }, selectedIds = []) => {

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
    const renderers = {

        // ── Selection box preview (not a user shape) ──────────────────────────
        selectBox: (ctx, shape) => {
            ctx.save();
            ctx.strokeStyle = "rgba(100, 150, 255, 0.9)";
            ctx.fillStyle   = "rgba(100, 150, 255, 0.08)";
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
            const s = { ...DEFAULT_STYLE, ...shape.style };
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
            applyStyle(ctx, shape.style ?? DEFAULT_STYLE);

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
        eraser: (_ctx, _shape) => {
            // Eraser strokes are never stored as permanent shapes.
            // This renderer is kept as a no-op for type safety.
        },

        // ── Circle / ellipse ──────────────────────────────────────────────────
        circle: (ctx, shape) => {
            const s = { ...DEFAULT_STYLE, ...shape.style };
            ctx.save();
            applyStyle(ctx, s);
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            if (s.fillColor !== "transparent") {
                ctx.fill();
            }
            ctx.stroke();
            ctx.restore();
        },

        // ── Straight line ─────────────────────────────────────────────────────
        line: (ctx, shape) => {
            ctx.save();
            applyStyle(ctx, shape.style ?? DEFAULT_STYLE);
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
            const s = { ...DEFAULT_STYLE, ...shape.style };
            ctx.save();
            ctx.globalAlpha   = s.opacity;
            ctx.font          = "16px Arial";
            ctx.fillStyle     = s.strokeColor;   // text colour = strokeColor
            ctx.textBaseline  = "top";
            ctx.shadowColor   = s.shadow ? s.shadowColor : "transparent";
            ctx.shadowBlur    = s.shadow ? s.shadowBlur  : 0;
            ctx.fillText(shape.text, shape.x, shape.y);
            ctx.restore();
        },
    };

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

        // Draw all shapes (each renderer manages its own save/restore)
        shapes.forEach(shape => {
            if (!shape || !shape.type || !renderers[shape.type]) return;
            renderers[shape.type](ctx, shape);
        });

        // Draw selection highlights on top
        shapes.forEach(shape => {
            if (!selectedIds || !selectedIds.includes(shape.id)) return;

            const bb = getBoundingBox(shape);
            if (!bb) return;

            ctx.save();
            ctx.strokeStyle = "rgba(100, 150, 255, 0.9)";
            ctx.lineWidth   = 1 / camera.zoom;
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = "transparent";
            ctx.strokeRect(bb.minX, bb.minY, bb.maxX - bb.minX, bb.maxY - bb.minY);

            // Corner handles
            const handleSize = 8 / camera.zoom;
            ctx.fillStyle   = "white";

            const drawHandle = (x, y) => {
                ctx.beginPath();
                ctx.arc(x, y, handleSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            };

            drawHandle(bb.minX, bb.minY); // nw
            drawHandle(bb.maxX, bb.minY); // ne
            drawHandle(bb.minX, bb.maxY); // sw
            drawHandle(bb.maxX, bb.maxY); // se
            ctx.restore();
        });

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, [shapes, camera, selectedIds]);

    return { renderers };
};