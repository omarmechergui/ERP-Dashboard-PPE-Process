import React from 'react';
import { RefreshCw, Activity, CalendarDays } from 'lucide-react';
import DashboardFilters from './DashboardFilters';
import ExportMenu from '../export/ExportMenu';
import { useAuth } from '../../../../lib/auth';

export default function DashboardHeader({ syncTime, onRefresh, period, onPeriodChange, data }) {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Top row: Title and Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            Performance & Maintenance
          </h1>
          <div className="flex items-center gap-2 mt-3 text-secondary-foreground font-medium">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span>Système MES Actif</span>
            <span className="text-border">•</span>
            <span className="text-sm">
              Dernière synchro : {syncTime ? syncTime.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center p-2.5 text-secondary-foreground hover:text-primary hover:bg-primary/10 border border-border rounded-xl transition-all shadow-sm group"
            title="Actualiser les données"
          >
            <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
          </button>
          
          <ExportMenu data={data} userRole={user?.role} />
        </div>
      </div>
      
      {/* Bottom row: Filters */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center justify-center p-2.5 bg-card border border-border rounded-xl text-secondary-foreground shadow-sm">
          <CalendarDays className="w-5 h-5" />
        </div>
        <DashboardFilters period={period} onChange={onPeriodChange} />
      </div>
    </div>
  );
}
