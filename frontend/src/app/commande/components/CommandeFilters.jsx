"use client";

import { Search, Filter, X } from "lucide-react";

export default function CommandeFilters({ filters, setFilters, clearFilters }) {
  const hasActiveFilters = filters.search !== "" || filters.status !== "ALL" || filters.dateRange !== "ALL";

  return (
    <div className="p-4 border-b border-slate-200 bg-white space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (Réf, Fournisseur, Article)..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all text-slate-600"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="RECEIVED">Reçue</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500 mr-1">Filtres actifs:</span>
          
          {filters.search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Recherche: {filters.search}
              <button onClick={() => setFilters({ ...filters, search: "" })} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== "ALL" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Statut: {filters.status === "PENDING" ? "En attente" : "Reçue"}
              <button onClick={() => setFilters({ ...filters, status: "ALL" })} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button 
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 ml-2"
          >
            Effacer tout
          </button>
        </div>
      )}
    </div>
  );
}
