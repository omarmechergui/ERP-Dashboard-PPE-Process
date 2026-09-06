import React from 'react';
import { Layers, FileText, CalendarCheck, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const KPI_CONFIG = [
  { id: 'ALL', label: 'Toutes', icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  { id: 'BROUILLON', label: 'Brouillons', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  { id: 'PLANIFIEE', label: 'Planifiées', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'EN_PRODUCTION', label: 'En Production', icon: PlayCircle, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  { id: 'TERMINEE', label: 'Terminées', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'ANNULEE', label: 'Annulées', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
];

export default function PlanificationKPICards({ stats, activeFilter, onFilterChange }) {
  const getCount = (id) => {
    if (!stats) return 0;
    switch (id) {
      case 'ALL': return stats.total || 0;
      case 'BROUILLON': return stats.brouillon || 0;
      case 'PLANIFIEE': return stats.planifiees || 0;
      case 'EN_PRODUCTION': return stats.enProduction || 0;
      case 'TERMINEE': return stats.terminees || 0;
      case 'ANNULEE': return stats.annulees || 0;
      default: return 0;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {KPI_CONFIG.map((kpi, index) => {
        const count = getCount(kpi.id);
        const isActive = activeFilter === kpi.id;
        const Icon = kpi.icon;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onFilterChange(kpi.id)}
            className={`
              relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 group overflow-hidden
              ${isActive 
                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' 
                : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
              }
            `}
          >
            {/* Background Icon Decoration */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12`}>
              <Icon className="w-24 h-24" />
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bg} ${kpi.border}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {kpi.label}
                </p>
                <div className="flex items-end gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-800 leading-none">
                    {count}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Active Indicator Line */}
            {isActive && (
              <motion.div 
                layoutId="activeKpiIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-2xl"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
