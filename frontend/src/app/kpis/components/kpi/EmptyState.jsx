'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, RefreshCcw } from 'lucide-react';

export default function EmptyState({ onRefresh }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-slate-200"
    >
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Database className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Aucune donnée disponible</h2>
      <p className="text-slate-500 text-center max-w-md mb-8">
        Il n&apos;y a pas de données de maintenance à afficher pour la période sélectionnée. 
        Vérifiez vos filtres ou réessayez plus tard.
      </p>
      
      <button 
        onClick={onRefresh}
        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-95"
      >
        <RefreshCcw className="w-4 h-4" />
        Rafraîchir les données
      </button>
    </motion.div>
  );
}
