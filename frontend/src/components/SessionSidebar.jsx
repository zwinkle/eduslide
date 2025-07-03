import React, { useState, useEffect } from 'react';
import LeaderboardDisplay from './LeaderboardDisplay';
import PollResultsChart from './PollResultsChart';
import WordCloudDisplay from './WordCloudDisplay';

const SessionSidebar = ({ 
    participants, 
    leaderboardData, 
    showParticipantsTab = true,
    // BARU: Terima semua data dan status aktivitas
    activeActivityType, 
    pollResults,
    wordCloudResults
}) => {
    const [isOpen, setIsOpen] = useState(false);
    // Jika ada aktivitas, otomatis buka tab 'Activity'
    const [activeTab, setActiveTab] = useState('leaderboard');

    const handleToggle = () => setIsOpen(!isOpen);

    const handleTabClick = (tabName) => {
        if (!isOpen) setIsOpen(true);
        setActiveTab(tabName);
    };

    // Tentukan apakah tab "Activity" harus ditampilkan
    const showActivityTab = activeActivityType === 'poll' || activeActivityType === 'word_cloud' || activeActivityType === 'quiz';

    // PERBAIKAN: Saat aktivitas baru dimulai, otomatis pindah ke tab "Activity"
    useEffect(() => {
        if (showActivityTab) {
            setActiveTab('activity');
            setIsOpen(true); // Otomatis buka sidebar saat aktivitas dimulai
        }
    }, [activeActivityType]);


    const handleClasses = isOpen ? 'right-80' : 'right-0';
    const panelClasses = isOpen ? 'translate-x-0' : 'translate-x-full';

    return (
        <>
            <button 
                onClick={handleToggle}
                className={`fixed top-1/2 -translate-y-1/2 ${handleClasses} bg-white dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-l-lg shadow-lg transition-all duration-300 ease-in-out z-50`}
                title="Toggle Sidebar"
            >
                🏆
            </button>

            <aside 
                className={`fixed top-0 right-0 h-full w-80 bg-gray-100 dark:bg-gray-800 shadow-2xl transform ${panelClasses} transition-transform duration-300 ease-in-out z-40 flex flex-col text-gray-800 dark:text-white`}
            >
                <div className="flex border-b border-gray-300 dark:border-gray-700">
                    {/* Tampilkan tab Activity hanya jika relevan */}
                    {showActivityTab && (
                        <button onClick={() => handleTabClick('activity')} className={`flex-1 p-3 font-semibold transition-colors ${activeTab === 'activity' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            Activity
                        </button>
                    )}
                    <button onClick={() => handleTabClick('leaderboard')} className={`flex-1 p-3 font-semibold transition-colors ${activeTab === 'leaderboard' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        Leaderboard
                    </button>
                    {showParticipantsTab && (
                        <button onClick={() => handleTabClick('participants')} className={`flex-1 p-3 font-semibold transition-colors ${activeTab === 'participants' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            Participants ({participants.length})
                        </button>
                    )}
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {/* BARU: Konten untuk tab aktivitas */}
                    {activeTab === 'activity' && showActivityTab && (
                        <div>
                            <h3 className="text-xl font-bold mb-4 capitalize">{activeActivityType.replace('_', ' ')} Results</h3>
                            {activeActivityType === 'poll' && (pollResults ? <PollResultsChart results={pollResults} /> : <p className="text-sm text-gray-500">Waiting for first vote...</p>)}
                            {activeActivityType === 'word_cloud' && (wordCloudResults ? <WordCloudDisplay results={wordCloudResults} /> : <p className="text-sm text-gray-500">Waiting for submissions...</p>)}
                            {activeActivityType === 'quiz' && <p className="text-sm text-center text-gray-600 dark:text-gray-400">Quiz is live! See standings in the Leaderboard tab.</p>}
                        </div>
                    )}
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