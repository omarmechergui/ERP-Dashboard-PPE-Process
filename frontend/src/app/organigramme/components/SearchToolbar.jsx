import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchToolbar({ filters, setFilters, searchQuery, setSearchQuery }) {
  const handleReset = () => {
    setFilters({
      department: 'Tous',
      role: 'Tous',
      status: 'Tous',
    });
    setSearchQuery('');
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un collaborateur par nom, rôle, département..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <X className="w-4 h-4" />
          Réinitialiser les filtres
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="Tous">Tous les départements</option>
            <option value="Direction">Direction</option>
            <option value="Production">Production</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Quality">Qualité</option>
            <option value="Stock">Stock</option>
            <option value="HR">Ressources Humaines</option>
            <option value="Administration">Administration</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Active">Actif</option>
            <option value="Inactive">Inactif</option>
            <option value="Vacation">En congé</option>
            <option value="Suspended">Suspendu</option>
          </select>
        </div>
      </div>
    </div>
  );
}
