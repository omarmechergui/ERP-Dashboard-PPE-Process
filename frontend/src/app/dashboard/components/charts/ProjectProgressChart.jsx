import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ProjectProgressChart({ projectProgress = [], loading, error }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="w-40 h-4 bg-slate-100 rounded animate-pulse mb-2" />
            <div className="w-48 h-3 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 w-full bg-slate-50/50 rounded-xl animate-pulse flex items-end justify-around px-4 pb-4">
           {/* Fake bars for skeleton */}
           {[...Array(5)].map((_, i) => (
             <div key={i} className="w-8 bg-slate-200/50 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
           ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-rose-600 mb-1">Erreur de chargement</p>
        <p className="text-xs text-slate-500">Impossible de charger l'avancement des projets.</p>
      </div>
    );
  }

  const barChartData = {
    labels: projectProgress.map(p => p.projet),
    datasets: [
      {
        label: 'Avancement Moyen (%)',
        data: projectProgress.map(p => p.avancement),
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.7)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.9)');
          return gradient;
        },
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        bodyFont: { size: 13, weight: 'bold' },
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y}% complété`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 11, weight: '600' }, callback: (v) => v + '%' },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } },
        border: { display: false }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Avancement par Projet</h4>
          <p className="text-xs text-slate-400 mt-0.5">Moyenne des étapes de construction</p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {projectProgress.length} projets
        </span>
      </div>
      <div className="h-64 flex items-center">
        {projectProgress.length > 0 ? (
          <Bar data={barChartData} options={barChartOptions} />
        ) : (
          <p className="text-xs text-slate-400 text-center w-full">Aucun projet actif à afficher</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(ProjectProgressChart);
