import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BomDetails({ selectedBom, isWriteAllowed, onUpdate }) {
  const [form, setForm] = useState({
    nom_projet: '',
    nom_bom: '',
    jig: '',
    contrepartie: '',
    clip: '',
  });

  const [prevSelectedBomId, setPrevSelectedBomId] = useState(null);

  if (selectedBom && selectedBom.id !== prevSelectedBomId) {
    setPrevSelectedBomId(selectedBom.id);
    setForm({
      nom_projet: selectedBom.nom_projet || '',
      nom_bom: selectedBom.nom_bom || '',
      jig: selectedBom.jig || '',
      contrepartie: selectedBom.contrepartie || '',
      clip: selectedBom.clip || '',
    });
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(selectedBom.id, form);
  };

  if (!selectedBom) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 flex-shrink-0">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{selectedBom.nom_bom}</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Projet : <span className="text-blue-600">{selectedBom.nom_projet}</span></p>
        </div>
        
        {isWriteAllowed && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
            Jig (Planche)
          </label>
          <input
            type="text"
            name="jig"
            value={form.jig}
            onChange={handleChange}
            disabled={!isWriteAllowed}
            placeholder="Référence Jig..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
            Contrepartie
          </label>
          <input
            type="text"
            name="contrepartie"
            value={form.contrepartie}
            onChange={handleChange}
            disabled={!isWriteAllowed}
            placeholder="Réf Contrepartie..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">
            Clip de fixation
          </label>
          <input
            type="text"
            name="clip"
            value={form.clip}
            onChange={handleChange}
            disabled={!isWriteAllowed}
            placeholder="Réf Clip..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 transition-all shadow-sm"
          />
        </div>
      </div>
    </form>
  );
}
