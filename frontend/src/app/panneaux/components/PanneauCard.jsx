"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, History, Box, Edit2, Trash2, ChevronRight, Eye, RefreshCw } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function PanneauCard({ panneau, isWriteAllowed, onHistoryClick, onEdit, onDelete, onView, isLoading }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: panneau.id, data: { ...panneau } });

  const [expanded, setExpanded] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stateWeight = {
    EN_CONSTRUCTION: 40,
    EN_VALIDATION: 80,
    KHM: 95,
    TERMINE: 100
  };

  const initials = panneau.superviseur?.nom
    ? panneau.superviseur.nom.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SV';

  const progress = stateWeight[panneau.etat_construction] || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white border ${isDragging ? 'border-blue-500 shadow-xl' : 'border-slate-200'} rounded-xl shadow-sm overflow-hidden flex flex-col group transition-shadow hover:shadow-md`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}
      {/* Header / Drag Handle */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          {isWriteAllowed && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-sm text-slate-900">{panneau.id}</h4>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">{panneau.title_project || "Sans Projet"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onView(panneau)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails">
            <Eye className="w-3.5 h-3.5" />
          </button>
          {isWriteAllowed && (
            <button onClick={() => onEdit(panneau)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isWriteAllowed && (
            <button onClick={() => onDelete(panneau)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Supprimer">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-4">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                panneau.etat_construction === 'TERMINE' ? 'bg-emerald-500' :
                panneau.etat_construction === 'KHM' ? 'bg-purple-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="VAL" status={panneau.etat_validation} type="validation" />
          <StatusBadge label="KHM" status={panneau.etat_khm} type="khm" />
        </div>

        {/* Stock Readiness (Collapsible) */}
        <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="w-full flex items-center justify-between p-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Stock Readiness</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          
          {expanded && (
            <div className="p-2 border-t border-slate-100 bg-white">
              {panneau.composants && panneau.composants.length > 0 ? (
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  {panneau.composants.map((comp, idx) => {
                    const isOk = comp.stock >= comp.requis;
                    const isWarn = comp.stock > 0 && comp.stock < comp.requis;
                    return (
                      <li key={idx} className="flex justify-between items-center">
                        <span className="truncate pr-2">{comp.nom}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          {comp.stock}/{comp.requis}
                          {isOk ? '✅' : isWarn ? '⚠' : '❌'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-[11px] text-slate-500 italic text-center py-2">
                  Stock readiness data unavailable
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 flex items-center justify-center border border-blue-200">
            {initials}
          </div>
          <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">{panneau.superviseur?.nom || 'Inconnu'}</span>
        </div>
        
        <button 
          onClick={() => onHistoryClick(panneau.id)}
          className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <History className="w-3.5 h-3.5" /> Hist.
        </button>
      </div>
    </div>
  );
}
