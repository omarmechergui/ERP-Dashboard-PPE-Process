"use client";

import { CheckSquare, X, Download, XCircle } from "lucide-react";
import { useState } from "react";
import API from "@/lib/api";

export default function ReservationBulkActions({ selectedIds, onClearSelection, onActionComplete, isWriteAllowed }) {
  const [loading, setLoading] = useState(false);

  if (!selectedIds || selectedIds.length === 0) return null;

  const handleBulkValidate = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir valider ${selectedIds.length} réservations ?`)) return;

    setLoading(true);
    try {
      const promises = selectedIds.map(id => API.patch(`/reservations/${id}/validate`));
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        alert(`${selectedIds.length - failed} réservations validées avec succès. ${failed} ont échoué (stock insuffisant ou statut invalide).`);
      }
      onActionComplete();
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler ${selectedIds.length} réservations ? Le stock réservé sera libéré.`)) return;

    setLoading(true);
    try {
      const promises = selectedIds.map(id => API.patch(`/reservations/${id}/cancel`));
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        alert(`${selectedIds.length - failed} annulées. ${failed} n'ont pas pu être annulées.`);
      }
      onActionComplete();
      onClearSelection();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-600 text-white text-xs font-bold">
          {selectedIds.length}
        </span>
        <span className="text-sm font-medium text-blue-900">
          réservations sélectionnées
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isWriteAllowed && (
          <>
            <button
              onClick={handleBulkValidate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              Valider
            </button>

            <button
              onClick={handleBulkCancel}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Annuler
            </button>
          </>
        )}

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
