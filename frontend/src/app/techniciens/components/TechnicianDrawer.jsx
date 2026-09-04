'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Briefcase, Award, Wrench, CheckCircle2, Clock, AlertCircle, FileText, Settings, CalendarCheck, ShieldAlert, BookOpen } from 'lucide-react';
import StatusBadge from '@/app/preventive/components/common/StatusBadge'; 
import { UserAvatar } from '@/app/utilisateurs/components/UserAvatar';

const LEVEL_CONFIG = {
  0: { label: 'Not Trained', color: 'bg-slate-200', text: 'text-slate-500' },
  1: { label: 'Beginner', color: 'bg-yellow-400', text: 'text-yellow-700' },
  2: { label: 'Confirmed', color: 'bg-blue-500', text: 'text-blue-700' },
  3: { label: 'Expert', color: 'bg-emerald-500', text: 'text-emerald-700' },
};

export default function TechnicianDrawer({ tech, onClose, skillKeys = [] }) {
  if (!tech) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <AnimatePresence>
      {tech && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-slate-50 shadow-2xl z-50 flex flex-col overflow-hidden border-l border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative flex justify-center">
                  <UserAvatar 
                    user={{ photoUrl: tech.photoUrl, nom: tech.name, statut: tech.status }} 
                    size="xl" 
                    className="border-4 border-white shadow-md"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{tech.name}</h2>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{tech.position} • {tech.department}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Performance Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award size={16} className="text-indigo-500" /> Performance Interventions
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-slate-50">
                    <span className="text-2xl font-bold text-slate-800">{tech.performance?.totalInterventions || 0}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 mt-1">Total</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50">
                    <span className="text-2xl font-bold text-emerald-600">{tech.performance?.completedInterventions || 0}</span>
                    <span className="text-[10px] uppercase font-semibold text-emerald-600 mt-1">Terminées</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50">
                    <span className="text-2xl font-bold text-amber-600">{tech.performance?.activeInterventions || 0}</span>
                    <span className="text-[10px] uppercase font-semibold text-amber-600 mt-1">En cours</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-rose-50">
                    <span className="text-2xl font-bold text-rose-600">{tech.performance?.delayedInterventions || 0}</span>
                    <span className="text-[10px] uppercase font-semibold text-rose-600 mt-1">En retard</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-indigo-500" /> Compétences
                </h3>
                <div className="space-y-3">
                  {Object.keys(tech.skills || {}).length > 0 ? Object.entries(tech.skills).map(([name, s]) => {
                    const cfg = LEVEL_CONFIG[s.level] || LEVEL_CONFIG[0];
                    const pct = (s.level / 3) * 100;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm font-medium mb-1.5">
                          <span className="text-slate-700">{name}</span>
                          <span className={`${cfg.text} text-xs`}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.color.replace('bg-', 'bg-')}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  }) : <p className="text-sm text-slate-500 italic">Aucune compétence enregistrée.</p>}
                </div>
              </div>

              {/* Recent Interventions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Wrench size={16} className="text-indigo-500" /> Interventions Récentes
                </h3>
                <div className="space-y-3">
                  {tech.recentInterventions?.length > 0 ? tech.recentInterventions.map(int => (
                    <div key={int.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${int.type === 'Préventive' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          <Settings size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{int.code}</p>
                          <p className="text-xs text-slate-500">{int.machine?.nom || 'Sans machine'} • {formatDate(int.createdAt)}</p>
                        </div>
                      </div>
                      <StatusBadge status={int.status} />
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">Aucune intervention récente.</p>}
                </div>
              </div>

              {/* Preventive Plans */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CalendarCheck size={16} className="text-indigo-500" /> Plans Préventifs Assignés
                </h3>
                <div className="space-y-2">
                   {tech.preventiveMaintenances?.length > 0 ? tech.preventiveMaintenances.map(pm => (
                     <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{pm.code}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{pm.machine?.nom || '-'} • {pm.frequency}</p>
                        </div>
                        <StatusBadge status={pm.status} />
                     </div>
                   )) : <p className="text-sm text-slate-500 italic">Aucun plan préventif assigné.</p>}
                </div>
              </div>

              {/* Machines */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Settings size={16} className="text-indigo-500" /> Machines Suivies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tech.machines?.length > 0 ? tech.machines.map(m => (
                    <div key={m.id} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center gap-2 text-sm">
                       <span className="font-semibold text-slate-700">{m.code}</span>
                       <span className="text-slate-500">{m.nom}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">Aucune machine assignée.</p>}
                </div>
              </div>

              {/* Formations */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" /> Formations
                </h3>
                <div className="space-y-2">
                  {tech.formations?.length > 0 ? tech.formations.map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-sm">
                      {f.certStatus === 'Certified' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} className="text-amber-500" />}
                      <span className="text-slate-700 font-medium">{f.formationName}</span>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">Aucune formation.</p>}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
