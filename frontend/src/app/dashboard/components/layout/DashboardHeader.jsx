import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardHeader({ syncTime, onRefresh }) {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = syncTime 
    ? syncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
    : '--:--';

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Global</h1>
        <p className="text-sm font-medium text-slate-500 mt-1 capitalize">
          {currentDate}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Synchronisé à {formattedTime}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className="flex items-center justify-center p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
          title="Actualiser les données"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
