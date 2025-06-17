// frontend/src/components/LeaderboardDisplay.jsx

import React from 'react';

const LeaderboardDisplay = ({ leaderboardData }) => {
    if (!leaderboardData || leaderboardData.length === 0) {
        return <p className="text-sm text-gray-500 text-center mt-4">No scores yet. First correct answer gets points!</p>;
    }

    const medal_colors = ['text-yellow-400', 'text-gray-400', 'text-yellow-600'];

    return (
        <div className="space-y-2 mt-2">
            {leaderboardData.map((player, index) => (
                <div key={player.student_name + index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                    <div className="flex items-center">
                        <span className={`w-6 text-center font-bold ${medal_colors[index] || 'text-gray-600'}`}>
                            {index < 3 ? '🏆' : `${index + 1}.`}
                        </span>
                        <span className="ml-2">{player.student_name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{player.score} pts</span>
                </div>
            ))}
        </div>
    );
};

export default LeaderboardDisplay;