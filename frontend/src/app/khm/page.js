"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/auth";

import { useKhm } from "./hooks/useKhm";
import KhmStats from "./components/KhmStats";
import KhmFilters from "./components/KhmFilters";
import KhmCard from "./components/KhmCard";
import RejectModal from "./components/RejectModal";
import HistoryModal from "./components/HistoryModal";
import PageHeader from "../../components/ui/PageHeader";
import LoadingState from "../../components/ui/LoadingSkeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function KhmPage() {
  const { user } = useAuth();
  const isWriteAllowed = user && ["ADMIN", "SUPERVISEUR"].includes(user?.role);

  const {
    controls,
    loading,
    error,
    stats,
    loadKhm,
    syncKhm,
    validateControl,
    rejectControl
  } = useKhm();

  // On first mount, sync existing KHM panels (fixes panels that were
  // already in KHM stage before the auto-create KhmControl fix)
  useEffect(() => {
    syncKhm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  // Modals State
  const [rejectModalState, setRejectModalState] = useState({ isOpen: false, controlId: null, error: "" });
  const [historyModalState, setHistoryModalState] = useState({ isOpen: false, panneauId: null });

  // Filter Logic
  const filteredControls = useMemo(() => {
    return controls.filter(c => {
      // Status filter
      if (selectedStatus && c.etat !== selectedStatus) return false;
      
      // Project filter
      if (selectedProject && c.panneau?.title_project !== selectedProject) return false;
      
      // Supervisor filter
      if (selectedSupervisor && c.matricule_superviseur !== selectedSupervisor) return false;
      
      // Search query (Panel ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const pid = c.panneau_id ? c.panneau_id.toString().toLowerCase() : "";
        if (!pid.includes(query)) return false;
      }
      
      return true;
    });
  }, [controls, selectedStatus, selectedProject, selectedSupervisor, searchQuery]);

  // Handlers
  const handleValidate = async (id) => {
    if (!window.confirm("Confirmer la validation de ce contrôle KHM ?")) return;
    await validateControl(id);
  };

  const handleOpenReject = (id) => {
    setRejectModalState({ isOpen: true, controlId: id, error: "" });
  };

  const handleRejectSubmit = async (comment, severity) => {
    if (!comment || comment.trim() === "") {
      setRejectModalState(prev => ({ ...prev, error: "Le commentaire est obligatoire." }));
      return;
    }
    
    const res = await rejectControl(rejectModalState.controlId, comment, severity);
    if (res.success) {
      setRejectModalState({ isOpen: false, controlId: null, error: "" });
    } else {
      setRejectModalState(prev => ({ ...prev, error: res.error }));
    }
  };

  const handleOpenHistory = (panneauId) => {
    setHistoryModalState({ isOpen: true, panneauId });
  };

  if (loading && !controls.length) {
    return <LoadingState type="dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader 
          icon={ShieldCheck}
          title="Contrôle Qualité KHM"
          description="Validation électrique et visuelle finale des panneaux"
          action={
            <button 
              onClick={() => { syncKhm(); }}
              className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors border border-transparent"
              title="Rafraîchir et synchroniser"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          }
        />

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Dashboard KPIs */}
        <KhmStats stats={stats} />

        {/* Filters */}
        <KhmFilters 
          controls={controls}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedSupervisor={selectedSupervisor}
          setSelectedSupervisor={setSelectedSupervisor}
        />

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredControls.length > 0 ? (
            filteredControls.map((ctrl) => (
              <KhmCard 
                key={ctrl.id}
                control={ctrl}
                isWriteAllowed={isWriteAllowed}
                onValidate={handleValidate}
                onReject={handleOpenReject}
                onHistoryClick={handleOpenHistory}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                icon={ShieldCheck}
                title="Aucun contrôle trouvé"
                message="Aucun contrôle KHM ne correspond à vos critères."
              />
            </div>
          )}
        </div>

        {/* Modals */}
        <RejectModal 
          isOpen={rejectModalState.isOpen}
          onClose={() => setRejectModalState({ isOpen: false, controlId: null, error: "" })}
          onSubmit={handleRejectSubmit}
          error={rejectModalState.error}
        />

        <HistoryModal 
          isOpen={historyModalState.isOpen}
          onClose={() => setHistoryModalState({ isOpen: false, panneauId: null })}
          panneauId={historyModalState.panneauId} 
        />

      </div>
    </div>
  );
}
