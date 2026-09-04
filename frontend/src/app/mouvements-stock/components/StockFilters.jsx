import React from "react";
import { Search, Filter, X, Calendar } from "lucide-react";

export const StockFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  typeFilter, 
  setTypeFilter, 
  dateRange, 
  setDateRange 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      
      {/* Search Bar */}
      <div className="relative flex-1 w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ID, article, PO reference..."
          className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 placeholder-slate-400 pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48 bg-white border border-slate-200 text-slate-700 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="ENTREE">Entries Only</option>
            <option value="SORTIE">Exits Only</option>
            <option value="TRANSFERT">Transfers</option>
            <option value="AJUSTEMENT">Adjustments</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48 bg-white border border-slate-200 text-slate-700 pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>
    </div>
  );
};
