"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Paperclip, Camera } from "lucide-react";

export default function RejectModal({ isOpen, onClose, onSubmit, error }) {
  const [comment, setComment] = useState("");
  const [severity, setSeverity] = useState("Majeure");

  const handleClose = () => {
    setComment("");
    setSeverity("Majeure");
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(comment, severity);
    setComment("");
    setSeverity("Majeure");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Rapport de Non-Conformité
          </h2>
          <button 
            onClick={handleClose} 
            className="p-1 rounded-full hover:bg-white text-slate-500 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          </div>
        )}

        <form id="reject-form" onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Sévérité du défaut <span className="text-rose-500">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow text-sm font-medium"
            >
              <option value="Critique">Critique (Danger / Blocage total)</option>
              <option value="Majeure">Majeure (Non-fonctionnel)</option>
              <option value="Mineure">Mineure (Esthétique / Mineur)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Commentaire détaillé <span className="text-rose-500">*</span>
            </label>
            <textarea
              placeholder="Ex: Défaut de sertissage sur le connecteur principal X4. Faisceau retourné."
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow text-sm resize-none"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pièces jointes (Futur)
            </label>
            <div className="flex gap-2">
              <button type="button" disabled className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 flex items-center justify-center gap-2 text-xs font-medium bg-slate-50/50 cursor-not-allowed">
                <Camera className="w-4 h-4" /> Ajouter Photo
              </button>
              <button type="button" disabled className="flex-1 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 flex items-center justify-center gap-2 text-xs font-medium bg-slate-50/50 cursor-not-allowed">
                <Paperclip className="w-4 h-4" /> Joindre Fichier
              </button>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            form="reject-form"
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium shadow-sm shadow-rose-600/20 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
          >
            Confirmer le Rejet
          </button>
        </div>
      </div>
    </div>
  );
}
