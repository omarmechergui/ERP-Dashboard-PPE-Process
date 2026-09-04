import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, CheckCircle, ClipboardCheck, Trophy } from 'lucide-react';

const stages = [
  { label: 'Construction', value: 35, icon: Hammer, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-600' },
  { label: 'Validation', value: 28, icon: ClipboardCheck, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  { label: 'KHM', value: 20, icon: CheckCircle, gradient: 'from-purple-500 to-fuchsia-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  { label: 'Terminé', value: 17, icon: Trophy, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
];

export default function ProductionStatus() {
  const total = stages.reduce((sum, s) => sum + s.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Statut de Production</h4>
          <p className="text-xs text-slate-400 mt-0.5">Répartition des panneaux par étape</p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {total} panneaux
        </span>
      </div>

      <div className="space-y-5">
        {stages.map((stage, i) => {
          const pct = total > 0 ? Math.round((stage.value / total) * 100) : 0;
          return (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${stage.bg}`}>
                    <stage.icon className={`w-3.5 h-3.5 ${stage.text}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">{stage.value}</span>
                  <span className="text-xs font-black text-slate-800">{pct}%</span>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${stage.gradient}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
