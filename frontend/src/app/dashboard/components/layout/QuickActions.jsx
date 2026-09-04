import React from 'react';
import { PlusCircle, PackagePlus, CalendarPlus, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { label: 'Nouveau Panneau', icon: PlusCircle, color: 'text-blue-600', bg: 'bg-blue-100/80', border: 'border-blue-200' },
  { label: 'Ajouter Stock', icon: PackagePlus, color: 'text-emerald-600', bg: 'bg-emerald-100/80', border: 'border-emerald-200' },
  { label: 'Nouvelle Réservation', icon: Settings2, color: 'text-amber-600', bg: 'bg-amber-100/80', border: 'border-amber-200' },
  { label: 'Créer Planning', icon: CalendarPlus, color: 'text-purple-600', bg: 'bg-purple-100/80', border: 'border-purple-200' },
];

export default function QuickActions() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border ${action.border} bg-white shadow-sm hover:shadow-md transition-shadow shrink-0`}
        >
          <div className={`p-1.5 rounded-lg ${action.bg}`}>
            <action.icon className={`w-4 h-4 ${action.color}`} />
          </div>
          <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
