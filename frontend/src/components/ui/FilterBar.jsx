import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

export default function FilterBar({ 
  searchQuery, 
  onSearchChange, 
  onReset,
  children
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-card rounded-xl border border-border shadow-sm mb-6">
      <div className="relative flex-1 w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto ml-auto">
        {children && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted hidden lg:block" />
            {children}
          </div>
        )}
        
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary-foreground bg-secondary/50 border border-border hover:bg-secondary hover:text-foreground rounded-lg transition-colors shadow-sm ml-auto md:ml-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        )}
      </div>
    </div>
  );
}
