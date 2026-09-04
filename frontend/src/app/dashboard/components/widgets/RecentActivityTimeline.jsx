import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck, Activity } from 'lucide-react';

export default function RecentActivityTimeline({ recentMovements = [], loading, error }) {
  const timelineItems = useMemo(() => {
    return (recentMovements || []).slice(0, 8).map(m => {
      const date = new Date(m.createdAt);
      const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const isEntree = m.type === 'ENTREE';

      return {
        id: m.id,
        time,
        icon: isEntree ? ArrowDownToLine : ArrowUpFromLine,
        iconColor: isEntree ? 'text-emerald-600' : 'text-rose-600',
        iconBg: isEntree ? 'bg-emerald-100' : 'bg-rose-100',
        label: isEntree ? 'Entrée Stock' : 'Sortie Stock',
        detail: `${m.article_id} — ${m.article?.nom_article || 'Article'}`,
        badge: isEntree ? `+${m.quantite}` : `-${m.quantite}`,
        badgeColor: isEntree ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200',
        secondary: isEntree
          ? `PO: ${m.po_reference || '—'}`
          : `Matricule: ${m.matricule || '—'}`,
      };
    });
  }, [recentMovements]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div>
            <div className="w-32 h-4 bg-slate-100 rounded animate-pulse mb-1.5" />
            <div className="w-48 h-3 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-2 animate-pulse">
              <div className="w-10 h-3 bg-slate-100 rounded mt-1" />
              <div className="w-7 h-7 bg-slate-100 rounded-lg" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-slate-100 rounded mb-2" />
                <div className="w-40 h-3 bg-slate-100 rounded" />
              </div>
              <div className="w-10 h-6 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-rose-600 mb-1">Erreur de chargement</p>
        <p className="text-xs text-slate-500">Impossible de charger l'activité récente.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-100 p-2 rounded-xl">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Activité Récente</h4>
            <p className="text-xs text-slate-400 mt-0.5">Derniers mouvements de stock</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
        {timelineItems.length > 0 ? timelineItems.map((item, i) => (
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            key={item.id}
            className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
          >
            {/* Time */}
            <span className="text-xs font-bold text-slate-400 w-12 shrink-0 pt-1 text-right font-mono">
              {item.time}
            </span>

            {/* Icon */}
            <div className={`p-1.5 rounded-lg ${item.iconBg} shrink-0 mt-0.5`}>
              <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.detail}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.secondary}</p>
            </div>

            {/* Badge */}
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${item.badgeColor}`}>
              {item.badge}
            </span>
          </motion.div>
        )) : (
          <div className="text-center py-8 text-slate-400">
            <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
