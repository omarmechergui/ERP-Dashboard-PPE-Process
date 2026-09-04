import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package } from 'lucide-react';

export default function CriticalStockPanel({ criticalStockItems = [], loading, error }) {
  const items = useMemo(() => {
    return (criticalStockItems || []).slice(0, 8).map(art => {
      const pct = art.min_stock > 0 ? Math.round((art.quantite / art.min_stock) * 100) : 100;
      let priority = 'low';
      let priorityColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      let barColor = 'bg-emerald-500';

      if (pct <= 25) {
        priority = 'critical';
        priorityColor = 'text-rose-600 bg-rose-50 border-rose-200';
        barColor = 'bg-rose-500';
      } else if (pct <= 60) {
        priority = 'warning';
        priorityColor = 'text-amber-600 bg-amber-50 border-amber-200';
        barColor = 'bg-amber-500';
      }

      return { ...art, pct: Math.min(pct, 100), priority, priorityColor, barColor };
    });
  }, [criticalStockItems]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px] flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div>
              <div className="w-32 h-4 bg-slate-100 rounded animate-pulse mb-1.5" />
              <div className="w-48 h-3 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-20 h-6 bg-slate-100 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 animate-pulse">
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="flex-1">
                <div className="w-1/2 h-3 bg-slate-100 rounded mb-2" />
                <div className="w-3/4 h-1.5 bg-slate-100 rounded-full" />
              </div>
              <div className="w-12 h-4 bg-slate-100 rounded" />
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
        <p className="text-xs text-slate-500">Impossible de charger le stock critique.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[390px]"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-rose-100 p-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Stock Critique</h4>
            <p className="text-xs text-slate-400 mt-0.5">Articles sous le seuil minimum</p>
          </div>
        </div>
        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          {items.length} articles
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {items.length > 0 ? items.map((item, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-pointer group"
          >
            <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200/70 transition-colors">
              <Package className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{item.nom_article}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.barColor}`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">{item.quantite}/{item.min_stock}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${item.priorityColor}`}>
              {item.priority === 'critical' ? 'Critique' : item.priority === 'warning' ? 'Alerte' : 'OK'}
            </span>
          </motion.div>
        )) : (
          <div className="text-center py-8 text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucun article en stock critique</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}} />
    </motion.div>
  );
}
