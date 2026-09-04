/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Package2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BomSidebar({
  boms,
  selectedBom,
  isWriteAllowed,
  onSelectBom,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  bomPage,
  bomTotalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  bomsLoading
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange, searchQuery]);

  // Sync if cleared from outside
  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  return (
    <div className="w-80 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package2 className="w-4 h-4 text-blue-500" />
            Liste des BOM
          </span>
          {isWriteAllowed && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Nouvelle BOM"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (Nom, Projet)..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
        {bomsLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        <AnimatePresence>
          {boms.map((b) => {
            const isSelected = selectedBom?.id === b.id;
            const itemCount = b._count?.lignes ?? b.lignes?.length ?? 0;
            
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectBom(b.id)}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm'
                    : 'bg-white border-transparent hover:border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className={`text-sm font-semibold truncate pr-2 ${isSelected ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600 transition-colors'}`}>
                    {b.nom_bom}
                  </p>
                  
                  {isWriteAllowed && (
                    <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(b);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(b.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] font-medium">
                  <span className={isSelected ? "text-blue-600/80" : "text-slate-500 truncate"}>
                    {b.nom_projet}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {itemCount} composant{itemCount > 1 ? 's' : ''}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {!bomsLoading && boms.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            Aucune nomenclature trouvée.
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {bomTotalPages > 1 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button 
            disabled={bomPage <= 1 || bomsLoading}
            onClick={() => onPageChange(bomPage - 1)}
            className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-500">
            Page {bomPage} sur {bomTotalPages}
          </span>
          <button 
            disabled={bomPage >= bomTotalPages || bomsLoading}
            onClick={() => onPageChange(bomPage + 1)}
            className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}} />
    </div>
  );
}
