"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, User, RefreshCw } from "lucide-react";
import API from "../../../lib/api";

export default function HistoryModal({ isOpen, onClose, panneauId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !panneauId) return;

    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(`/panneaux/${panneauId}/history`);
        setHistory(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger l'historique (l'API n'est peut-être pas encore disponible).");
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [isOpen, panneauId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">
            Historique KHM: <span className="text-blue-600">{panneauId}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-sm">Chargement de l&apos;historique...</p>
            </div>
          ) : error ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm text-center">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm">Aucun historique de contrôle trouvé.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {history.map((event, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-white" />
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-900">{event.action || event.etat}</p>
                    {event.commentaire && (
                      <p className="text-xs text-slate-600 mt-1 italic">&quot;{event.commentaire}&quot;</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {event.user_name || "Système"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
