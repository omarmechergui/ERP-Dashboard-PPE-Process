import React from 'react';

export default function StatusBadge({ status }) {
  if (!status) return null;

  const styles = {
    BROUILLON: 'bg-slate-100 text-slate-700 border-slate-200',
    PLANIFIE: 'bg-blue-50 text-blue-700 border-blue-200',
    EN_PRODUCTION: 'bg-purple-50 text-purple-700 border-purple-200',
    TERMINE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ANNULE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full border ${styles[status] || defaultStyle}`}
    >
      {String(status).replace('_', ' ')}
    </span>
  );
}
