import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, UserPlus } from 'lucide-react';
import API from '@/lib/api';

const emptyForm = {
  matricule: '',
  nom: '',
  email: '',
  mot_de_passe: '',
  department: '',
  position: 'Technicien',
  statut: 'ACTIF',
  role: 'TECHNICIEN'
};

export default function NewTechnicianModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({ ...emptyForm });
    setApiError(null);
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.matricule || !formData.nom || !formData.email || !formData.mot_de_passe) {
      setApiError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    if (formData.mot_de_passe.length < 6) {
      setApiError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const response = await API.post('/users', formData);
      if (response.data) {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setApiError(err.error || err.message || 'Une erreur est survenue lors de la création.');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!saving ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Nouveau Technicien
            </h2>
            <button 
              onClick={onClose}
              disabled={saving}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {apiError}
              </div>
            )}
            
            <form id="tech-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Matricule <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ex: TCH-001" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nom Complet <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ex: Jean Dupont" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="jean.dupont@entreprise.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mot de passe <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    name="mot_de_passe"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    required
                    minLength="6"
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Minimum 6 caractères" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Département</label>
                  <select 
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="">Sélectionner un département</option>
                    <option value="Production">Production</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Qualité">Qualité</option>
                    <option value="Logistique">Logistique</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select 
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                  </select>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="tech-form"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : 'Enregistrer'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
