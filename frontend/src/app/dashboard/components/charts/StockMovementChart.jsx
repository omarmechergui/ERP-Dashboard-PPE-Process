import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Title, Tooltip, Legend);

function StockMovementChart({ stockStats = [], loading, error }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="w-48 h-4 bg-slate-100 rounded animate-pulse mb-2" />
            <div className="w-56 h-3 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-20 h-6 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 w-full bg-slate-50/50 rounded-xl animate-pulse flex items-end justify-between px-2 pb-2">
           {/* Fake graph line elements for skeleton */}
           {[...Array(6)].map((_, i) => (
             <div key={i} className="w-2 bg-slate-200/50 rounded-full" style={{ height: `${Math.random() * 50 + 10}%` }} />
           ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-rose-600 mb-1">Erreur de chargement</p>
        <p className="text-xs text-slate-500">Impossible de charger les statistiques de stock.</p>
      </div>
    );
  }

  const lineChartData = {
    labels: stockStats.map(s => s.date),
    datasets: [
      {
        label: 'Entrées',
        data: stockStats.map(s => s.entrees),
        borderColor: '#10b981',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
      {
        label: 'Sorties',
        data: stockStats.map(s => s.sorties),
        borderColor: '#ef4444',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'rgba(239, 68, 68, 0.1)';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#64748b',
          font: { size: 12, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } },
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
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Mouvements de Stock</h4>
          <p className="text-xs text-slate-400 mt-0.5">Entrées vs. Sorties (7 derniers jours)</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">7 jours</span>
        </div>
      </div>
      <div className="h-64 flex items-center">
        {stockStats.length > 0 ? (
          <Line data={lineChartData} options={lineChartOptions} />
        ) : (
          <p className="text-xs text-slate-400 text-center w-full">Aucun mouvement récent à afficher</p>
        )}
      </div>
    </motion.div>
  );
}

export default memo(StockMovementChart);
