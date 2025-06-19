// frontend/src/components/BubbleQuizDisplay.jsx

import React, { useState } from 'react';
import { Stage, Layer, Circle, Text, Group } from 'react-konva';
import Modal from './Modal';

const BubbleQuizDisplay = ({ clicks = [], correctAreas = [], width, height }) => {
    const [viewingNames, setViewingNames] = useState(null);

    // Jika ukuran belum tersedia, jangan render apapun
    if (!width || !height || width === 0 || height === 0) {
        return null;
    }

    let aggregatedData = [];
    try {
        aggregatedData = (correctAreas || []).map(area => {
            const areaX = typeof area.x === 'number' ? area.x : 0;
            const areaY = typeof area.y === 'number' ? area.y : 0;
            const areaRadius = typeof area.radius === 'number' ? area.radius : 0.1;
            const areaCenterX = areaX * width;
            const areaCenterY = areaY * height;
            const displayRadius = areaRadius * Math.min(width, height);

            const clicksInArea = (clicks || []).filter(click => {
                if (!click || !click.point || typeof click.point.x !== 'number' || typeof click.point.y !== 'number') {
                    console.error('Malformed click:', click);
                    return false;
                }
                const clickX = click.point.x * width;
                const clickY = click.point.y * height;
                const distance = Math.sqrt(
                    Math.pow(clickX - areaCenterX, 2) + 
                    Math.pow(clickY - areaCenterY, 2)
                );
                return distance <= displayRadius;
            });

            return {
                ...area,
                count: clicksInArea.length,
                names: clicksInArea.map(c => c.name),
                displayX: areaCenterX,
                displayY: areaCenterY,
                displayRadius: displayRadius
            };
        });
    } catch (e) {
        console.error('Error in BubbleQuizDisplay aggregation:', e);
        aggregatedData = [];
    }

    const handleBubbleClick = (data) => {
        setViewingNames(data);
    };

    return (
        <>
            <Stage width={width} height={height}>
                <Layer>
                    {/* Tampilkan semua titik klik dari siswa */}
                    {(clicks || []).map((click, index) => {
                        if (!click || !click.point || typeof click.point.x !== 'number' || typeof click.point.y !== 'number') {
                            console.error('Malformed click:', click);
                            return null;
                        }
                        const clickX = click.point.x * width;
                        const clickY = click.point.y * height;
                        return (
                            <Circle
                                key={`click-${index}`}
                                x={clickX}
                                y={clickY}
                                radius={4}
                                fill={click.is_correct ? '#22C55E' : '#EF4444'}
                                opacity={0.9}
                                shadowColor="black"
                                shadowBlur={5}
                                shadowOpacity={0.6}
                            />
                        );
                    })}

                    {/* Tampilkan gelembung hasil agregat */}
                    {aggregatedData.map((bubble, index) => (
                        <Group
                            key={`bubble-${index}`}
                            x={typeof bubble.displayX === 'number' ? bubble.displayX : 0}
                            y={typeof bubble.displayY === 'number' ? bubble.displayY : 0}
                            onClick={() => handleBubbleClick(bubble)}
                        >
                            <Circle
                                radius={typeof bubble.displayRadius === 'number' && !isNaN(bubble.displayRadius) ? bubble.displayRadius : 1}
                                fill="#3B82F6"
                                opacity={0.5}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                            />
                            <Text
                                text={String(bubble.count)}
                                fontSize={Math.max(4, typeof bubble.displayRadius === 'number' && !isNaN(bubble.displayRadius) ? bubble.displayRadius * 0.7 : 10)}
                                fill="white"
                                fontStyle="bold"
                                align="center"
                                offsetX={((typeof bubble.displayRadius === 'number' && !isNaN(bubble.displayRadius)) ? (bubble.displayRadius * 0.7) / 4 * String(bubble.count).length : 0)}
                                offsetY={((typeof bubble.displayRadius === 'number' && !isNaN(bubble.displayRadius)) ? (bubble.displayRadius * 0.7) / 2 : 0)}
                                listening={false}
                            />
                        </Group>
                    ))}
                </Layer>
            </Stage>

            <Modal isOpen={!!viewingNames} onClose={() => setViewingNames(null)} title={`Answers in this Area (${viewingNames?.count || 0})`}>
                {viewingNames?.names?.length > 0 ? (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {viewingNames.names.map((name, i) => (
                            <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">{name}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">No one has answered in this area yet.</p>
                )}
            </Modal>
        </>
    );
};

export default BubbleQuizDisplay;