'use client';

import React from 'react';
import { RefreshCcw, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardHeader({ onRefresh, isRefreshing }) {
  const currentDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 capitalize">{currentDate}</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-1 hidden md:flex items-center shadow-sm">
          <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-50 text-blue-700 transition-colors">Aujourd&apos;hui</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 transition-colors">7 Jours</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 transition-colors">30 Jours</button>
          <button className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-50 transition-colors">Cette année</button>
        </div>
        
        <button className="md:hidden flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
          <Filter className="w-4 h-4" />
        </button>
        
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.4)] transition-all active:scale-95">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exporter</span>
        </button>
      </div>
    </div>
  );
}
