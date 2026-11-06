export const pointToLineDistance = (point, lineStart, lineEnd) => {
    const lineLengthSquared =
        (lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2;
    if (lineLengthSquared === 0) {
        return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    }

    const projection = Math.max(0, Math.min(1, (
        (point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
        (point.y - lineStart.y) * (lineEnd.y - lineStart.y)
    ) / lineLengthSquared));
    const closest = {
        x: lineStart.x + projection * (lineEnd.x - lineStart.x),
        y: lineStart.y + projection * (lineEnd.y - lineStart.y),
    };
    return Math.hypot(point.x - closest.x, point.y - closest.y);
};

export const getBoundingBox = (shape) => {
    switch (shape.type) {
        case "rect":
            return {
                minX: Math.min(shape.x, shape.x + shape.width),
                minY: Math.min(shape.y, shape.y + shape.height),
                maxX: Math.max(shape.x, shape.x + shape.width),
                maxY: Math.max(shape.y, shape.y + shape.height),
            };
        case "circle":
            return {
                minX: shape.x - Math.abs(shape.radiusX),
                minY: shape.y - Math.abs(shape.radiusY),
                maxX: shape.x + Math.abs(shape.radiusX),
                maxY: shape.y + Math.abs(shape.radiusY),
            };
        case "line":
            return {
                minX: Math.min(shape.x1, shape.x2),
                minY: Math.min(shape.y1, shape.y2),
                maxX: Math.max(shape.x1, shape.x2),
                maxY: Math.max(shape.y1, shape.y2),
            };
        case "pen":
        case "eraser": {
            if (!shape.points?.length) return null;
            return shape.points.reduce((bounds, point) => ({
                minX: Math.min(bounds.minX, point.x),
                minY: Math.min(bounds.minY, point.y),
                maxX: Math.max(bounds.maxX, point.x),
                maxY: Math.max(bounds.maxY, point.y),
            }), {
                minX: shape.points[0].x,
                minY: shape.points[0].y,
                maxX: shape.points[0].x,
                maxY: shape.points[0].y,
            });
        }
        case "text": {
            const fontSize = Number.isFinite(shape.fontSize) ? shape.fontSize : 16;
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + Math.max(fontSize, String(shape.text ?? "").length * fontSize * 0.6),
                maxY: shape.y + fontSize * 1.25,
            };
        }
        default:
            return null;
    }
};

export const getSelectionBounds = (shapes) => {
    const boxes = shapes.map(getBoundingBox).filter(Boolean);
    if (!boxes.length) return null;
    return boxes.reduce((bounds, box) => ({
        minX: Math.min(bounds.minX, box.minX),
        minY: Math.min(bounds.minY, box.minY),
        maxX: Math.max(bounds.maxX, box.maxX),
        maxY: Math.max(bounds.maxY, box.maxY),
    }), { ...boxes[0] });
};

export const getResizeHandle = (x, y, bounds, tolerance) => {
    if (!bounds) return null;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const handles = [
        ["nw", bounds.minX, bounds.minY],
        ["n", centerX, bounds.minY],
        ["ne", bounds.maxX, bounds.minY],
        ["e", bounds.maxX, centerY],
        ["se", bounds.maxX, bounds.maxY],
        ["s", centerX, bounds.maxY],
        ["sw", bounds.minX, bounds.maxY],
        ["w", bounds.minX, centerY],
    ];

    return handles
        .map(([name, handleX, handleY]) => ({
            name,
            distance: Math.hypot(x - handleX, y - handleY),
        }))
        .filter((handle) => handle.distance <= tolerance)
        .sort((a, b) => a.distance - b.distance)[0]?.name ?? null;
};

export const getResizedBounds = (bounds, handle, point, minimumSize = 4) => {
    let left = bounds.minX;
    let right = bounds.maxX;
    let top = bounds.minY;
    let bottom = bounds.maxY;
    const movesWest = handle.includes("w");
    const movesEast = handle.includes("e");
    const movesNorth = handle.includes("n");
    const movesSouth = handle.includes("s");

    if (movesWest) left = point.x;
    if (movesEast) right = point.x;
    if (movesNorth) top = point.y;
    if (movesSouth) bottom = point.y;

    if (Math.abs(right - left) < minimumSize) {
        if (movesWest) left = right - minimumSize;
        else if (movesEast) right = left + minimumSize;
    }
    if (Math.abs(bottom - top) < minimumSize) {
        if (movesNorth) top = bottom - minimumSize;
        else if (movesSouth) bottom = top + minimumSize;
    }

    return {
        minX: Math.min(left, right),
        minY: Math.min(top, bottom),
        maxX: Math.max(left, right),
        maxY: Math.max(top, bottom),
    };
};

export const doCoordsIntersectShape = (x, y, shape) => {
    const bounds = getBoundingBox(shape);
    if (!bounds) return false;
    const padding = 6;
    if (
        x < bounds.minX - padding || x > bounds.maxX + padding ||
        y < bounds.minY - padding || y > bounds.maxY + padding
    ) return false;

    if (shape.type === "circle") {
        const radiusX = Math.abs(shape.radiusX);
        const radiusY = Math.abs(shape.radiusY);
        if (!radiusX || !radiusY) return Math.hypot(x - shape.x, y - shape.y) <= padding;
        return ((x - shape.x) / radiusX) ** 2 + ((y - shape.y) / radiusY) ** 2 <= 1;
    }
    if (shape.type === "line") {
        return pointToLineDistance(
            { x, y },
            { x: shape.x1, y: shape.y1 },
            { x: shape.x2, y: shape.y2 }
        ) <= padding;
    }
    if (shape.type === "pen" || shape.type === "eraser") {
        const points = shape.points ?? [];
        const tolerance = Math.max(padding, (shape.style?.strokeWidth ?? 1) / 2 + 3);
        if (points.length === 1) {
            return Math.hypot(x - points[0].x, y - points[0].y) <= tolerance;
        }
        return points.slice(1).some((point, index) =>
            pointToLineDistance({ x, y }, points[index], point) <= tolerance
        );
    }
    return true;
};

export const moveShape = (shape, dx, dy) => {
    const newShape = { ...shape };
    switch (shape.type) {
        case "rect":
        case "circle":
        case "text":
            newShape.x += dx;
            newShape.y += dy;
            break;
        case "line":
            newShape.x1 += dx;
            newShape.y1 += dy;
            newShape.x2 += dx;
            newShape.y2 += dy;
            break;
        case "pen":
        case "eraser":
            newShape.points = shape.points.map((point) => ({
                ...point,
                x: point.x + dx,
                y: point.y + dy,
            }));
            break;
    }
    return newShape;
};

export const resizeShape = (shape, sourceBounds, targetBounds) => {
    const sourceWidth = sourceBounds.maxX - sourceBounds.minX;
    const sourceHeight = sourceBounds.maxY - sourceBounds.minY;
    const scaleX = sourceWidth ? (targetBounds.maxX - targetBounds.minX) / sourceWidth : 1;
    const scaleY = sourceHeight ? (targetBounds.maxY - targetBounds.minY) / sourceHeight : 1;
    const mapX = (x) => targetBounds.minX + (x - sourceBounds.minX) * scaleX;
    const mapY = (y) => targetBounds.minY + (y - sourceBounds.minY) * scaleY;
    const resized = { ...shape };

    switch (shape.type) {
        case "rect": {
            const x1 = mapX(shape.x);
            const x2 = mapX(shape.x + shape.width);
            const y1 = mapY(shape.y);
            const y2 = mapY(shape.y + shape.height);
            resized.x = Math.min(x1, x2);
            resized.y = Math.min(y1, y2);
            resized.width = Math.abs(x2 - x1);
            resized.height = Math.abs(y2 - y1);
            break;
        }
        case "circle":
            resized.x = mapX(shape.x);
            resized.y = mapY(shape.y);
            resized.radiusX = Math.abs(shape.radiusX * scaleX);
            resized.radiusY = Math.abs(shape.radiusY * scaleY);
            break;
        case "line":
            resized.x1 = mapX(shape.x1);
            resized.y1 = mapY(shape.y1);
            resized.x2 = mapX(shape.x2);
            resized.y2 = mapY(shape.y2);
            break;
        case "pen":
        case "eraser":
            resized.points = shape.points.map((point) => ({
                ...point,
                x: mapX(point.x),
                y: mapY(point.y),
            }));
            break;
        case "text":
            resized.x = mapX(shape.x);
            resized.y = mapY(shape.y);
            resized.fontSize = Math.max(
                4,
                (Number.isFinite(shape.fontSize) ? shape.fontSize : 16) *
                    Math.sqrt(Math.abs(scaleX * scaleY))
            );
            break;
    }
    return resized;
};
