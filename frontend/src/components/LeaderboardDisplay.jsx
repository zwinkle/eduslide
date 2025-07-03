import React from 'react';

const LeaderboardDisplay = ({ leaderboardData }) => {
    if (!leaderboardData || leaderboardData.length === 0) {
        return <p className="text-center text-sm text-gray-500 dark:text-gray-400">No scores yet. Answer correctly to get on the board!</p>;
    }

    return (
        <div className="w-full">
            <ul className="space-y-2">
                {leaderboardData.map((item, index) => (
                    <li 
                        key={item.student_id || index} 
                        // PERBAIKAN: Tambahkan kelas untuk mode gelap
                        className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm"
                    >
                        <div className="flex items-center">
                            <span className="font-bold text-lg mr-3 text-gray-500 dark:text-gray-400">
                                {index + 1}
                            </span>
                            {/* PERBAIKAN: Tampilkan nama siswa */}
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {item.student_name}
                            </span>
                        </div>
                        {/* PERBAIKAN: Tampilkan skor dari field 'score' */}
                        <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                            {item.score}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LeaderboardDisplay;