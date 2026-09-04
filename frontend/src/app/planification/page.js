'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Plus, LayoutDashboard, CalendarDays, Edit, Trash2, ClipboardList, AlertTriangle, X, Clock } from 'lucide-react';
import { usePlanification } from './hooks/usePlanification';
import PlanificationDashboard from './components/PlanificationDashboard';
import GanttView from './components/GanttView';
import PlanificationForm from './components/PlanificationForm';
import StatusBadge from './components/StatusBadge';
import ProgressBar from './components/ProgressBar';
import UserAvatar from './components/UserAvatar';
import PlanificationHistoryModal from './components/PlanificationHistoryModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 border border-slate-200 rounded-2xl" />
        ))}
      </div>
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-100 border border-slate-200 rounded-2xl" />
      </div>
      {/* Table Skeleton */}
      <div className="bg-slate-100/40 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="h-14 bg-slate-100/60 border-b border-slate-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-slate-200 flex items-center gap-4 px-6">
            <div className="h-4 bg-slate-200 rounded-full w-1/4" />
            <div className="h-3 bg-slate-200 rounded-full w-32" />
            <div className="ml-auto h-6 bg-slate-200 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ isOpen, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl p-8 max-w-sm w-full"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-900/30 border border-rose-700/50 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Confirmer la suppression</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Cette action est irréversible. La planification et ses données associées seront définitivement supprimées.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-700 border border-slate-200 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] rounded-xl transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Toast Notification ────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = type === 'error'
    ? 'bg-rose-950/90 border-rose-700/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
    : 'bg-emerald-950/90 border-emerald-700/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md font-semibold text-sm ${styles}`}
    >
      {type === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <span className="w-5 h-5 flex-shrink-0 text-xl">✓</span>}
      {message}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreateClick, isWriteAllowed }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6 shadow-xl">
        <ClipboardList className="w-10 h-10 text-slate-600" />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">Aucune planification trouvée</h3>
      <p className="text-sm text-slate-600 max-w-xs leading-relaxed mb-8">
        Commencez par créer un plan de production pour suivre l&apos;avancement de vos projets.
      </p>
      {isWriteAllowed && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-blue-500"
        >
          <Plus className="w-5 h-5" />
          Créer une planification
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PlanificationPage() {
  const { user } = useAuth();
  const {
    dashboardStats,
    planifications,
    loading,
    error,
    loadDashboard,
    deletePlanification
  } = usePlanification();

  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'GANTT'
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // ID to delete
  const [historyTarget, setHistoryTarget] = useState(null); // { id, title } for history modal
  const [toast, setToast] = useState(null); // { message, type }

  const isWriteAllowed = user && ['ADMIN', 'GL'].includes(user.role);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setFormOpen(true);
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormOpen(true);
  };

  const handleDeleteRequest = (id) => {
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    const result = await deletePlanification(deleteTarget);
    if (result?.success === false) {
      showToast(result.error || 'Erreur lors de la suppression.', 'error');
    } else {
      showToast('Planification supprimée avec succès.');
    }
    setDeleteTarget(null);
  };

  const handleFormSuccess = () => {
    loadDashboard(true);
    showToast(selectedPlan ? 'Planification mise à jour.' : 'Planification créée avec succès.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">

        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.7)]" />
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Planification Production</h1>
            </div>
            <p className="text-slate-600 font-medium text-sm ml-5 pl-0.5">
              Supervision MES · Gestion des plans de production Kanban
            </p>
          </div>

          {isWriteAllowed && (
            <button
              onClick={handleCreate}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] border border-blue-500"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Planification
            </button>
          )}
        </motion.div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200/50 font-semibold text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading Skeleton or Content ── */}
        {loading && !dashboardStats ? (
          <SkeletonLoader />
        ) : (
          <>
            {/* ── Dashboard ── */}
            {dashboardStats && (
              <PlanificationDashboard
                stats={dashboardStats.stats}
                statusDistribution={dashboardStats.statusDistribution}
                timelineData={dashboardStats.timeline}
              />
            )}

            {/* ── Main Panel ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Tab Bar */}
              <div className="flex items-center gap-2 p-3 border-b border-slate-200 bg-white">
                {[
                  { mode: 'TABLE', label: 'Vue Liste', Icon: LayoutDashboard },
                  { mode: 'GANTT', label: 'Vue Gantt', Icon: CalendarDays },
                ].map(({ mode, label, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Table View ── */}
              {viewMode === 'TABLE' && (
                <div className="overflow-x-auto">
                  {planifications.length === 0 ? (
                    <EmptyState onCreateClick={handleCreate} isWriteAllowed={isWriteAllowed} />
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                          <th className="px-6 py-4">Planification</th>
                          <th className="px-6 py-4">Projet</th>
                          <th className="px-6 py-4">Progression</th>
                          <th className="px-6 py-4">Responsables</th>
                          <th className="px-6 py-4">Deadline</th>
                          <th className="px-6 py-4">Statut</th>
                          {isWriteAllowed && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {planifications.map((plan, index) => (
                          <motion.tr
                            key={plan.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-200 group"
                          >
                            {/* Planification Title */}
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm leading-tight">{plan.title}</div>
                              {plan.priority && (
                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                                  plan.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                  plan.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                  plan.priority === 'NORMAL' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {plan.priority}
                                </span>
                              )}
                            </td>

                            {/* Projet & Client */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-800">{plan.project || '—'}</div>
                              <div className="text-xs text-slate-600 mt-0.5">{plan.customer || ''}</div>
                            </td>



                            {/* Progress */}
                            <td className="px-6 py-4">
                              <ProgressBar progress={plan.progress} />
                            </td>

                            {/* Responsables */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {plan.gl && <UserAvatar user={plan.gl} label="GL" />}
                                {plan.superviseur && <UserAvatar user={plan.superviseur} label="SUP" />}
                              </div>
                            </td>

                            {/* Deadline */}
                            <td className="px-6 py-4">
                              {plan.date_fin ? (
                                <>
                                  <div className={`text-sm font-bold ${plan.isDelayed ? 'text-rose-400' : 'text-slate-800'}`}>
                                    {format(new Date(plan.date_fin), 'dd MMM yyyy', { locale: fr })}
                                  </div>
                                  {plan.isDelayed && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                      <AlertTriangle className="w-3 h-3" /> En retard
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-600 text-sm">N/A</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <StatusBadge status={plan.status} />
                            </td>

                            {/* Actions */}
                            {isWriteAllowed && (
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <button
                                    onClick={() => setHistoryTarget({ id: plan.id, title: plan.title })}
                                    title="Historique"
                                    className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all border border-transparent hover:border-purple-200"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(plan)}
                                    title="Modifier"
                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all border border-transparent hover:border-blue-200"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRequest(plan.id)}
                                    title="Supprimer"
                                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all border border-transparent hover:border-rose-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ── Gantt View ── */}
              {viewMode === 'GANTT' && (
                <div className="p-6">
                  <GanttView planifications={planifications} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ── Modals & Overlays ── */}
      <PlanificationForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={selectedPlan}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <PlanificationHistoryModal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        planificationId={historyTarget?.id}
        planificationTitle={historyTarget?.title}
      />

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
