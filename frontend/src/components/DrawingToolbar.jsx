import React from 'react';

const DrawingToolbar = ({ tool, setTool, onClear }) => {
    return (
        <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg flex flex-col gap-3">
            {/* Pilihan Alat: Pena, Highlighter, Penghapus */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Tool</h4>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setTool(prev => ({ ...prev, tool: 'pen' }))} 
                        className={`p-2 rounded-md ${tool.tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`} 
                        title="Pen"
                    >
                        🖊️
                    </button>
                    <button 
                        onClick={() => setTool(prev => ({ ...prev, tool: 'highlighter' }))} 
                        className={`p-2 rounded-md ${tool.tool === 'highlighter' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`} 
                        title="Highlighter"
                    >
                        🖍️
                    </button>
                    <button 
                        onClick={() => setTool(prev => ({ ...prev, tool: 'eraser' }))} 
                        className={`p-2 rounded-md ${tool.tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`} 
                        title="Eraser"
                    >
                        🧼
                    </button>
                </div>
            </div>

            {/* Pilihan Warna dengan Color Picker */}
            <div>
                <label htmlFor="color-picker" className="text-xs font-semibold text-gray-500 dark:text-gray-400">Color</label>
                <input
                    type="color"
                    id="color-picker"
                    value={tool.color}
                    onChange={(e) => setTool(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-8 p-0 border-none rounded-md cursor-pointer"
                />
            </div>

            {/* Slider Ukuran Kuas */}
            <div>
                <label htmlFor="stroke-width-slider" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Size ({tool.strokeWidth}px)
                </label>
                <input
                    type="range"
                    id="stroke-width-slider"
                    min="1"
                    max="30"
                    value={tool.strokeWidth}
                    onChange={(e) => setTool(prev => ({ ...prev, strokeWidth: parseInt(e.target.value, 10) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
            
            {/* Tombol Hapus Semua */}
            <button onClick={onClear} className="w-full mt-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900">
                Clear All
            </button>
        </div>
    );
};

export default DrawingToolbar;