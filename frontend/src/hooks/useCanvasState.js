import { useState } from "react";
import { DEFAULT_STYLE } from "../styles/defaultStyle";

export const useCanvasState = () => {
    const [shapes, setShapes] = useState([]);
    const [tool, setTool] = useState("pen");
    const [textInput, setTextInput] = useState(null);
    const [selectionBox, setSelctionBox] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [zoom, setZoom] = useState(1);

    /** The style applied to every NEW shape drawn from this point forward */
    const [currentStyle, setCurrentStyle] = useState({ ...DEFAULT_STYLE });

    /** Adds a remote or new shape, guarding against duplicate IDs */
    const addShape = (shape) => {
        if (!shape || !shape.id) return;
        setShapes((prev) => {
            if (prev.some((s) => s.id === shape.id)) return prev;
            return [...prev, shape];
        });
    };

    /** Updates remote or modified shapes by matching IDs */
    const updateShapes = (updatedShapesList) => {
        if (!updatedShapesList || !Array.isArray(updatedShapesList)) return;
        const updateMap = new Map(updatedShapesList.map((s) => [s.id, s]));
        setShapes((prev) =>
            prev.map((s) => (updateMap.has(s.id) ? updateMap.get(s.id) : s))
        );
    };

    /** Deletes shapes by IDs */
    const deleteShapes = (shapeIds) => {
        if (!shapeIds || !Array.isArray(shapeIds)) return;
        const deleteSet = new Set(shapeIds);
        setShapes((prev) => prev.filter((s) => !deleteSet.has(s.id)));
    };

    /** Clears all shapes */
    const clearAllShapes = () => {
        setShapes([]);
    };

    return {
        shapes,
        setShapes,
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