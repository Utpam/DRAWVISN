import { useRef, useEffect, useState } from 'react';
import {useCanvas} from '../hooks/useCanvas.js'
import { Toolbar } from './ToolBar.jsx';

function WhiteBoard() {
    const { canvasRef, tool, shapes, setShapes, setTool, startDrawing, draw, stopDrawing, clearCanvas, generateId, setTextInput, textInput, startPan, updatePan, stopPan, handleZoom, worldToScreen, camera } = useCanvas();
    const inputRef = useRef(null);

    // setTimeout to let the DOM to re-render before the inputRef is focus
    useEffect(() => {
        if (textInput && inputRef.current) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    // inputRef.current.select();
                }
            }, 10);
        }
    }, [textInput, shapes]);

    const saveText = () => {
        if (!textInput || !textInput.value.trim()) {
            setTextInput(null);
            return;
        }

        const newShape = {
            id: generateId(),
            type: "text",
            x: textInput.x,
            y: textInput.y, 
            text: textInput.value
        };
        
        setShapes(prev => [...prev, newShape]);
        setTextInput(null);
    };
    return (    
    <>
        <div className='flex justify-center'>
            <div className='w-full relative'>
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth - 10}
                    height={window.innerHeight - 10}
                    onMouseDown={(e) => {
                        if (e.button === 1) {
                            e.preventDefault();
                            startPan(e.clientX, e.clientY);
                            return;
                        }
                        startDrawing(e);
                    }}
                    onMouseMove={(e) => {
                        if (e.buttons === 4) {
                            updatePan(e.clientX, e.clientY);
                            return;
                        }
                        draw(e);
                    }}
                    onMouseUp={(e) => {
                        stopPan();
                        stopDrawing(e);
                    }}
                    onMouseLeave={(e) => {
                        stopPan();
                        stopDrawing(e);
                    }}
                    onWheel={handleZoom}
                    className='border-2 inset-0 block'
                />
                {
                    textInput && (
                        <form onSubmit={(e) => { e.preventDefault(); saveText(); }}>
                            <input 
                                ref={inputRef}
                                value={textInput.value}
                                onChange={(e) => setTextInput((prev) => ({ ...prev, value: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setTextInput(null);
                                }}
                                onBlur={saveText}
                                style={{ 
                                    top: worldToScreen(textInput.x, textInput.y).y, 
                                    left: worldToScreen(textInput.x, textInput.y).x,
                                    fontSize: `${16 * camera.zoom}px`,
                                    padding: 0,
                                    margin: 0,
                                    background: 'transparent'
                                }}
                                className="absolute text-white outline-none"
                            />
                        </form>
                    )
                }
            </div>
            <div className='absolute flex gap-4  font-bold font-[poppins-bold] p-4 rounded-lg m-2 bg-gray-700/50 w-[99%]'>
                <Toolbar setTool={setTool} tool={tool} />
                <button onClick={clearCanvas} className='bg-red-600 p-2 text-white rounded-md hover:bg-green-600'>CLEAR</button>
            </div>
        </div>
    </>
  )
}

export default WhiteBoard;