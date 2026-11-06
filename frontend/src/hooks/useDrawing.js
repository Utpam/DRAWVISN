import { useRef } from "react";
import {
    doCoordsIntersectShape,
    getBoundingBox,
    getResizeHandle,
    getResizedBounds,
    getSelectionBounds,
    moveShape,
    resizeShape,
} from "./useTransform.js";
import { resolveThemeStrokeColor } from "../utils/themeStroke.js";

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

const hasShapeGeometryChanged = (shape, original) => {
    if (
        shape.x !== original.x || shape.y !== original.y ||
        shape.width !== original.width || shape.height !== original.height ||
        shape.radiusX !== original.radiusX || shape.radiusY !== original.radiusY ||
        shape.x1 !== original.x1 || shape.y1 !== original.y1 ||
        shape.x2 !== original.x2 || shape.y2 !== original.y2 ||
        shape.fontSize !== original.fontSize
    ) return true;

    return shape.points?.some((point, index) =>
        point.x !== original.points?.[index]?.x ||
        point.y !== original.points?.[index]?.y
    ) ?? false;
};

export const useDrawing = (canvasRef, { shapes, setShapes, tool, setTextInput, selectedIds, setSelectedIds, currentStyle, beginUndoGroup, endUndoGroup }, camera, renderers, options = {}) => {
    const currentStroke = useRef(null);
    const isDrawingRef = useRef(false);
    const transformRef = useRef([]);
    const activeIdsRef = useRef([]);
    const initialSelectionBoundsRef = useRef(null);
    const resizeHandleRef = useRef(null);
    const transformedShapesRef = useRef([]);
    const transformChangedRef = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });  // reference for shapes
    const actionMode = useRef(null);
    const generateId = () => crypto.randomUUID();
    const getShapeOwner = () => ({
        owner: options.ownerId || "anon",
        createdBy: options.ownerId || "anon",
        creatorName: options.creatorName || "Collaborator",
    });

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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    const { x, y } = getCoords(e);

    if (tool === "selectBox") {
        startPos.current = { x, y };
        transformChangedRef.current = false;
        const selectedShapes = shapes.filter((shape) => selectedIds.includes(shape.id));
        const selectionBounds = getSelectionBounds(selectedShapes);
        const handle = getResizeHandle(
            x,
            y,
            selectionBounds,
            10 / (camera.camera.zoom || 1)
        );

        if (handle) {
            activeIdsRef.current = selectedShapes.map((shape) => shape.id);
            transformRef.current = selectedShapes;
            transformedShapesRef.current = selectedShapes;
            initialSelectionBoundsRef.current = selectionBounds;
            resizeHandleRef.current = handle;
            actionMode.current = "RESIZE";
            isDrawingRef.current = true;
            return;
        }

        const clickedShape = [...shapes].reverse().find(s => doCoordsIntersectShape(x, y, s));
        if (clickedShape) {
            const nextIds = selectedIds.includes(clickedShape.id)
                ? selectedIds
                : [clickedShape.id];
            if (nextIds !== selectedIds) {
                setSelectedIds(nextIds);
                options?.onSelectionUpdate?.(nextIds);
            }
            activeIdsRef.current = nextIds;
            transformRef.current = shapes.filter((shape) => nextIds.includes(shape.id));
            transformedShapesRef.current = transformRef.current;
            actionMode.current = "MOVE";
        } else {
            setSelectedIds([]);
            options?.onSelectionUpdate?.([]);
            activeIdsRef.current = [];
            transformRef.current = [];
            transformedShapesRef.current = [];
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
        ...getShapeOwner(),
      };

      if (options?.onStrokeStart) {
        options.onStrokeStart(currentStroke.current);
      }

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
            if (actionMode.current === "MOVE" || actionMode.current === "RESIZE") {
                const initialBounds = initialSelectionBoundsRef.current;
                let transformed;
                if (actionMode.current === "MOVE") {
                    const dx = x - startPos.current.x;
                    const dy = y - startPos.current.y;
                    transformed = transformRef.current.map((shape) => moveShape(shape, dx, dy));
                } else if (initialBounds && resizeHandleRef.current) {
                    const targetBounds = getResizedBounds(
                        initialBounds,
                        resizeHandleRef.current,
                        { x, y },
                        4 / (camera.camera.zoom || 1)
                    );
                    transformed = transformRef.current.map((shape) =>
                        resizeShape(shape, initialBounds, targetBounds)
                    );
                }

                if (transformed) {
                    const hasChanged = transformed.some((shape, index) =>
                        hasShapeGeometryChanged(shape, transformRef.current[index])
                    );
                    if (hasChanged) {
                        beginUndoGroup?.();
                        transformChangedRef.current = true;
                    }
                    transformedShapesRef.current = transformed;
                    const transformedById = new Map(transformed.map((shape) => [shape.id, shape]));
                    setShapes((previous) =>
                        previous.map((shape) => transformedById.get(shape.id) ?? shape)
                    );
                }
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

            const previewById = new Map(
                transformedShapesRef.current.map((shape) => [shape.id, shape])
            );
            const previewShapes = shapes.map((shape) => previewById.get(shape.id) ?? shape);
            previewShapes.forEach(shape => {
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
            ctx.strokeStyle  = resolveThemeStrokeColor(
                currentStyle?.strokeColor ?? "#ffffff",
                options.isDark ?? true
            );
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
            if (options?.onStrokeUpdate && currentStroke.current) {
                options.onStrokeUpdate(currentStroke.current.id, [{ x, y }]);
            }
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
            if (currentStroke.current && currentStroke.current.points && currentStroke.current.points.length > 0) {
                const newShape = {
                    ...currentStroke.current,
                    style: { ...currentStyle },
                    ...getShapeOwner(),
                };
                setShapes(prev => [...prev, newShape]);
                if (options?.onStrokeEnd) {
                    options.onStrokeEnd(currentStroke.current.id, newShape);
                } else if (options?.onShapeCreated) {
                    options.onShapeCreated(newShape);
                }
            }
        }

        if(tool === "eraser") {
            const eraser = currentStroke.current;
            if (eraser && eraser.points && eraser.points.length > 0) {
                const deletedIds = [];
                setShapes(prev => {
                    const remaining = [];
                    for (const shape of prev) {
                        if (doPointsIntersectShape(eraser.points, shape)) {
                            deletedIds.push(shape.id);
                        } else {
                            remaining.push(shape);
                        }
                    }
                    return remaining;
                });
                if (deletedIds.length > 0 && options?.onShapesDeleted) {
                    options.onShapesDeleted(deletedIds);
                }
            }
        }

        if (tool === "selectBox") {
            if (actionMode.current === "MOVE" || actionMode.current === "RESIZE") {
                const changedShapes = transformedShapesRef.current.filter((shape) =>
                    activeIdsRef.current.includes(shape.id)
                );
                if (transformChangedRef.current && changedShapes.length > 0) {
                    options?.onShapesUpdated?.(changedShapes);
                }
            } else if (actionMode.current === "SELECT") {
                const { x: startX, y: startY } = startPos.current;
                const { x, y } = getCoords(e);
                const minX = Math.min(startX, x);
                const minY = Math.min(startY, y);
                const maxX = Math.max(startX, x);
                const maxY = Math.max(startY, y);

                const newSelected = shapes.filter((shape) => {
                    const bb = getBoundingBox(shape);
                    if (!bb) return false;
                    return bb.maxX >= minX && bb.minX <= maxX &&
                        bb.maxY >= minY && bb.minY <= maxY;
                }).map(s => s.id);

                if (newSelected.length > 0) {
                    setSelectedIds(newSelected);
                    if (options?.onSelectionUpdate) options.onSelectionUpdate(newSelected);
                } else if (selectedIds?.length > 0) {
                    setSelectedIds([]);
                    if (options?.onSelectionUpdate) options.onSelectionUpdate([]);
                }
            }
            actionMode.current = null;
            transformRef.current = [];
            transformedShapesRef.current = [];
            activeIdsRef.current = [];
            initialSelectionBoundsRef.current = null;
            resizeHandleRef.current = null;
            transformChangedRef.current = false;
        };

        if (tool === "rect") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            const newShape = {
                id: generateId(),
                type: "rect",
                x: startX,
                y: startY,
                width: x - startX,
                height: y - startY,
                style: { ...currentStyle },
                ...getShapeOwner(),
            };

            setShapes(prev => [
                ...prev,
                newShape,
            ]);

            if (options?.onShapeCreated) {
                options.onShapeCreated(newShape);
            }
        };

        if (tool === "circle") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            const dx = x - startX;
            const dy = y - startY;
            const newShape = {
                id: generateId(),
                type: "circle",
                x: startX,
                y: startY,
                radiusX: dx,
                radiusY: dy,
                style: { ...currentStyle },
                ...getShapeOwner(),
            };
            setShapes(prev => [
                ...prev,
                newShape,
            ]);
            if (options?.onShapeCreated) {
                options.onShapeCreated(newShape);
            }
        };

        if (tool === "line") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            const newShape = {
                id: generateId(),
                type: "line",
                x1: startX,
                y1: startY,
                x2: x,
                y2: y,
                style: { ...currentStyle },
                ...getShapeOwner(),
            };
            setShapes(prev => [
                ...prev,
                newShape,
            ]);
            if (options?.onShapeCreated) {
                options.onShapeCreated(newShape);
            }
        };
        endUndoGroup?.();
        isDrawingRef.current = false;
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setShapes([]);
        if (options?.onCanvasCleared) {
            options.onCanvasCleared();
        }
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