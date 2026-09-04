"use client";

import React, { useState } from "react";
import { Check, X, MessageSquare, User, Clock, CheckSquare, History } from "lucide-react";

export default function KhmCard({ 
  control, 
  isWriteAllowed, 
  onValidate, 
  onReject, 
  onHistoryClick 
}) {
  const isPending = control.etat === 'EN_ATTENTE';
  const isConform = control.etat === 'CONFORME';
  const isRejected = control.etat === 'NON_CONFORME';

  const [checklist, setChecklist] = useState({
    continuity: false,
    shortCircuit: false,
    crimping: false,
    visual: false
  });

  const toggleCheck = (key) => {
    if (!isPending || !isWriteAllowed) return;
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`bg-white border ${isConform ? 'border-emerald-200' : isRejected ? 'border-rose-200' : 'border-slate-200'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{control.panneau_id}</h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{control.panneau?.title_project || 'Sans Projet'}</p>
          </div>

          <span
            className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border whitespace-nowrap ${
              isConform
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isRejected
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isConform ? 'Conforme' : isRejected ? 'Non Conforme' : 'En Attente'}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="h-4 w-4 text-slate-400" />
              <span>{control.panneau?.superviseur?.nom || control.matricule_superviseur || '—'}</span>
            </div>
            {!isPending && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(control.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>

        

        {/* Checklist data unavailable in this version */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-xs text-slate-400 italic">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-blue-500" /> Points de contrôle
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
            {[
              { id: 'continuity', label: 'installation de clips' },
              { id: 'shortCircuit', label: 'ajustemont des sonsorteurs' },
              { id: 'crimping', label: 'achenement des fils' },
              { id: 'visual', label: 'Test' },
            ].map(item => (
              <label key={item.id} className={`flex items-center gap-2 ${isPending && isWriteAllowed ? 'cursor-pointer hover:text-slate-900' : 'opacity-75 cursor-default'} transition-colors`}>
                <input 
                  type="checkbox" 
                  checked={checklist[item.id] || !isPending} 
                  onChange={() => toggleCheck(item.id)}
                  disabled={!isPending || !isWriteAllowed}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={checklist[item.id] || !isPending ? 'text-slate-800 font-medium' : ''}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Comment */}
        {control.commentaire && (
          <div className={`flex gap-2 p-3 rounded-lg border text-sm italic ${
            isRejected ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
            <p className="text-xs leading-relaxed">« {control.commentaire} »</p>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <button 
          onClick={() => onHistoryClick(control.panneau_id)}
          className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-xs font-medium transition-colors"
        >
          <History className="w-4 h-4" /> Historique
        </button>

        {isPending && (
          <div className="flex gap-2">
            {isWriteAllowed ? (
              <>
                <button
                  onClick={() => onReject(control.id)}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                >
                  Rejeter
                </button>
                <button
                  onClick={() => onValidate(control.id)}
                  disabled={control.panneau?.etat_validation !== 'VALIDE'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    control.panneau?.etat_validation === 'VALIDE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title={
                    control.panneau?.etat_validation !== 'VALIDE'
                      ? "Le panneau doit d'abord être Validé avant d'être marqué Conforme KHM"
                      : ""
                  }
                >
                  Valider
                </button>
              </>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Admin / Sup requis</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
