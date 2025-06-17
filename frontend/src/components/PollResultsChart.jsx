import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../context/ThemeContext'; // Impor hook tema

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PollResultsChart = ({ results }) => {
    const { theme } = useTheme(); // Dapatkan tema saat ini

    // Tentukan warna teks berdasarkan tema
    const textColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const data = {
        labels: Object.keys(results),
        datasets: [{
            label: '# of Votes',
            data: Object.values(results),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }],
    };

    const options = {
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    color: textColor, // Terapkan warna teks
                },
                grid: {
                    color: gridColor, // Terapkan warna grid
                }
            },
            y: {
                ticks: {
                    color: textColor, // Terapkan warna teks
                },
                grid: {
                    color: gridColor, // Terapkan warna grid
                }
            }
        },
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Live Poll Results',
                color: textColor, // Terapkan warna teks
            },
            tooltip: {
                bodyColor: '#fff',
                titleColor: '#fff',
            }
        },
    };

    return <Bar data={data} options={options} />;
};

export default PollResultsChart;