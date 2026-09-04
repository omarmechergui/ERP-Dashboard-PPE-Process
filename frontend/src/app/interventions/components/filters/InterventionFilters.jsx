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
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par code, machine, technicien..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
          <button 
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.type || 'Tous'}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
          >
            <option value="Tous">Tous les types</option>
            <option value="Preventive">Préventive</option>
            <option value="Corrective">Corrective</option>
            <option value="Predictive">Prédictive</option>
            <option value="Inspection">Inspection</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.priority || 'Tous'}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
          >
            <option value="Tous">Toutes les priorités</option>
            <option value="Low">Basse</option>
            <option value="Medium">Moyenne</option>
            <option value="High">Haute</option>
            <option value="Critical">Critique</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.status || 'Tous'}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Planned">Planifié</option>
            <option value="In Progress">En cours</option>
            <option value="Waiting">En attente</option>
            <option value="Completed">Terminé</option>
            <option value="Cancelled">Annulé</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.shift || 'Tous'}
            onChange={(e) => onFilterChange({ shift: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
          >
            <option value="Tous">Tous les shifts</option>
            <option value="Matin">A</option>
            <option value="Après-midi">B</option>
            <option value="Nuit">C</option>
          </select>
        </div>
      </div>
    </div>
  );
}
