// frontend/src/components/DrawingCanvas.jsx

import React, { useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';

const DrawingCanvas = ({ onDraw, lines, width, height, isReadOnly = false }) => {
    const isDrawing = useRef(false);

    const handleEvent = (e, eventType) => {
        if (isReadOnly) return;
        e.evt.preventDefault();
        const pos = e.target.getStage().getPointerPosition();
        if (width === 0 || height === 0) return;
        onDraw({ 
            type: eventType, 
            point: { x: pos.x / width, y: pos.y / height } 
        });
    };
    
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        handleEvent(e, 'start');
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        handleEvent(e, 'draw');
    };

    const handleMouseUp = (e) => {
        if (isDrawing.current) {
            isDrawing.current = false;
            handleEvent(e, 'end');
        }
    };

    const denormalizedLines = lines.map(line => {
        const points = [];
        for (let i = 0; i < line.points.length; i += 2) {
            points.push(line.points[i] * width, line.points[i + 1] * height);
        }
        const denormalizedStrokeWidth = line.strokeWidth * width;
        return { ...line, points, strokeWidth: denormalizedStrokeWidth };
    });

    return (
        <div className="w-full h-full">
            <Stage
                width={width}
                height={height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <Layer>
                    <Rect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        fill="rgba(255, 255, 255, 0)"
                    />
                    
                    {denormalizedLines.map((line, i) => (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={
                                line.tool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default DrawingCanvas;