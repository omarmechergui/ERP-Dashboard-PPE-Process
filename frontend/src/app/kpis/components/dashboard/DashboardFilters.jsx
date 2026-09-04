import React from 'react';

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 Derniers Jours' },
  { value: '30days', label: '30 Derniers Jours' },
  { value: 'quarter', label: 'Ce Trimestre' },
  { value: 'year', label: 'Cette Année' }
];

export default function DashboardFilters({ period, onChange }) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 overflow-x-auto custom-scrollbar">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
            period === p.value
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
