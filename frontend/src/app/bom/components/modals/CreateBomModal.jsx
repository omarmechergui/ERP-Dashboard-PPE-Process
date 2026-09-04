import React, { useState, useEffect } from 'react';
import { X, Package2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateBomModal({ isOpen, onClose, initialData, onSubmit }) {
  const defaultForm = {
    nom_projet: '',
    nom_bom: '',
    jig: '',
    contrepartie: '',
    clip: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    if (initialData) {
      setForm(initialData);
    } else {
      setForm(defaultForm);
    }
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                <Package2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {initialData ? "Modifier la Nomenclature" : "Nouvelle Nomenclature (BOM)"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Code / Nom BOM <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: BOM-2026-015"
                value={form.nom_bom}
                onChange={(e) => setForm({ ...form, nom_bom: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Nom du Projet <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Projet Alpha"
                value={form.nom_projet}
                onChange={(e) => setForm({ ...form, nom_projet: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Jig</label>
                <input
                  type="text"
                  placeholder="Réf..."
                  value={form.jig}
                  onChange={(e) => setForm({ ...form, jig: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Contrepartie</label>
                <input
                  type="text"
                  placeholder="Réf..."
                  value={form.contrepartie}
                  onChange={(e) => setForm({ ...form, contrepartie: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Clip</label>
                <input
                  type="text"
                  placeholder="Réf..."
                  value={form.clip}
                  onChange={(e) => setForm({ ...form, clip: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                {initialData ? "Mettre à jour" : "Créer la BOM"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
