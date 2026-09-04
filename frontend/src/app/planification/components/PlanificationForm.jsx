import React, { useState, useEffect } from 'react';
import API from '../../../lib/api';
import { X, Calendar, User, AlignLeft, Layers, CheckCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlanificationForm({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    customer: '',
    priority: 'NORMAL',
    date_debut: '',
    date_fin: '',
    matricule_gl: '',
    matricule_superviseur: '',
    progress: 0
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const userRes = await API.get('/users/team');
      setUsers(userRes.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données de base.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialize = async () => {
        await loadData();
        if (initialData) {
          setFormData({
            title: initialData.title || '',
            project: initialData.project || '',
            customer: initialData.customer || '',
            priority: initialData.priority || 'NORMAL',
            date_debut: initialData.date_debut ? new Date(initialData.date_debut).toISOString().split('T')[0] : '',
            date_fin: initialData.date_fin ? new Date(initialData.date_fin).toISOString().split('T')[0] : '',
            matricule_gl: initialData.matricule_gl || '',
            matricule_superviseur: initialData.matricule_superviseur || '',
            progress: initialData.progress || 0
          });
        } else {
          setFormData({
            title: '', project: '', customer: '', priority: 'NORMAL',
            date_debut: '', date_fin: '', matricule_gl: '', matricule_superviseur: '', progress: 0
          });
        }
      };
      initialize();
    }
   
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (initialData) {
        await API.put(`/planifications/${initialData.id}`, formData);
      } else {
        await API.post('/planifications', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50 backdrop-blur-md">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                  <AlignLeft className="w-4 h-4 text-blue-600" />
                </div>
                {initialData ? 'Modifier la planification' : 'Nouvelle planification'}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-semibold flex items-center gap-3 shadow-sm">
                  <X className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form id="plan-form" onSubmit={handleSubmit} className="space-y-10">
                
                {/* Section 1: General Info */}
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider mb-6">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200 text-[10px]">1</span>
                    Informations Générales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre</label>
                      <input 
                        type="text" required 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                        placeholder="Ex: Prod Semaine 42" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priorité</label>
                      <select 
                        value={formData.priority} 
                        onChange={e => setFormData({...formData, priority: e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="LOW">Basse</option>
                        <option value="NORMAL">Normale</option>
                        <option value="HIGH">Haute</option>
                        <option value="CRITICAL">Critique</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projet</label>
                      <input 
                        type="text" 
                        value={formData.project} 
                        onChange={e => setFormData({...formData, project: e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                        placeholder="Nom du projet" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client</label>
                      <input 
                        type="text" 
                        value={formData.customer} 
                        onChange={e => setFormData({...formData, customer: e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                        placeholder="Nom du client" 
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progression ({formData.progress}%)</label>
                      </div>
                      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="10"
                          value={formData.progress} 
                          onChange={e => setFormData({...formData, progress: parseInt(e.target.value, 10)})} 
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full shadow-sm min-w-[3.5rem] text-center">
                          {formData.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Section 2: Planning dates */}
                  <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider mb-6">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center border border-purple-200 text-[10px]">2</span>
                      Planning
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Date de début
                        </label>
                        <input 
                          type="date" required 
                          value={formData.date_debut} 
                          onChange={e => setFormData({...formData, date_debut: e.target.value})} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors [color-scheme:light]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Date de fin
                        </label>
                        <input 
                          type="date" required 
                          value={formData.date_fin} 
                          onChange={e => setFormData({...formData, date_fin: e.target.value})} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors [color-scheme:light]" 
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Responsible team */}
                  <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider mb-6">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 text-[10px]">3</span>
                      Équipe Responsable
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <User className="w-3 h-3" /> Groupe Leader (GL)
                        </label>
                        <select 
                          required 
                          value={formData.matricule_gl} 
                          onChange={e => setFormData({...formData, matricule_gl: e.target.value})} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        >
                          <option value="">Sélectionner un GL...</option>
                          {users.filter(u => u.role === 'GL' || u.role === 'ADMIN').map(u => (
                            <option key={u.id} value={u.matricule}>{u.nom} ({u.matricule})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <User className="w-3 h-3" /> Superviseur
                        </label>
                        <select 
                          required 
                          value={formData.matricule_superviseur} 
                          onChange={e => setFormData({...formData, matricule_superviseur: e.target.value})} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        >
                          <option value="">Sélectionner un superviseur...</option>
                          {users.filter(u => u.role === 'SUPERVISEUR' || u.role === 'ADMIN').map(u => (
                            <option key={u.id} value={u.matricule}>{u.nom} ({u.matricule})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 backdrop-blur-md flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                form="plan-form"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 shadow-sm hover:shadow-md rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
