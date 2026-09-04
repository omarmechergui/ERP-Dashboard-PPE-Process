import React from 'react';

export default function StatusBadge({ status }) {
  const statusConfig = {
    'PLANNED': { label: 'Planifié', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'TO_DO': { label: 'À Faire', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    'IN_PROGRESS': { label: 'En Cours', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'COMPLETED': { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'OVERDUE': { label: 'En Retard', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}
