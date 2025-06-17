import React, { useEffect, useState } from 'react';
import cloud from 'd3-cloud';

// 1. Palet Warna yang Lebih Kaya dan Profesional
const colorPalette = ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#f472b6'];

// 2. Fungsi untuk menentukan ketebalan font berdasarkan frekuensi
const fontWeightMapper = (word) => (word.value > 3 ? 'bold' : 'normal');

// 3. Fungsi untuk menentukan ukuran font (sedikit disesuaikan)
const fontSizeMapper = (word) => Math.log2(word.value) * 12 + 18;

// 4. Fungsi untuk rotasi kata secara acak
const rotate = () => (Math.random() > 0.6 ? 0 : 90);

const WordCloudDisplay = ({ results }) => {
    const [words, setWords] = useState([]);

    useEffect(() => {
        const dataForCloud = Object.entries(results).map(([text, value]) => ({
            text: text,
            value: value,
        }));

        if (dataForCloud.length === 0) {
            setWords([]);
            return;
        }

        const layout = cloud()
            .size([500, 350])
            .words(dataForCloud)
            .padding(5)
            .rotate(rotate)
            .font("Inter")
            .fontSize(d => d.size) // Ukuran akan di-set oleh d3-cloud
            .on("end", (calculatedWords) => {
                // Tambahkan properti size dan weight ke hasil kalkulasi
                const finalWords = calculatedWords.map(word => ({
                    ...word,
                    size: fontSizeMapper(word), // Hitung ukuran font final di sini
                    weight: fontWeightMapper(word), // Hitung ketebalan font di sini
                }));
                setWords(finalWords);
            });

        layout.start();

    }, [results]);

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
                            className="word" // Terapkan class untuk animasi dan hover
                            textAnchor="middle"
                            transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                            style={{
                                fontSize: word.size,
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: word.weight, // Terapkan ketebalan font
                                fill: colorPalette[i % colorPalette.length], // Terapkan warna dari palet
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