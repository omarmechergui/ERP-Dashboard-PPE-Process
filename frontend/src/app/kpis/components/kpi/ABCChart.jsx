'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ABCChart({ data }) {
  if (!data) return null;

  // Enhance data with modern colors
  const enhancedData = {
    ...data,
    datasets: data.datasets?.map(dataset => ({
      ...dataset,
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'], // Red, Orange, Blue, Emerald, Purple
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4,
    })) || []
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { 
        position: 'right', 
        labels: { 
          color: '#475569', 
          usePointStyle: true, 
          boxWidth: 8,
          font: { family: "'Inter', sans-serif", size: 12, weight: '500' },
          padding: 20
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
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw}%`
        }
      }
    }
  };
  
  const total = data.datasets?.[0]?.data?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Défaillances — Classement ABC</h3>
        <p className="text-sm text-slate-500 font-medium">Répartition des pannes par criticité</p>
      </div>
      <div className="relative flex-1 min-h-[300px] flex items-center justify-center">
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none pr-32">
          <span className="text-3xl font-bold text-slate-800">{total}%</span>
          <span className="text-xs text-slate-500 font-medium">Total</span>
        </div>
        <div className="relative z-10 w-full h-full">
           <Doughnut data={enhancedData} options={options} />
        </div>
      </div>
    </div>
  );
}
