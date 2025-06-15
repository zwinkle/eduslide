// frontend/src/components/PollResultsChart.jsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PollResultsChart = ({ results }) => {
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
        indexAxis: 'y', // Membuat chart menjadi horizontal bar
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1, // Pastikan sumbu X hanya menampilkan angka bulat
                }
            },
        },
        responsive: true,
        plugins: {
            legend: {
                display: false, // Sembunyikan legenda
            },
            title: {
                display: true,
                text: 'Live Poll Results',
            },
        },
    };

    return <Bar data={data} options={options} />;
};

export default PollResultsChart;