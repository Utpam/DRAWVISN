import { useEffect, useRef } from "react";
import { doCoordsIntersectShape, moveShape, getBoundingBox } from "./useTransform.js";

const pointToLineDistance = (point, lineStart, lineEnd) => {
    // 1. Calculate the squared length of the line segment
    const lineLengthSquared = Math.pow(lineStart.x - lineEnd.x, 2) + Math.pow(lineStart.y - lineEnd.y, 2);
    
    // If the line is actually just a single dot (length is 0), 
    // just return the distance from the point to that dot
    if (lineLengthSquared === 0) {
        return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    }
    
    // 2. Find where the point "projects" onto the line using the Dot Product
    // This gives us a percentage (from 0 to 1) of how far along the line the closest point is.
    const dotProduct = ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + 
                        (point.y - lineStart.y) * (lineEnd.y - lineStart.y));
    let percentageAlongLine = dotProduct / lineLengthSquared;
    
    // 3. Clamp the percentage between 0 (start of line) and 1 (end of line)
    // This ensures our closest point stays strictly on the segment we drew
    percentageAlongLine = Math.max(0, Math.min(1, percentageAlongLine));
    
    // 4. Find the exact {x, y} coordinates of this closest point on the line
    const closestPointOnLine = {
        x: lineStart.x + percentageAlongLine * (lineEnd.x - lineStart.x),
        y: lineStart.y + percentageAlongLine * (lineEnd.y - lineStart.y)
    };
    
    // 5. Return the true distance between our point and this closest spot
    return Math.hypot(point.x - closestPointOnLine.x, point.y - closestPointOnLine.y);
};

const doPointsIntersectShape = (points, shape) => {
    for (const p of points) {
        if (shape.type === "rect") {
            const minX = Math.min(shape.x, shape.x + shape.width);
            const maxX = Math.max(shape.x, shape.x + shape.width);
            const minY = Math.min(shape.y, shape.y + shape.height);
            const maxY = Math.max(shape.y, shape.y + shape.height);
            if (p.x >= minX - 5 && p.x <= maxX + 5 && p.y >= minY - 5 && p.y <= maxY + 5) {
                return true;
            }
        } else if (shape.type === "circle") {
            // if (Math.hypot(p.x - shape.x, p.y - shape.y) <= shape.radius + 5) {
            if (Math.hypot(p.x - shape.x, p.y - shape.y) <= shape.radiusX) {

                console.log("erased shape:", shape)
                console.log(Math.hypot(p.x - shape.x, p.y - shape.y))
                return true;
            }
        } else if (shape.type === "line") {
            if (pointToLineDistance(p, {x: shape.x1, y: shape.y1}, {x: shape.x2, y: shape.y2}) < 10) {
                return true;
            }
        } else if (shape.type === "pen") {
            for (const sp of shape.points) {
                if (Math.hypot(p.x - sp.x, p.y - sp.y) < 10) return true;
            }
        } else if (shape.type === "text") {
            // Rough bounding box for text
            const approxWidth = shape.text.length * 10;
            const approxHeight = 24;
            if (p.x >= shape.x - 5 && p.x <= shape.x + approxWidth + 5 &&
                p.y >= shape.y - 5 && p.y <= shape.y + approxHeight + 5) {
                return true;
            }
        }
    }
    return false;
};


export const useDrawing = (canvasRef, { shapes, setShapes, tool, setTextInput, selectedIds, setSelectedIds, currentStyle }, camera, renderers) => {
    const currentStroke = useRef(null);
    const isDrawingRef = useRef(false);
    const transformRef = useRef([])
    const startPos = useRef({ x: 0, y: 0 });  // reference for shapes
    const prevPos = useRef({ x: 0, y: 0 });
    const actionMode = useRef(null);
    const generateId = () => crypto.randomUUID();

    // Coords wrt canvas + camera transform
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (camera?.screenToWorld) {
            return camera.screenToWorld(screenX, screenY);
        }

        return {
            x: screenX,
            y: screenY,
        };
    };

    //
    // *** START DRAWING ***
    //
    const startDrawing = (e) => {
    console.log(camera.camera);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d"); // Canvas Context
    
    const { x, y } = getCoords(e);

    if (tool === "selectBox") {
        startPos.current = { x, y };
        prevPos.current = { x, y };
        // Check if we clicked on a shape
        const clickedShape = [...shapes].reverse().find(s => doCoordsIntersectShape(x, y, s));
        if (clickedShape) {
            if (!selectedIds.includes(clickedShape.id)) {
                setSelectedIds([clickedShape.id]);
            }
            actionMode.current = "MOVE";
        } else {
            setSelectedIds([]);
            actionMode.current = "SELECT";
        }
        isDrawingRef.current = true;
        return;
    }   

    if (tool === "rect") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };

    if (tool === "circle") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };

    if (tool === "line") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };


    if (tool === "text") {
        const { x, y } = getCoords(e);
        setTextInput({
            x,
            y,
            value: ""
        });
        return;
    };

    if (tool === "pen") {
      currentStroke.current = {
        id: generateId(),
        type: "pen",
        points: [{ x, y }],
        style: { ...currentStyle },
      };

      isDrawingRef.current = true;
      return;
    };

    if (tool === "eraser") {
      currentStroke.current = {
        id: generateId(),
        type: "eraser",
        points: [{ x, y }]
      };

      isDrawingRef.current = true;
      return;
    };

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();    // Starts a new stroke
    ctx.moveTo(x, y);   // Sets starting point
    // ctx.shadowForStrokeEnabled(false);
    isDrawingRef.current = true;
    };

    //
    // *** DRAWING ***
    //
    const draw = (e) => {
        if (!isDrawingRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const { x, y } = getCoords(e);

        // Set default context styles
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // RECTANGLE
        if (tool === "selectBox") {
            if (actionMode.current === "MOVE") {
                const dx = x - prevPos.current.x;
                const dy = y - prevPos.current.y;
                setShapes(prev => prev.map(s => selectedIds.includes(s.id) ? moveShape(s, dx, dy) : s));
                prevPos.current = { x, y };
            }

            const { x: startX, y: startY } = startPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });

            // preview current selection rectangle
            if (actionMode.current === "SELECT") {
                const previewBox = {
                    type: "selectBox",
                    x: startX,
                    y: startY,
                    width: x - startX,
                    height: y - startY
                };
                renderers.selectBox(ctx, previewBox);
            }

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        };

        if (tool === "rect") {
            const { x: startX, y: startY } = startPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });

            // preview current rectangle — use current style so the preview matches the final shape
            const previewRect = {
                type: "rect",
                x: startX,
                y: startY,
                width: x - startX,
                height: y - startY,
                style: currentStyle,
            };
            renderers.rect(ctx, previewRect);

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        if(tool === "circle") {
            const { x: startX, y: startY } = startPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });

            const dx = x - startX;
            const dy = y - startY;

            const previewCirlce = {
                type: "circle",
                x: startX,
                y: startY,
                radiusX: dx,
                radiusY: dy,
                // radius: Math.hypot(dx, dy),
                style: currentStyle,
            };
            renderers.circle(ctx, previewCirlce);

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        // Line
        if(tool === "line") {
            const {x: startX, y:startY} = startPos.current; 
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });
            
            const {x , y} = getCoords(e)

            const previewLine = {
                type: "line",
                x1: startX,
                y1: startY,
                x2: x,
                y2: y,
                style: currentStyle,
            };
            renderers.line(ctx, previewLine);

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        // PEN
        if (tool === "pen") {
            const points = currentStroke.current.points;
            if (points.length === 0) return;
            
            const last = points[points.length - 1];

            const dx = x - last.x;
            const dy = y - last.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 2) return; // ignore noise
            
            ctx.save();
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );
            // Apply currentStyle so the live pen preview matches the final shape
            ctx.strokeStyle  = currentStyle?.strokeColor ?? "#ffffff";
            ctx.lineWidth    = currentStyle?.strokeWidth  ?? 2;
            ctx.lineCap      = currentStyle?.lineCap      ?? "round";
            ctx.lineJoin     = currentStyle?.lineJoin     ?? "round";
            ctx.globalAlpha  = currentStyle?.opacity      ?? 1;
            ctx.setLineDash(
                currentStyle?.lineStyle === "dashed" ? [10, 5] :
                currentStyle?.lineStyle === "dotted" ? [2, 4]  : []
            );
            ctx.shadowColor  = (currentStyle?.shadow) ? (currentStyle?.shadowColor ?? "rgba(0,0,0,0.5)") : "transparent";
            ctx.shadowBlur   = (currentStyle?.shadow) ? (currentStyle?.shadowBlur  ?? 10) : 0;
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.restore();
            
            points.push({x, y});
            return;
        }

        if(tool === "eraser") {
            const points = currentStroke.current.points;

            if(points.length === 0) return;

            const last = points[points.length - 1];

            const dx = x - last.x;
            const dy = y - last.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 2) return; // ignore noise
            
            ctx.save();
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );
            ctx.strokeStyle = "rgba(57, 57, 57)"; // Make eraser visible as a thick red overlay
            ctx.lineWidth = 15; 
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.restore();
            
            points.push({x, y});
            return;
        }

        // ctx.lineTo(x, y);
        // ctx.stroke();
    }
    //
    // *** STOP DRAWING ***
    //
    const stopDrawing = (e) => {
        if (!isDrawingRef.current) return;

        if (tool === "pen") {
            if (currentStroke.current) { 
                setShapes(prev => [...prev, currentStroke.current]);
            }
        }

        if(tool === "eraser") {
            const eraser = currentStroke.current;
            if (eraser && eraser.points.length > 0) {
                setShapes(prev => prev.filter(shape => !doPointsIntersectShape(eraser.points, shape)));
            }
        }

        if (tool === "selectBox") {
            if (actionMode.current === "SELECT") {
                const { x: startX, y: startY } = startPos.current;
                const { x, y } = getCoords(e);
                const minX = Math.min(startX, x);
                const minY = Math.min(startY, y);
                const maxX = Math.max(startX, x);
                const maxY = Math.max(startY, y);

                const newSelected = shapes.filter(s => {
                    const bb = getBoundingBox(s);
                    if (!bb) return false;
                    // Check if center of shape bounding box is within selection box
                    const cx = (bb.minX + bb.maxX) / 2;
                    const cy = (bb.minY + bb.maxY) / 2;
                    return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
                }).map(s => s.id);

                if (newSelected.length > 0) setSelectedIds(newSelected);
            }
            actionMode.current = null;
        };

        if (tool === "rect") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            setShapes(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: "rect",
                    x: startX,
                    y: startY,
                    width: x - startX,
                    height: y - startY,
                    style: { ...currentStyle },
                },
            ]);
        };

        if (tool === "circle") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            const dx = x - startX;
            const dy = y - startY;
            setShapes(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: "circle",
                    x: startX,
                    y: startY,
                    // radius: Math.hypot(dx, dy),
                    radiusX: dx,
                    radiusY: dy,
                    style: { ...currentStyle },
                },
            ]);
        };

        if (tool === "line") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            setShapes(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: "line",
                    x1: startX,
                    y1: startY,
                    x2: x,
                    y2: y,
                    style: { ...currentStyle },
                },
            ]);
        };
        isDrawingRef.current = false;

        
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setShapes([]);
        console.log("clear", shapes)
    };

    return {
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas,
        getCoords,
        generateId,
    }
}