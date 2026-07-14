export const pointToLineDistance = (point, lineStart, lineEnd) => {
    const lineLengthSquared = Math.pow(lineStart.x - lineEnd.x, 2) + Math.pow(lineStart.y - lineEnd.y, 2);
    if (lineLengthSquared === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    const dotProduct = ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + (point.y - lineStart.y) * (lineEnd.y - lineStart.y));
    let t = Math.max(0, Math.min(1, dotProduct / lineLengthSquared));
    const closest = {
        x: lineStart.x + t * (lineEnd.x - lineStart.x),
        y: lineStart.y + t * (lineEnd.y - lineStart.y)
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
                minX: shape.x - shape.radiusX,
                minY: shape.y - shape.radiusY,
                maxX: shape.x + shape.radiusX,
                maxY: shape.y + shape.radiusY,
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
            if (!shape.points || shape.points.length === 0) return null;
            let minX = shape.points[0].x, minY = shape.points[0].y, maxX = minX, maxY = minY;
            shape.points.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
            return { minX, minY, maxX, maxY };
        }
        case "text":
            const approxWidth = shape.text.length * 10;
            const approxHeight = 24; 
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + approxWidth,
                maxY: shape.y + approxHeight,
            };
        default:
            return null;
    }
};

export const doCoordsIntersectShape = (x, y, shape) => {
    const bb = getBoundingBox(shape);
    if (!bb) return false;
    
    const padding = 5;
    if (x >= bb.minX - padding && x <= bb.maxX + padding && y >= bb.minY - padding && y <= bb.maxY + padding) {
        if (shape.type === "circle") {
            const dist = Math.hypot(x - shape.x, y - shape.y);
            return dist <= shape.radiusX + shape.radiusY + padding;
        } else if (shape.type === "line") {
            const dist = pointToLineDistance({x, y}, {x: shape.x1, y: shape.y1}, {x: shape.x2, y: shape.y2});
            return dist <= 10;
        } else if (shape.type === "pen" || shape.type === "eraser") {
            for (const sp of shape.points) {
                if (Math.hypot(x - sp.x, y - sp.y) < 10) return true;
            }
            return false;
        }
        return true; 
    }
    return false;
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
            newShape.points = shape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
            break;
    }
    return newShape;
};

export const resizeShape = (shape, handlePos, dx, dy) => {
    const newShape = { ...shape };
    // very rudimentary resize based on bounding box change.
    // more complex resizing can be added per shape type, but for standard rectangles:
    if (shape.type === "rect") {
        if (handlePos.includes("nw")) {
            newShape.x += dx;
            newShape.y += dy;
            newShape.width -= dx;
            newShape.height -= dy;
        } else if (handlePos.includes("ne")) {
            newShape.y += dy;
            newShape.width += dx;
            newShape.height -= dy;
        } else if (handlePos.includes("sw")) {
            newShape.x += dx;
            newShape.width -= dx;
            newShape.height += dy;
        } else if (handlePos.includes("se")) {
            newShape.width += dx;
            newShape.height += dy;
        }
    } else if (shape.type === "circle") {
        // Just scale radius by the hypotenuse of dx,dy or distance
        const sign = (dx + dy > 0) ? 1 : -1;
        newShape.radius += sign * Math.hypot(dx, dy) * 0.5;
        if (newShape.radius < 5) newShape.radius = 5;
    } else if (shape.type === "line") {
        // Move ending points if resizing handle matches start or end
        if (handlePos === "start") {
            newShape.x1 += dx;
            newShape.y1 += dy;
        } else if (handlePos === "end") {
            newShape.x2 += dx;
            newShape.y2 += dy;
        }
    }
    // pen text and eraser omit resizing for simplicity for now
    return newShape;
};
