/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { preventiveService } from '../services/preventiveService';
import API from '../../../lib/api';

export default function PreventiveModal({ isOpen, onClose, onSuccess, plan }) {
  const [formData, setFormData] = useState({
    machineId: '',
    technicienId: '',
    frequency: 'MONTHLY',
    status: 'PLANNED',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    description: '',
    observations: '',
    duration: '',
    checklistItems: []
  });

  const [machines, setMachines] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const isEditing = !!(plan && plan.id);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        setLoading(true);
        const [macRes, techRes] = await Promise.all([
          API.get('/maintenance/machines'),
          API.get('/maintenance/techniciens')
        ]);
        setMachines(macRes.data.data || []);
        setTechnicians(techRes.data.data?.techniciens || techRes.data.data || []);
      } catch (err) {
        console.error("Erreur chargement listes:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      fetchSelectData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (plan) {
      setFormData({
        machineId: plan.machineId || '',
        technicienId: plan.technicienId || '',
        frequency: plan.frequency || 'MONTHLY',
        status: plan.status || 'PLANNED',
        lastMaintenanceDate: plan.lastMaintenanceDate ? new Date(plan.lastMaintenanceDate).toISOString().slice(0, 10) : '',
        nextMaintenanceDate: plan.nextMaintenanceDate ? new Date(plan.nextMaintenanceDate).toISOString().slice(0, 10) : '',
        description: plan.description || '',
        observations: plan.observations || '',
        duration: plan.duration || '',
        checklistItems: plan.checklistItems ? plan.checklistItems.map(item => ({ id: item.id, description: item.description })) : []
      });
    } else {
      setFormData({
        machineId: '',
        technicienId: '',
        frequency: 'MONTHLY',
        status: 'PLANNED',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        description: '',
        observations: '',
        duration: '',
        checklistItems: []
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChecklistItem = () => {
      setFormData(prev => ({
          ...prev,
          checklistItems: [...prev.checklistItems, { id: Date.now(), description: '' }] // Temporary ID for new items
      }));
  };

  const handleChecklistChange = (index, value) => {
      const newItems = [...formData.checklistItems];
      newItems[index].description = value;
      setFormData(prev => ({ ...prev, checklistItems: newItems }));
  };

  const handleRemoveChecklistItem = (index) => {
      const newItems = [...formData.checklistItems];
      newItems.splice(index, 1);
      setFormData(prev => ({ ...prev, checklistItems: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.lastMaintenanceDate) delete dataToSubmit.lastMaintenanceDate;
      if (!dataToSubmit.nextMaintenanceDate) delete dataToSubmit.nextMaintenanceDate;

      // Filter out empty checklist items
      dataToSubmit.checklistItems = dataToSubmit.checklistItems.filter(item => item.description.trim() !== '');

      if (isEditing) {
        await preventiveService.update(plan.id, dataToSubmit);
      } else {
        await preventiveService.create(dataToSubmit);
      }
      onSuccess();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? `Modifier Plan ${plan.code}` : "Nouveau Plan de Maintenance"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Machine *</label>
                <select
                  name="machineId"
                  value={formData.machineId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner une machine</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.nom}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Technicien *</label>
                <select
                  name="technicienId"
                  value={formData.technicienId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Sélectionner un technicien</option>
                  {(Array.isArray(technicians) ? technicians : []).map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.nom}</option>
                    ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Fréquence *</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="DAILY">Quotidienne</option>
                  <option value="WEEKLY">Hebdomadaire</option>
                  <option value="MONTHLY">Mensuelle</option>
                  <option value="QUARTERLY">Trimestrielle</option>
                  <option value="SEMI_ANNUALLY">Semestrielle</option>
                  <option value="ANNUALLY">Annuelle</option>
                </select>
              </div>

              {isEditing && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="PLANNED">Planifié</option>
                    <option value="TO_DO">À Faire</option>
                    <option value="IN_PROGRESS">En Cours</option>
                    <option value="OVERDUE">En Retard</option>
                    {/* Exclude COMPLETED, should use detail modal for that */}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Dernière Maintenance</label>
                    <input
                        type="date"
                        name="lastMaintenanceDate"
                        value={formData.lastMaintenanceDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Prochaine Maintenance</label>
                    <input
                        type="date"
                        name="nextMaintenanceDate"
                        value={formData.nextMaintenanceDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Laissé vide, sera calculé automatiquement</p>
                </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Détails du plan de maintenance..."
              />
            </div>

            {isEditing && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Observations (en cas de complétion partielle)</label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
            )}

            {/* Checklist Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800">Checklist</label>
                    <button 
                        type="button" 
                        onClick={handleAddChecklistItem}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Ajouter un élément
                    </button>
                </div>
                
                {formData.checklistItems.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Aucune checklist définie pour ce plan.</p>
                )}

                <div className="space-y-2">
                    {formData.checklistItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleChecklistChange(index, e.target.value)}
                                placeholder="Description de l'action à vérifier..."
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveChecklistItem(index)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

          </form>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
