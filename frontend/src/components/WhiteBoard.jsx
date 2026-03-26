import { useRef, useEffect } from 'react';
import {useCanvas} from '../hooks/useCanvas.js'
import { Toolbar } from './ToolBar.jsx';

function WhiteBoard() {
    const { canvasRef, startDrawing, draw, stopDrawing, setTool,tool, clearCanvas,} = useCanvas();
    console.log(window)
    return (    
    <>
        <div className='flex'>
            <div className='w-full'>
                <canvas
                    ref={canvasRef}
                    width={window.innerWidth - 10}
                    height={window.innerHeight - 10}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className='border-2 inset-0 block'
                />
            </div>
            <div className='absolute flex gap-4  font-bold font-[poppins-bold] p-2 rounded-lg m-2 '>
                <Toolbar setTool={setTool} tool={tool} />
                <button onClick={clearCanvas} className='bg-red-600 p-2 text-white rounded-md hover:bg-green-600'>CLEAR</button>
            </div>
        </div>
    </>
  )
}

export default WhiteBoard;