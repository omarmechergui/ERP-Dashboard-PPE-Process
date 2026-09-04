import React, { useState, useEffect } from 'react';
import API from '../../../lib/api';
import { X, Clock, Plus, Pencil, Trash2, ArrowRightLeft, TrendingUp, Loader2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_CONFIG = {
  CREATE: {
    label: 'Création',
    icon: Plus,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    line: 'bg-emerald-400',
  },
  UPDATE: {
    label: 'Modification',
    icon: Pencil,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    line: 'bg-blue-400',
  },
  DELETE: {
    label: 'Suppression',
    icon: Trash2,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    border: 'border-rose-200',
    line: 'bg-rose-400',
  },
  STATUS_CHANGE: {
    label: 'Changement de statut',
    icon: ArrowRightLeft,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    line: 'bg-amber-400',
  },
  PROGRESSION_CHANGE: {
    label: 'Progression',
    icon: TrendingUp,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    line: 'bg-purple-400',
  },
};

function getConfig(action) {
  return ACTION_CONFIG[action] || ACTION_CONFIG.UPDATE;
}

function ValueBadge({ value, variant = 'old' }) {
  if (!value) return null;
  const style = variant === 'old'
    ? 'bg-slate-100 text-slate-600 border-slate-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${style} max-w-[160px] truncate`}>
      {value}
    </span>
  );
}

function formatValue(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(parsed);
  } catch {
    return raw;
  }
}

export default function PlanificationHistoryModal({ isOpen, onClose, planificationId, planificationTitle }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && planificationId) {
      const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await API.get(`/planifications/${planificationId}/history`);
          setHistory(res.data);
        } catch {
          setError("Erreur lors du chargement de l\u2019historique.");
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, planificationId]);

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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                Historique
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subtitle */}
            {planificationTitle && (
              <div className="px-8 pt-4 pb-2">
                <p className="text-sm font-semibold text-slate-500">
                  Planification : <span className="text-slate-800">{planificationTitle}</span>
                </p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Chargement de l&apos;historique…</p>
                </div>
              )}

              {error && !loading && (
                <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-semibold">
                  {error}
                </div>
              )}

              {!loading && !error && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Aucun historique trouvé</p>
                  <p className="text-xs text-slate-400">Les modifications apportées apparaîtront ici.</p>
                </div>
              )}

              {!loading && !error && history.length > 0 && (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-slate-200" />

                  <div className="space-y-6">
                    {history.map((entry, index) => {
                      const config = getConfig(entry.action);
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="relative flex gap-4"
                        >
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 ${config.bg} ${config.border} flex-shrink-0 shadow-sm`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>

                          {/* Content card */}
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg} ${config.border} ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {format(new Date(entry.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                              </span>
                            </div>

                            {/* Description */}
                            {entry.description && (
                              <p className="text-sm text-slate-700 font-medium mb-2">{entry.description}</p>
                            )}

                            {/* Old → New Values */}
                            {(entry.oldValue || entry.newValue) && (
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {entry.oldValue && (
                                  <ValueBadge value={formatValue(entry.oldValue)} variant="old" />
                                )}
                                {entry.oldValue && entry.newValue && (
                                  <span className="text-slate-400 font-bold">→</span>
                                )}
                                {entry.newValue && (
                                  <ValueBadge value={formatValue(entry.newValue)} variant="new" />
                                )}
                              </div>
                            )}

                            {/* User */}
                            {entry.user && (
                              <p className="text-[11px] text-slate-400 font-medium mt-2">
                                Par <span className="text-slate-600 font-semibold">{entry.user.nom}</span>
                                {entry.user.matricule && <span className="ml-1">({entry.user.matricule})</span>}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                {history.length} {history.length === 1 ? 'entrée' : 'entrées'}
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
