import React from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

export default function InterventionFilters({ 
  filters, 
  searchQuery, 
  onSearchChange, 
  onFilterChange, 
  onReset,
  onRefresh,
  machines = [],
  technicians = []
}) {
  const hasActiveFilters = 
    (filters.type && filters.type !== 'Tous') ||
    (filters.kpiType && filters.kpiType !== 'Tous') ||
    (filters.priority && filters.priority !== 'Tous') ||
    (filters.status && filters.status !== 'Tous') ||
    (filters.shift && filters.shift !== 'Tous') ||
    searchQuery.trim().length > 0;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 flex flex-col gap-4 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par code, machine, technicien..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button 
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 hover:text-foreground rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          )}
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-sm hover:shadow"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-4 h-4 text-muted" />
          <span className="text-sm font-semibold text-secondary-foreground uppercase tracking-wider">Filtres</span>
        </div>

        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            value={filters.type || 'Tous'}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm font-medium bg-background border border-input rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground appearance-none shadow-sm cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="Tous">Tous les types</option>
            <option value="Preventive">Préventive</option>
            <option value="Corrective">Corrective</option>
            <option value="Predictive">Prédictive</option>
            <option value="Inspection">Inspection</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            value={filters.kpiType || 'Tous'}
            onChange={(e) => onFilterChange({ kpiType: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm font-medium bg-background border border-input rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground appearance-none shadow-sm cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="Tous">Tous les KPI</option>
            <option value="MTTR">MTTR</option>
            <option value="MTBF">MTBF</option>
            <option value="None">Non défini</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            value={filters.priority || 'Tous'}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm font-medium bg-background border border-input rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground appearance-none shadow-sm cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="Tous">Toutes les priorités</option>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
            <option value="Critical">Critique</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            value={filters.status || 'Tous'}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm font-medium bg-background border border-input rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground appearance-none shadow-sm cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Planned">Planifié</option>
            <option value="In Progress">En cours</option>
            <option value="Waiting">En attente</option>
            <option value="Completed">Terminé</option>
            <option value="Cancelled">Annulé</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px] max-w-[200px]">
          <select
            value={filters.shift || 'Tous'}
            onChange={(e) => onFilterChange({ shift: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm font-medium bg-background border border-input rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground appearance-none shadow-sm cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            <option value="Tous">Tous les shifts</option>
            <option value="Matin">A (Matin)</option>
            <option value="Après-midi">B (Après-midi)</option>
            <option value="Nuit">C (Nuit)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
