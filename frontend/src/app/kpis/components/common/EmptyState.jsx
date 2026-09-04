import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ onRefresh }) {
  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 max-w-lg w-full text-center border border-slate-100"
      >
        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
          <AlertTriangle className="w-10 h-10 text-slate-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Aucune donnée disponible</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Il semblerait qu&apos;il n&apos;y ait pas de données KPI pour la période sélectionnée ou que le serveur soit indisponible.
        </p>
        
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          Actualiser les données
        </button>
      </motion.div>
    </div>
  );
}
