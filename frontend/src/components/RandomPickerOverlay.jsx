// frontend/src/components/RandomPickerOverlay.jsx

import React, { useState, useEffect } from 'react';

const RandomPickerOverlay = ({ data, onAnimationEnd }) => {
    const { winner, participants } = data;
    const [displayName, setDisplayName] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!winner || participants.length === 0) return;

        let timeoutId;
        // Total durasi animasi sekitar 4 detik
        const totalDuration = 4000;
        let interval = 50; // Interval awal (cepat)
        let elapsedTime = 0;

        const runAnimation = () => {
            // Pilih nama acak dari daftar untuk ditampilkan
            const randomIndex = Math.floor(Math.random() * participants.length);
            setDisplayName(participants[randomIndex]);

            elapsedTime += interval;

            // Perlambat interval seiring waktu
            if (elapsedTime > totalDuration * 0.5) interval = 100;
            if (elapsedTime > totalDuration * 0.7) interval = 200;
            if (elapsedTime > totalDuration * 0.85) interval = 400;

            if (elapsedTime < totalDuration) {
                timeoutId = setTimeout(runAnimation, interval);
            } else {
                // Animasi selesai, tampilkan pemenang sebenarnya
                setDisplayName(winner);
                setIsFinished(true);
                // Tutup overlay setelah 3 detik
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
                style={{ textShadow: '0 0 15px rgba(255,255,255,0.5)' }}
            >
                {displayName}
            </div>
            {isFinished && <p className="mt-4 text-2xl text-yellow-400 animate-pulse">Congratulations!</p>}
        </div>
    );
};

export default RandomPickerOverlay;