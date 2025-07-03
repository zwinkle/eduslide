import React, { useState, useEffect } from 'react';

const RandomPickerOverlay = ({ data, onAnimationEnd }) => {
    if (!data || !data.winner || !data.participants || data.participants.length === 0) {
        useEffect(() => { onAnimationEnd(); }, [onAnimationEnd]);
        return null;
    }

    const { winner, participants } = data;
    const [displayName, setDisplayName] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let timeoutId;
        const totalDuration = 4000;
        let interval = 50;
        let elapsedTime = 0;

        const runAnimation = () => {
            const randomIndex = Math.floor(Math.random() * participants.length);
            const randomParticipant = participants[randomIndex];
            // PERBAIKAN: Pastikan kita hanya menyimpan dan menampilkan nama
            setDisplayName(randomParticipant.name);

            elapsedTime += interval;

            if (elapsedTime > totalDuration * 0.5) interval = 100;
            if (elapsedTime > totalDuration * 0.7) interval = 200;
            if (elapsedTime > totalDuration * 0.85) interval = 400;

            if (elapsedTime < totalDuration) {
                timeoutId = setTimeout(runAnimation, interval);
            } else {
                // PERBAIKAN: Pastikan kita menampilkan nama pemenang
                setDisplayName(winner.name);
                setIsFinished(true);
                setTimeout(onAnimationEnd, 3000);
            }
        };

        runAnimation();
        return () => clearTimeout(timeoutId);
    }, [winner, participants, onAnimationEnd]);

    return (
        <div className="absolute inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center animate-fade-in">
            <div 
                className={`text-6xl md:text-8xl font-bold transition-all duration-300 ${isFinished ? 'text-yellow-400 scale-110' : 'text-white'}`}
                style={{ textShadow: '0 0 25px rgba(255,255,100,0.7)' }}
            >
                {displayName}
            </div>
            {isFinished && (
                <div className="text-center animate-fade-in">
                    <p className="mt-4 text-2xl text-yellow-400 animate-pulse">Congratulations!</p>
                    <p className="text-lg text-gray-300">You have been chosen!</p>
                </div>
            )}
        </div>
    );
};

export default RandomPickerOverlay;