import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const filters = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette Semaine' },
  { id: 'month', label: 'Ce Mois' },
  { id: 'year', label: 'Cette Année' },
  { id: 'custom', label: 'Personnalisé' },
];

export default function FilterBar() {
  const [activeFilter, setActiveFilter] = useState('week');

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 text-slate-400 mr-2 shrink-0">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Filtres</span>
      </div>
      
      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 shrink-0">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`relative px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
              activeFilter === filter.id 
                ? 'text-slate-800' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeFilter === filter.id && (
              <motion.div
                layoutId="active-filter"
                className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
