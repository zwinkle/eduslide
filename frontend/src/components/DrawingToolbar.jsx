// frontend/src/components/DrawingToolbar.jsx

import React from 'react';

const colors = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#F97316'];
const strokeWidths = [2, 5, 10];

const DrawingToolbar = ({ tool, setTool, onClear }) => {
    return (
        <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg flex flex-col gap-4">
            <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Tool</h4>
                <div className="flex gap-2">
                    {/* Tombol Pena */}
                    <button onClick={() => setTool(prev => ({ ...prev, tool: 'pen' }))} className={`p-2 rounded-md ${tool.tool === 'pen' || !tool.tool ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`} title="Pen">
                        🖊️
                    </button>
                    {/* Tombol Penghapus */}
                    <button onClick={() => setTool(prev => ({ ...prev, tool: 'eraser' }))} className={`p-2 rounded-md ${tool.tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`} title="Eraser">
                        🧼
                    </button>
                    {/* BARU: Tombol Hapus Semua */}
                    <button onClick={onClear} className="p-2 rounded-md bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200" title="Clear Canvas">
                        🗑️
                    </button>
                </div>
            </div>
            
            {/* Pilihan Warna */}
            <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Color</h4>
                <div className="flex gap-2">
                    {colors.map(color => (
                        <button 
                            key={color}
                            onClick={() => setTool(prev => ({ ...prev, color }))}
                            className={`w-6 h-6 rounded-full border-2 ${tool.color === color ? 'border-blue-500' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* Pilihan Ukuran Kuas */}
            <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Brush Size</h4>
                <div className="flex gap-2">
                    {strokeWidths.map(size => (
                        <button
                            key={size}
                            onClick={() => setTool(prev => ({ ...prev, strokeWidth: size }))}
                            className={`flex items-center justify-center w-8 h-8 rounded-md ${tool.strokeWidth === size ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <div className="bg-black dark:bg-white rounded-full" style={{ width: size + 2, height: size + 2 }}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DrawingToolbar;