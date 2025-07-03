import React, { useState, useMemo } from 'react';
import { Stage, Layer, Circle, Text, Group } from 'react-konva';
import Modal from './Modal';

const BubbleQuizDisplay = ({ clicks, correctAreas, width, height }) => {
    const [viewingNames, setViewingNames] = useState(null);

    // useMemo untuk menghitung data gelembung secara efisien
    const aggregatedData = useMemo(() => {
        if (!correctAreas || correctAreas.length === 0 || !clicks) return [];

        return correctAreas.map(area => {
            const clicksInArea = clicks.filter(click => {
                if (typeof click?.x !== 'number' || typeof click?.y !== 'number') {
                    return false;
                }
                const distance = Math.sqrt(Math.pow(click.x - area.x, 2) + Math.pow(click.y - area.y, 2));
                return distance <= area.r;
            });
            return {
                ...area,
                count: clicksInArea.length,
                names: clicksInArea.map(c => c.name)
            };
        });
    }, [clicks, correctAreas]);

    return (
        <>
            <Stage width={width} height={height}>
                <Layer>
                    {/* Menampilkan semua titik klik dari siswa */}
                    {clicks.map((click, index) => {
                         if (typeof click?.x !== 'number' || typeof click?.y !== 'number') return null;
                         return (
                            <Circle
                                key={`click-${index}`}
                                x={click.x * width}
                                y={click.y * height}
                                radius={4}
                                fill={click.is_correct ? '#22C55E' : '#EF4444'}
                                opacity={0.9}
                                shadowColor="black"
                                shadowBlur={5}
                            />
                        );
                    })}
                    
                    {/* Menampilkan gelembung hasil agregat */}
                    {aggregatedData.map((bubble, index) => (
                        <Group
                            key={`bubble-${index}`}
                            x={bubble.x * width}
                            y={bubble.y * height}
                            // PERBAIKAN KUNCI DI SINI:
                            onClick={() => setViewingNames(bubble)}
                            onTap={() => setViewingNames(bubble)}
                            onMouseEnter={e => {
                                // Mengubah kursor menjadi pointer saat mouse di atas gelembung
                                const container = e.target.getStage().container();
                                container.style.cursor = 'pointer';
                            }}
                            onMouseLeave={e => {
                                // Mengembalikan kursor ke default saat mouse keluar
                                const container = e.target.getStage().container();
                                container.style.cursor = 'default';
                            }}
                        >
                            <Circle
                                radius={bubble.r * width}
                                fill="#3B82F6"
                                opacity={0.6}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                            />
                            <Text
                                text={String(bubble.count)}
                                fontSize={bubble.r * width * 0.7}
                                fill="white"
                                fontStyle="bold"
                                align="center"
                                verticalAlign="middle"
                                offsetX={(bubble.r * width * 0.7) / 4 * String(bubble.count).length}
                                offsetY={(bubble.r * width * 0.7) / 2}
                                listening={false} // Teks tidak perlu menangkap event
                            />
                        </Group>
                    ))}
                </Layer>
            </Stage>
            
            {/* Modal untuk menampilkan nama siswa */}
            <Modal isOpen={!!viewingNames} onClose={() => setViewingNames(null)} title={`Answers in this Area (${viewingNames?.count || 0})`}>
                {viewingNames?.names.length > 0 ? (
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