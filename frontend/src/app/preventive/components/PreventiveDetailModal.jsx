"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, CheckCircle2, Circle, AlertCircle, FileText, User, Calendar, Clock, Activity } from 'lucide-react';
import { preventiveService } from '../services/preventiveService';
import StatusBadge from './common/StatusBadge';

export default function PreventiveDetailModal({ isOpen, onClose, plan, onRefresh, user }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState([]);
  
  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [observations, setObservations] = useState('');
  const [duration, setDuration] = useState('');

  const canEditStatus = ['ADMIN', 'GL', 'SUPERVISEUR', 'TL', 'TECHNICIEN'].includes(user?.role);
  // Optional: Check if technicien is exactly the one assigned, or supervisor

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await preventiveService.getById(plan.id);
        setDetails(res.data);
        setChecklist(res.data.checklistItems || []);
        setNewStatus(res.data.status);
        setObservations(res.data.observations || '');
        setDuration(res.data.duration || '');
      } catch (err) {
        setError("Impossible de charger les détails.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && plan?.id) {
      fetchDetails();
    }
  }, [isOpen, plan]);

  const handleChecklistChange = (index, status) => {
      const newItems = [...checklist];
      newItems[index].status = status;
      newItems[index].inspectionDate = new Date().toISOString();
      setChecklist(newItems);
  };

  const handleCommentChange = (index, comment) => {
      const newItems = [...checklist];
      newItems[index].comment = comment;
      setChecklist(newItems);
  }

  const handleSaveChecklist = async () => {
      try {
          setSaving(true);
          await preventiveService.updateChecklist(details.id, checklist);
          
          if (newStatus !== details.status) {
              await preventiveService.changeStatus(details.id, { 
                  status: newStatus,
                  observations,
                  duration
              });
          }

          onRefresh();
          onClose();
      } catch (err) {
          setError(err.message || "Erreur lors de la mise à jour.");
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
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Détails Plan: {plan?.code}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : error ? (
                 <div className="p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                    {error}
                 </div>
            ) : (
                <div className="space-y-6">
                    {/* Infos Générales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" /> Informations
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Machine:</span>
                                    <span className="font-medium text-slate-700">{details.machine?.nom} ({details.machine?.code})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Fréquence:</span>
                                    <span className="font-medium text-slate-700">{details.frequency}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                                    <span className="text-slate-500">Statut Actuel:</span>
                                    <StatusBadge status={details.status} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" /> Planning
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Technicien:</span>
                                    <span className="font-medium text-slate-700 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {details.technicien ? details.technicien.nom : 'Non assigné'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Dernière maint.:</span>
                                    <span className="font-medium text-slate-700">
                                        {details.lastMaintenanceDate ? new Date(details.lastMaintenanceDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Prochaine maint.:</span>
                                    <span className="font-medium text-indigo-600">
                                        {details.nextMaintenanceDate ? new Date(details.nextMaintenanceDate).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {details.description && (
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{details.description}</p>
                        </div>
                    )}

                    {/* Checklist Execution */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Checklist d&apos;Exécution
                            </h3>
                            <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                                {checklist.filter(c => c.status !== 'PENDING').length} / {checklist.length} complétés
                            </span>
                        </div>
                        
                        {checklist.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Aucune checklist définie pour cette maintenance.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {checklist.map((item, index) => (
                                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                            <p className="text-sm font-medium text-slate-700 flex-1">{item.description}</p>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button 
                                                    type="button"
                                                    disabled={!canEditStatus}
                                                    onClick={() => handleChecklistChange(index, 'OK')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${item.status === 'OK' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> OK
                                                </button>
                                                <button 
                                                    type="button"
                                                    disabled={!canEditStatus}
                                                    onClick={() => handleChecklistChange(index, 'NOK')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${item.status === 'NOK' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <AlertCircle className="w-3.5 h-3.5" /> NOK
                                                </button>
                                                <button 
                                                    type="button"
                                                    disabled={!canEditStatus}
                                                    onClick={() => handleChecklistChange(index, 'PENDING')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <Circle className="w-3.5 h-3.5" /> En attente
                                                </button>
                                            </div>
                                        </div>
                                        {canEditStatus && (
                                            <input 
                                                type="text"
                                                placeholder="Commentaire (optionnel)"
                                                value={item.comment || ''}
                                                onChange={(e) => handleCommentChange(index, e.target.value)}
                                                className="w-full mt-2 text-sm px-3 py-1.5 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        )}
                                        {!canEditStatus && item.comment && (
                                             <p className="text-xs text-slate-500 mt-1 italic">Note: {item.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Update & Completion */}
                    {canEditStatus && (
                        <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 mt-6">
                            <h3 className="text-sm font-semibold text-indigo-900 mb-4">Clôture & Avancement</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-indigo-800 mb-1">Mettre à jour le statut</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="PLANNED">Planifié</option>
                                        <option value="TO_DO">À Faire</option>
                                        <option value="IN_PROGRESS">En Cours</option>
                                        <option value="COMPLETED">Terminé (Clôturer le cycle)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-indigo-800 mb-1">Durée (Heures)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="Ex: 2.5"
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-indigo-800 mb-1">Observations Générales</label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    rows="2"
                                    placeholder="Remarques lors de l'exécution..."
                                    className="w-full text-sm px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {newStatus === 'COMPLETED' && (
                                <div className="mt-3 p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>En marquant comme <strong>Terminé</strong>, le cycle actuel sera clôturé, conservé dans l&apos;historique, et <strong>un nouveau plan sera automatiquement généré</strong> pour la prochaine date prévue selon la fréquence.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
            >
              Fermer
            </button>
            {canEditStatus && !loading && !error && (
                <button
                onClick={handleSaveChecklist}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer les modifications
                </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
