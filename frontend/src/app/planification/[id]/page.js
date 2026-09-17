"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { usePlanification } from '../hooks/usePlanification';
import { 
  ArrowLeft, Calendar, User, FileText, CheckCircle2, Package, 
  PlayCircle, AlertCircle, Clock, Search, ExternalLink 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatusBadge from '../../../components/ui/StatusBadge';
import ProgressBar from '../../../components/ui/ProgressBar';
import Link from 'next/link';

export default function PlanificationDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  
  const { getPlanificationById, planifier, startProduction, cancelPlanification, completePlanification, getHistory, loading } = usePlanification();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const p = await getPlanificationById(id);
      setData(p);
      const h = await getHistory(id);
      setHistory(h || []);
    } catch (err) {
      console.error(err);
    }
  }, [id, getPlanificationById, getHistory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleComplete = async () => {
    if (confirm("Voulez-vous vraiment terminer la production ?")) {
      try {
        await completePlanification(id);
        fetchData();
      } catch (err) {
        alert("Erreur: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handlePlanifier = async () => {
    try {
      await planifier(id);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la planification: " + (err.response?.data?.error || err.message));
    }
  };

  const handleStart = async () => {
    if (confirm("Voulez-vous vraiment lancer la production pour cette planification ?")) {
      try {
        await startProduction(id);
        fetchData();
      } catch (err) {
        alert("Erreur: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) return alert("Veuillez saisir un motif");
    try {
      await cancelPlanification(id, cancelReason);
      setIsCancelModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Erreur: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-24 p-6 animate-pulse">
        <div className="h-16 bg-white rounded-xl mb-6"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-xl"></div>
          <div className="h-96 bg-white rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="flex h-screen items-center justify-center text-rose-500">Planification introuvable.</div>;
  }

  const isBrouillon = data.status === 'BROUILLON';
  const isPlanifiee = data.status === 'PLANIFIEE';
  const isEnProd = data.status === 'EN_PRODUCTION';
  const isTerminee = data.status === 'TERMINEE';
  const isAnnulee = data.status === 'ANNULEE';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/planification')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{data.reference}</h1>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">{data.title}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {(isBrouillon || isPlanifiee) && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              Annuler
            </button>
          )}

          {isBrouillon && (
            <button
              onClick={handlePlanifier}
              className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Confirmer la planification
            </button>
          )}

          {isPlanifiee && (
            <button
              onClick={handleStart}
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" /> Lancer la production
            </button>
          )}

          {isEnProd && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Terminer la production
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* LEFT COLUMN: Summary & Panneaux */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Détails de la planification</h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projet</p>
                <p className="text-sm font-semibold text-slate-900">{data.project || '—'}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client</p>
                <p className="text-sm font-semibold text-slate-900">{data.customer || '—'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">BOM / Nomenclature</p>
                {data.bom ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{data.bom.nom_projet}</p>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                      Jig: {data.bom.jig}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Aucun BOM assigné</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantité prévue</p>
                <p className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100">
                  {data.quantite} panneaux
                </p>
              </div>

              <div className="col-span-2 border-t border-slate-100 my-2" />

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Période Prévue</p>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(data.date_debut), 'dd MMM yyyy', { locale: fr })}
                  </div>
                  <span className="text-slate-400">à</span>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(data.date_fin), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="col-span-2 border-t border-slate-100 my-2" />

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group Leader</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <User className="w-4 h-4 text-slate-400" />
                  {data.gl?.nom || '—'}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Superviseur</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <User className="w-4 h-4 text-slate-400" />
                  {data.superviseur?.nom || '—'}
                </div>
              </div>
            </div>
            
            {data.description && (
              <div className="bg-slate-50 p-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Notes</p>
                <p className="text-sm text-slate-700">{data.description}</p>
              </div>
            )}
            
            {isAnnulee && data.cancellation_reason && (
              <div className="bg-rose-50 p-6 border-t border-rose-100">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Motif d'annulation
                </p>
                <p className="text-sm font-medium text-rose-800">{data.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Panneaux Section (Only relevant if in prod or finished) */}
          {(isEnProd || isTerminee) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Production des panneaux</h2>
                  <p className="text-sm text-slate-500 mt-1">Avancement en temps réel (basé sur le statut des panneaux)</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-800">{data.progress}%</p>
                  <p className="text-xs font-bold text-slate-500">PROGRES GLOBAL</p>
                </div>
              </div>

              <div className="p-6">
                <ProgressBar progress={data.progress} height="h-3" />
                
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
                    <p className="text-2xl font-black text-slate-800">{data.panneauxSummary?.total || 0}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs font-bold text-amber-600 uppercase">Construction</p>
                    <p className="text-2xl font-black text-amber-700">{data.panneauxSummary?.en_construction || 0}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase">Validation</p>
                    <p className="text-2xl font-black text-blue-700">{data.panneauxSummary?.en_validation || 0}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-600 uppercase">Terminés</p>
                    <p className="text-2xl font-black text-emerald-700">{data.panneauxSummary?.termine || 0}</p>
                  </div>
                </div>

                {/* Panneaux List */}
                {data.panneaux && data.panneaux.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Liste des panneaux liés</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {data.panneaux.map((panneau) => (
                        <Link key={panneau.id} href={`/panneaux`} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                           <div>
                             <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{panneau.title_panneau}</p>
                             <p className="text-[10px] text-slate-500 font-mono mt-0.5">{panneau.id}</p>
                           </div>
                           <StatusBadge status={panneau.etat_construction} className="scale-75 origin-right" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Timeline & Actions */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Cycle de vie</h3>
            
            <div className="relative pl-6 space-y-8">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
              
              {/* BROUILLON */}
              <div className="relative z-10">
                <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
                  isAnnulee ? 'bg-slate-300' : 'bg-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-bold ${isAnnulee ? 'text-slate-400' : 'text-slate-800'}`}>Brouillon</p>
                  <p className="text-xs text-slate-500 mt-1">En cours de configuration</p>
                </div>
              </div>

              {/* PLANIFIEE */}
              <div className="relative z-10">
                <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
                  isPlanifiee || isEnProd || isTerminee ? 'bg-blue-500' : 'bg-slate-200'
                }`} />
                <div>
                  <p className={`text-sm font-bold ${isPlanifiee || isEnProd || isTerminee ? 'text-slate-800' : 'text-slate-400'}`}>Planifiée</p>
                  <p className="text-xs text-slate-500 mt-1">Prête à être lancée</p>
                </div>
              </div>

              {/* EN PRODUCTION */}
              <div className="relative z-10">
                <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
                  isEnProd || isTerminee ? 'bg-amber-500' : 'bg-slate-200'
                }`} />
                <div>
                  <p className={`text-sm font-bold ${isEnProd || isTerminee ? 'text-amber-600' : 'text-slate-400'}`}>En Production</p>
                  <p className="text-xs text-slate-500 mt-1">Fabrication des panneaux en cours</p>
                </div>
              </div>

              {/* TERMINEE */}
              <div className="relative z-10">
                <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-white ${
                  isTerminee ? 'bg-emerald-500' : 'bg-slate-200'
                }`} />
                <div>
                  <p className={`text-sm font-bold ${isTerminee ? 'text-emerald-600' : 'text-slate-400'}`}>Terminée</p>
                  <p className="text-xs text-slate-500 mt-1">Objectif de production atteint</p>
                </div>
              </div>

            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Historique
            </h3>
            
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Aucun historique disponible.</p>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {h.action.includes('ANNULEE') ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> :
                       h.action.includes('TERMINEE') ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
                       <Clock className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{h.action}</p>
                      {h.details && <p className="text-xs text-slate-600 mt-0.5">{h.details}</p>}
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {format(new Date(h.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })} • par {h.performed_by?.nom || 'Système'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative z-10 p-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Annuler la planification
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Veuillez indiquer la raison de l'annulation. Cette action est irréversible.
            </p>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none mb-6"
              rows={4}
              placeholder="Ex: Changement de priorité client..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Retour
              </button>
              <button 
                onClick={handleCancel}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
