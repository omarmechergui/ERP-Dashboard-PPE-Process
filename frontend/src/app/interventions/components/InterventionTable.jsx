"use client";

import React, { useState, useEffect, useRef } from "react";
import StatusBadge from "../../../components/ui/StatusBadge";
import EmptyState from "../../../components/ui/EmptyState";
import { MoreVertical, Wrench, Clock, User, Eye, Edit2, Copy, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function InterventionTable({ 
  interventions, 
  loading,
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onChangeStatus 
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  // Close menu on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleMenu = (id) => {
    setActiveMenu(prev => prev === id ? null : id);
  };

  // Loading skeleton that preserves table structure
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="h-12 bg-secondary/50 border-b border-border" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 border-b border-border flex items-center px-6 gap-6 animate-pulse">
            <div className="h-3.5 bg-secondary rounded w-[80px]" />
            <div className="h-3.5 bg-secondary rounded w-[120px]" />
            <div className="h-3.5 bg-secondary rounded w-[140px]" />
            <div className="h-3.5 bg-secondary rounded w-[60px]" />
            <div className="h-5 bg-secondary rounded-full w-[50px]" />
            <div className="h-3.5 bg-secondary rounded w-[100px]" />
            <div className="h-3.5 bg-secondary rounded w-[60px]" />
            <div className="h-5 bg-secondary rounded-full w-[70px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!interventions || interventions.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Aucune intervention trouvée"
        message="Aucune intervention ne correspond aux critères actuels. Ajustez vos filtres ou créez une nouvelle intervention."
      />
    );
  }

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'en attente' || s === 'waiting') return 'En attente';
    if (s === 'en cours' || s === 'in progress') return 'En cours';
    if (s.includes('termin') || s === 'completed' || s.includes('clôtur')) return 'Clôturée';
    if (s === 'cancelled' || s.includes('annul')) return 'Annulée';
    if (s === 'planned' || s.includes('planifi')) return 'Planifiée';
    return status || 'Inconnu';
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] whitespace-nowrap">
          <thead className="bg-secondary/50 text-secondary-foreground font-semibold border-b border-border">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Machine / Panneau</th>
              <th className="px-5 py-3.5">Défaut</th>
              <th className="px-5 py-3.5">Technicien</th>
              <th className="px-5 py-3.5">KPI</th>
              <th className="px-5 py-3.5">Temps</th>
              <th className="px-5 py-3.5">Shift</th>
              <th className="px-5 py-3.5 text-center">Statut</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {interventions.map((int) => (
              <tr 
                key={int.id} 
                className="hover:bg-secondary/30 transition-colors duration-150 group"
              >
                {/* Code - primary visual weight */}
                <td className="px-5 py-3 font-semibold text-foreground">{int.code || "—"}</td>
                
                {/* Machine */}
                <td className="px-5 py-3 text-secondary-foreground max-w-[150px] truncate" title={int.machine?.nom || int.panneau || "—"}>
                  {int.machine?.nom || int.panneau || "—"}
                </td>
                
                {/* Défaut - truncated with tooltip */}
                <td className="px-5 py-3 text-secondary-foreground max-w-[200px] truncate" title={int.defaut}>
                  {int.defaut || "—"}
                </td>
                
                {/* Technicien */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <User className="w-3.5 h-3.5 text-muted" />
                    <span>{int.technicien?.nom || "—"}</span>
                  </div>
                </td>
                
                {/* KPI Badge - compact */}
                <td className="px-5 py-3">
                  {int.kpiType === 'MTTR' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      MTTR
                    </span>
                  ) : int.kpiType === 'MTBF' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MTBF
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-muted">—</span>
                  )}
                </td>
                
                {/* Temps */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <span>{int.downtime ? `${int.downtime} min` : "—"}</span>
                  </div>
                </td>
                
                {/* Shift */}
                <td className="px-5 py-3 text-secondary-foreground capitalize">{int.shift || "—"}</td>
                
                {/* Statut */}
                <td className="px-5 py-3 text-center">
                  <StatusBadge status={getStatusLabel(int.status)} />
                </td>
                
                {/* Actions */}
                <td className="px-5 py-3 text-right relative" ref={activeMenu === int.id ? menuRef : null}>
                  <button 
                    onClick={() => toggleMenu(int.id)}
                    className="p-1.5 rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`Actions pour ${int.code}`}
                    aria-expanded={activeMenu === int.id}
                    aria-haspopup="true"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeMenu === int.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div 
                        className="absolute right-5 top-10 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-20 text-left animate-fade-in"
                        role="menu"
                      >
                        <button 
                          onClick={() => { onView && onView(int); setActiveMenu(null); }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2.5 transition-colors"
                          role="menuitem"
                        >
                          <Eye className="w-4 h-4 text-muted" /> Voir détails
                        </button>
                        <button 
                          onClick={() => { onEdit && onEdit(int); setActiveMenu(null); }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2.5 transition-colors"
                          role="menuitem"
                        >
                          <Edit2 className="w-4 h-4 text-muted" /> Modifier
                        </button>
                        <button 
                          onClick={() => { onDuplicate && onDuplicate(int); setActiveMenu(null); }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 flex items-center gap-2.5 transition-colors"
                          role="menuitem"
                        >
                          <Copy className="w-4 h-4 text-muted" /> Dupliquer
                        </button>
                        <hr className="my-1 border-border" />
                        <button 
                          onClick={() => { onChangeStatus && onChangeStatus(int.id, 'Clôturée'); setActiveMenu(null); }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-success hover:bg-success/5 flex items-center gap-2.5 transition-colors"
                          role="menuitem"
                        >
                          <CheckCircle className="w-4 h-4" /> Marquer terminé
                        </button>
                        <button 
                          onClick={() => { onDelete && onDelete(int.id); setActiveMenu(null); }} 
                          className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 flex items-center gap-2.5 transition-colors"
                          role="menuitem"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
