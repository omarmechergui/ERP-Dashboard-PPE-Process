/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function CreatePanneauModal({ isOpen, onClose, onSubmit, boms, entrepots, supervisors }) {
  const [formData, setFormData] = useState({
    id: "",
    title_panneau: "",
    title_project: "",
    bom_id: "",
    entrepot_id: "",
    superviseur_id: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: "",
        title_panneau: "",
        title_project: boms.length > 0 ? boms[0].nom_projet : "Projet Alpha",
        bom_id: boms.length > 0 ? String(boms[0].id) : "",
        entrepot_id: "", // Force user to select
        superviseur_id: supervisors.length > 0 ? String(supervisors[0].matricule || supervisors[0].id) : ""
      });
      setError("");
    }
  }, [isOpen, boms, entrepots, supervisors]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "bom_id" ? (value || null)
            : name === "entrepot_id" ? (value || null)
            : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.title_panneau || !formData.bom_id || !formData.superviseur_id) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Nouveau Panneau</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}

        <form id="create-panneau-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                ID Panneau <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="id"
                placeholder="Ex: PNL-108"
                value={formData.id}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Titre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title_panneau"
                placeholder="Ex: Panneau Central"
                value={formData.title_panneau}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Projet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title_project"
              placeholder="Ex: Projet Alpha"
              value={formData.title_project}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              BOM <span className="text-rose-500">*</span>
            </label>
            <select
              name="bom_id"
              value={formData.bom_id}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
            >
              {boms.map((b) => (
                <option key={b.id} value={b.id}>{b.nom_bom} ({b.nom_projet})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Entrepôt cible
            </label>
            <select
              name="entrepot_id"
              value={formData.entrepot_id}
              onChange={handleInputChange}
              className={`w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm ${!formData.entrepot_id ? 'text-slate-400' : ''}`}
            >
              <option value="">Sélectionner un entrepôt</option>
              {entrepots.length === 0 && <option value="" disabled>Aucun entrepôt disponible</option>}
              {entrepots.map((e) => (
                <option key={e.id} value={e.id} className="text-slate-900">{e.nom} {e.emplacement ? `(${e.emplacement})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Superviseur <span className="text-rose-500">*</span>
            </label>
            <select
              name="superviseur_id"
              value={formData.superviseur_id}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm"
            >
              {supervisors.map((s) => (
                <option key={s.matricule || s.id} value={s.matricule || s.id}>{s.nom} ({s.role})</option>
              ))}
            </select>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            form="create-panneau-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <Save className="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
