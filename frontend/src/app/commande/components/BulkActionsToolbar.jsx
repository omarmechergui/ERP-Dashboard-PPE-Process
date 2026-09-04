"use client";

import { CheckSquare, X, Download } from "lucide-react";
import { useState } from "react";
import API from "@/lib/api";

export default function BulkActionsToolbar({ selectedIds, onClearSelection, onActionComplete }) {
  const [loading, setLoading] = useState(false);

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleBulkReceive = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir marquer ${selectedIds.length} commandes comme reçues ?`)) return;
    
    setLoading(true);
    try {
      // In a real app with a dedicated bulk endpoint:
      // await API.post("/commandes/bulk-receive", { ids: selectedIds });
      
      // Since we might only have individual endpoints, we loop:
      const promises = selectedIds.map(id => API.put(`/commandes/${id}/receive`));
      await Promise.allSettled(promises);
      
      onActionComplete();
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors du traitement en lot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-white text-xs font-bold">
          {selectedIds.length}
        </span>
        <span className="text-sm font-medium text-blue-900">
          commandes sélectionnées
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleBulkReceive}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <CheckSquare className="w-4 h-4" />
          )}
          Recevoir
        </button>
        
        <button
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exporter
        </button>

        <div className="w-px h-6 bg-blue-200 mx-1"></div>

        <button
          onClick={onClearSelection}
          className="p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
