// frontend/src/components/SessionSidebar.jsx

import React, { useState } from 'react';
import LeaderboardDisplay from './LeaderboardDisplay';

// Tambahkan prop 'showParticipantsTab' dengan nilai default true
const SessionSidebar = ({ participants, leaderboardData, showParticipantsTab = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Jika tab participants disembunyikan, default ke leaderboard
    const [activeTab, setActiveTab] = useState('leaderboard');

    const handleToggle = () => setIsOpen(!isOpen);

    const handleTabClick = (tabName) => {
        // Otomatis buka sidebar jika tab diklik saat tertutup
        if (!isOpen) {
            setIsOpen(true);
        }
        setActiveTab(tabName);
    };

    const handleClasses = isOpen ? 'right-80' : 'right-0';
    const panelClasses = isOpen ? 'translate-x-0' : 'translate-x-full';

    return (
        <>
            {/* Tombol Handle untuk Buka/Tutup */}
            <button 
                onClick={handleToggle}
                className={`fixed top-1/2 -translate-y-1/2 ${handleClasses} bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-l-lg shadow-lg transition-all duration-300 ease-in-out z-50`}
                title="Toggle Sidebar"
            >
                {/* Ikonnya kita ubah sedikit */}
                🏆
            </button>

            {/* Panel Sidebar dengan warna yang bisa beradaptasi */}
            <aside 
                className={`fixed top-0 right-0 h-full w-80 bg-gray-100 dark:bg-gray-800 shadow-2xl transform ${panelClasses} transition-transform duration-300 ease-in-out z-40 flex flex-col text-gray-800 dark:text-white`}
            >
                {/* Tab Buttons */}
                <div className="flex border-b border-gray-300 dark:border-gray-700">
                    <button 
                        onClick={() => handleTabClick('leaderboard')}
                        className={`flex-1 p-3 font-semibold transition-colors ${activeTab === 'leaderboard' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                    >
                        Leaderboard
                    </button>
                    {/* Tampilkan tab participants hanya jika diizinkan */}
                    {showParticipantsTab && (
                        <button 
                            onClick={() => handleTabClick('participants')}
                            className={`flex-1 p-3 font-semibold transition-colors ${activeTab === 'participants' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                            Participants ({participants.length})
                        </button>
                    )}
                </div>
                
                {/* Konten Tab */}
                <div className="flex-grow p-4 overflow-y-auto">
                    {activeTab === 'leaderboard' && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Top Scores</h3>
                            <LeaderboardDisplay leaderboardData={leaderboardData} />
                        </div>
                    )}
                    {activeTab === 'participants' && showParticipantsTab && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Participants</h3>
                            <ul className="space-y-2">
                                {participants.map((name, index) => (
                                    <li key={index} className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">{name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default SessionSidebar;