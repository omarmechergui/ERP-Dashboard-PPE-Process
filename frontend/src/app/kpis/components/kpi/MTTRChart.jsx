'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function MTTRChart({ data }) {
  if (!data) return null;

  const labelsLength = data.labels?.length || 0;
  
  // Enhance data with modern colors and styling, and add target line
  const enhancedData = {
    ...data,
    datasets: [
      ...(data.datasets?.map((dataset, index) => ({
        ...dataset,
        type: 'bar',
        backgroundColor: index === 0 ? '#3b82f6' : '#10b981', // Blue for MTTR, Emerald for MTBF
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        order: 2
      })) || []),
      // Add Target Line
      {
        type: 'line',
        label: 'Cible MTTR (4h)',
        data: Array(labelsLength).fill(4),
        borderColor: '#ef4444',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        order: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { 
        position: 'top', 
        align: 'end',
        labels: { 
          color: '#475569', 
          usePointStyle: true, 
          boxWidth: 8,
          font: { family: "'Inter', sans-serif", size: 12, weight: '500' } 
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw}h`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f1f5f9', drawBorder: false }, 
        border: { display: false, dash: [4, 4] },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11 }, padding: 8 } 
      },
      x: { 
        grid: { display: false }, 
        border: { display: false },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11 }, padding: 8 } 
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Évolution MTTR & MTBF</h3>
        <p className="text-sm text-slate-500 font-medium">Temps moyen de réparation et entre pannes (heures)</p>
      </div>
      <div className="relative flex-1 min-h-[300px]">
        <Bar data={enhancedData} options={options} />
      </div>
    </div>
  );
}
