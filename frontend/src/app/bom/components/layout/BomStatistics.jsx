import React, { useState, useEffect } from 'react';
import { Package2, Layers, FolderKanban, AlertTriangle, CircleDollarSign, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BomStatistics() {
  const [statsData, setStatsData] = useState({
    totalBoms: 0,
    totalComponents: 0,
    projectCount: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    import('../../../../lib/api').then(({ default: API }) => {
      API.get('/bom/stats/summary')
        .then(res => {
          if (!ignore) {
            setStatsData(res.data);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          if (!ignore) setLoading(false);
        });
    });
    return () => { ignore = true; };
  }, []);

  const stats = [
    { label: 'Total BOMs', value: statsData.totalBoms, icon: Package2, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Composants Liés', value: statsData.totalComponents, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Projets Actifs', value: statsData.projectCount, icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'Valeur Nomenclatures', value: `${statsData.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND`, icon: CircleDollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Alertes Stock', value: 'N/A', icon: AlertTriangle, color: 'text-slate-400', bg: 'bg-slate-100' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          )}
          <div className={`p-3 rounded-xl ${stat.bg}`}>
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
