"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus, RefreshCw, AlertCircle, LayoutDashboard, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { usePanneaux } from "./hooks/usePanneaux";

import KanbanBoard from "./components/KanbanBoard";
import PanneauFilters from "./components/PanneauFilters";
import CreatePanneauModal from "./components/CreatePanneauModal";
import EditPanneauModal from "./components/EditPanneauModal";
import DetailPanneauModal from "./components/DetailPanneauModal";
import HistoryModal from "./components/HistoryModal";

// --- Sub-components for UI ---
const Toast = ({ show, type, message, onClose }) => {
  if (!show) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-bottom-5 ${isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
      {isSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
    </div>
  );
};

const AdminOverrideModal = ({ isOpen, onClose, onSubmit, destColumn }) => {
  const [reason, setReason] = useState("");
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">Déplacement Forcé</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Vous forcez un déplacement vers <strong>{destColumn}</strong> (non séquentiel ou retour en arrière). Veuillez justifier ce changement.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif de forçage..."
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none mb-6 min-h-[100px]"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Annuler
            </button>
            <button
              onClick={() => { if(reason.trim()) onSubmit(reason); }}
              disabled={!reason.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              Forcer le déplacement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const STAGES = ['EN_CONSTRUCTION', 'EN_VALIDATION', 'KHM', 'TERMINE'];

export default function PanneauxPage() {
  const { user } = useAuth();
  const isWriteAllowed = user && ["ADMIN", "SUPERVISEUR"].includes(user.role);
  const isAdmin = user?.role === 'ADMIN';

  const {
    panneaux,
    setPanneaux,
    boms,
    entrepots,
    supervisors,
    loading: dataLoading,
    error,
    fetchAll,
    updatePanneauStatus,
    createPanneau,
    updatePanneau,
    deletePanneau,
    getPanneauDetails
  } = usePanneaux();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  // UI State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, panneau: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, panneauId: null });
  const [historyModalState, setHistoryModalState] = useState({ isOpen: false, panneauId: null });
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const [loadingPanneauId, setLoadingPanneauId] = useState(null);
  
  const [overrideModal, setOverrideModal] = useState({ show: false, panneauId: null, destColumn: null });

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  }, []);

  // Filter Logic
  const filteredPanneaux = useMemo(() => {
    return panneaux.filter(p => {
      if (selectedProject && p.title_project !== selectedProject) return false;
      if (selectedSupervisor && (p.superviseur_id != selectedSupervisor && p.superviseur?.matricule != selectedSupervisor && p.superviseur?.id != selectedSupervisor)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchId = p.id ? String(p.id).toLowerCase().includes(query) : false;
        const matchTitle = p.title_panneau ? String(p.title_panneau).toLowerCase().includes(query) : false;
        if (!matchId && !matchTitle) return false;
      }
      return true;
    });
  }, [panneaux, selectedProject, selectedSupervisor, searchQuery]);

  // Execute actual API update (Non-optimistic)
  const performStatusUpdate = useCallback(async (panneauId, destColumn, reason = null) => {
    setLoadingPanneauId(panneauId);
    try {
      const payload = { etat_construction: destColumn };
      if (reason) {
        payload.reason = reason;
      }
      await updatePanneauStatus(panneauId, payload);
      showToast('success', `Panneau déplacé vers ${destColumn}`);
      // UI updates automatically because updatePanneauStatus updates context state
    } catch (err) {
      showToast('error', err.error || "Erreur lors du déplacement du panneau");
    } finally {
      setLoadingPanneauId(null);
    }
  }, [updatePanneauStatus, showToast]);

  // Drag and Drop Logic
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    if (!over) return;

    const panneauId = active.id;
    const panneau = panneaux.find(p => String(p.id) === String(panneauId));
    if (!panneau) return;

    const overPanneau = panneaux.find(p => String(p.id) === String(over.id));
    const destColumn = overPanneau ? overPanneau.etat_construction : over.id;
    
    if (!STAGES.includes(destColumn) || panneau.etat_construction === destColumn) return;

    const currIdx = STAGES.indexOf(panneau.etat_construction);
    const destIdx = STAGES.indexOf(destColumn);
    const isSequential = destIdx === currIdx + 1;

    if (!isSequential) {
      if (!isAdmin) {
        showToast('error', "Seul un administrateur peut forcer ce déplacement.");
        return; // DndKit naturally snaps back because state didn't change
      } else {
        // Pause and ask for reason
        setOverrideModal({ show: true, panneauId, destColumn });
        return;
      }
    }

    // Standard sequential move
    await performStatusUpdate(panneauId, destColumn);
  }, [panneaux, isAdmin, performStatusUpdate, showToast]);

  const handleOverrideSubmit = async (reason) => {
    const { panneauId, destColumn } = overrideModal;
    setOverrideModal({ show: false, panneauId: null, destColumn: null });
    await performStatusUpdate(panneauId, destColumn, reason);
  };

  // Handlers
  const handleCreateSubmit = async (formData) => {
    try {
      await createPanneau(formData);
      setCreateModalOpen(false);
      showToast('success', "Panneau créé avec succès");
    } catch (err) {
      showToast('error', err.error || "Erreur lors de la création du panneau");
    }
  };

  const handleEdit = (panneau) => {
    setEditModal({ isOpen: true, panneau });
  };

  const handleEditSubmit = async (id, formData) => {
    try {
      await updatePanneau(id, formData);
      setEditModal({ isOpen: false, panneau: null });
      showToast('success', `Panneau ${id} modifié avec succès`);
    } catch (err) {
      showToast('error', err?.response?.data?.error || err?.error || "Erreur lors de la modification du panneau");
    }
  };

  const handleDelete = async (panneau) => {
    if (!isAdmin) {
      showToast('error', "Seul un administrateur peut supprimer un panneau.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le panneau ${panneau.id} ?`)) {
      try {
        await deletePanneau(panneau.id);
        showToast('success', `Panneau ${panneau.id} supprimé avec succès`);
      } catch (err) {
        showToast('error', err?.response?.data?.error || err?.error || "Erreur lors de la suppression du panneau");
      }
    }
  };

  const handleView = (panneau) => {
    setDetailModal({ isOpen: true, panneauId: panneau.id });
  };

  if (dataLoading && !panneaux.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500 tracking-wide">Chargement de l&apos;environnement MES...</p>
      </div>
    );
  }

  // Pass loading state to KanbanBoard items (we can inject it by modifying the array passed or via a prop)
  // For simplicity, we pass `loadingPanneauId` to KanbanBoard
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panneaux (Kanban)</h1>
              <p className="text-sm text-slate-500 mt-0.5">Suivi de production MES et assemblage</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAll}
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              title="Rafraîchir"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            {isWriteAllowed && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau Panneau</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Filters */}
        <PanneauFilters 
          panneaux={panneaux}
          supervisors={supervisors}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedSupervisor={selectedSupervisor}
          setSelectedSupervisor={setSelectedSupervisor}
        />

        {/* Kanban Board */}
        <div className="relative">
          {dataLoading && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}
          
          <KanbanBoard 
            panneaux={filteredPanneaux}
            onDragEnd={handleDragEnd}
            isWriteAllowed={isWriteAllowed}
            onHistoryClick={(id) => setHistoryModalState({ isOpen: true, panneauId: id })}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            loadingPanneauId={loadingPanneauId}
          />
        </div>

        {/* Modals & Toasts */}
        <CreatePanneauModal 
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          boms={boms}
          entrepots={entrepots}
          supervisors={supervisors}
        />

        <EditPanneauModal 
          isOpen={editModal.isOpen}
          panneau={editModal.panneau}
          onClose={() => setEditModal({ isOpen: false, panneau: null })}
          onSubmit={handleEditSubmit}
          boms={boms}
          entrepots={entrepots}
          supervisors={supervisors}
        />

        <DetailPanneauModal 
          isOpen={detailModal.isOpen}
          panneauId={detailModal.panneauId}
          onClose={() => setDetailModal({ isOpen: false, panneauId: null })}
          getPanneauDetails={getPanneauDetails}
          onEdit={handleEdit}
          isWriteAllowed={isWriteAllowed}
        />

        <HistoryModal 
          isOpen={historyModalState.isOpen}
          onClose={() => setHistoryModalState({ isOpen: false, panneauId: null })}
          panneauId={historyModalState.panneauId}
        />

        <AdminOverrideModal 
          isOpen={overrideModal.show}
          destColumn={overrideModal.destColumn}
          onClose={() => setOverrideModal({ show: false, panneauId: null, destColumn: null })}
          onSubmit={handleOverrideSubmit}
        />
        
        <Toast 
          show={toast.show}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />

      </div>
    </div>
  );
}
