import React, { useEffect, useState, useMemo } from 'react';
import cloud from 'd3-cloud';

const colorPalette = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6'];
const fontSizeMapper = (word) => Math.log2(word.value) * 12 + 18;
const rotate = () => 0;

const WordCloudDisplay = ({ results }) => { // 'results' sekarang adalah list kata, e.g., ["a", "b", "a"]
    const [words, setWords] = useState([]);

    // PERBAIKAN: Gunakan useMemo untuk menghitung frekuensi hanya jika 'results' berubah
    const frequencyMap = useMemo(() => {
        if (!results || results.length === 0) return [];
        
        const count = {};
        for (const word of results) {
            count[word] = (count[word] || 0) + 1;
        }
        
        return Object.entries(count).map(([text, value]) => ({ text, value }));
    }, [results]);

    useEffect(() => {
        if (frequencyMap.length === 0) {
            setWords([]);
            return;
        }

        const layout = cloud()
            .size([500, 350])
            .words(frequencyMap)
            .padding(5)
            .rotate(rotate)
            .font("Inter")
            .fontSize(d => fontSizeMapper(d))
            .on("end", (calculatedWords) => {
                setWords(calculatedWords);
            });

        layout.start();
    }, [frequencyMap]);

    if (words.length === 0) {
        return <p className="text-center text-gray-400 animate-pulse">Waiting for submissions...</p>;
    }

    return (
        <div style={{ width: '100%', height: '350px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 350">
                <g transform="translate(250,175)">
                    {words.map((word, i) => (
                        <text
                            key={word.text + i}
                            className="word"
                            textAnchor="middle"
                            transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                            style={{
                                fontSize: word.size,
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: (word.value > 3 ? 'bold' : 'normal'),
                                fill: colorPalette[i % colorPalette.length],
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {word.text}
                        </text>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default WordCloudDisplay;