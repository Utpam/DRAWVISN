import { useCallback, useRef, useState } from "react";
import { DEFAULT_STYLE } from "../styles/defaultStyle";

export const useCanvasState = () => {
    const [shapes, setShapesState] = useState([]);
    const shapesRef = useRef(shapes);
    const historyRef = useRef([]);
    const undoGroupRef = useRef(false);
    const [historySize, setHistorySize] = useState(0);
    const [tool, setTool] = useState("pen");
    const [textInput, setTextInput] = useState(null);
    const [selectionBox, setSelctionBox] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [zoom, setZoom] = useState(1);

    /** The style applied to every NEW shape drawn from this point forward */
    const [currentStyle, setCurrentStyle] = useState({ ...DEFAULT_STYLE });

    const applyShapes = useCallback((nextShapes, shouldRecord) => {
        const currentShapes = shapesRef.current;
        const resolvedShapes = typeof nextShapes === "function"
            ? nextShapes(currentShapes)
            : nextShapes;
        if (resolvedShapes === currentShapes) return;

        if (shouldRecord && !undoGroupRef.current) {
            historyRef.current.push(currentShapes);
            if (historyRef.current.length > 50) historyRef.current.shift();
            setHistorySize(historyRef.current.length);
        }

        shapesRef.current = resolvedShapes;
        setShapesState(resolvedShapes);
    }, []);

    const setShapes = useCallback(
        (nextShapes) => applyShapes(nextShapes, true),
        [applyShapes]
    );

    const replaceShapes = useCallback(
        (nextShapes) => applyShapes(nextShapes, false),
        [applyShapes]
    );

    const beginUndoGroup = useCallback(() => {
        if (undoGroupRef.current) return;
        historyRef.current.push(shapesRef.current);
        if (historyRef.current.length > 50) historyRef.current.shift();
        setHistorySize(historyRef.current.length);
        undoGroupRef.current = true;
    }, []);

    const endUndoGroup = useCallback(() => {
        undoGroupRef.current = false;
    }, []);

    const undoShapes = useCallback(() => {
        const previousShapes = historyRef.current.pop();
        if (!previousShapes) return null;
        undoGroupRef.current = false;
        shapesRef.current = previousShapes;
        setShapesState(previousShapes);
        setHistorySize(historyRef.current.length);
        return previousShapes;
    }, []);

    /** Adds a remote or new shape, guarding against duplicate IDs */
    const addShape = (shape) => {
        if (!shape || !shape.id) return;
        replaceShapes((prev) => {
            if (prev.some((s) => s.id === shape.id)) return prev;
            return [...prev, shape];
        });
    };

    /** Updates remote or modified shapes by matching IDs */
    const updateShapes = (updatedShapesList) => {
        if (!updatedShapesList || !Array.isArray(updatedShapesList)) return;
        const updateMap = new Map(updatedShapesList.map((s) => [s.id, s]));
        replaceShapes((prev) =>
            prev.map((s) => (updateMap.has(s.id) ? updateMap.get(s.id) : s))
        );
    };

    /** Deletes shapes by IDs */
    const deleteShapes = (shapeIds) => {
        if (!shapeIds || !Array.isArray(shapeIds)) return;
        const deleteSet = new Set(shapeIds);
        replaceShapes((prev) => prev.filter((s) => !deleteSet.has(s.id)));
    };

    /** Clears all shapes */
    const clearAllShapes = () => {
        replaceShapes([]);
    };

    return {
        shapes,
        setShapes,
        replaceShapes,
        undoShapes,
        canUndo: historySize > 0,
        beginUndoGroup,
        endUndoGroup,
        addShape,
        updateShapes,
        deleteShapes,
        clearAllShapes,
        tool,
        setTool,
        textInput,
        setTextInput,
        selectionBox,
        setSelctionBox,
        selectedIds,
        setSelectedIds,
        zoom,
        setZoom,
        currentStyle,
        setCurrentStyle,
    };
};