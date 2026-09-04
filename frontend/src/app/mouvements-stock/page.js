"use client";

import React, { useState } from "react";
import { useAuth } from "../../lib/auth";
import { AlertCircle } from "lucide-react";

// Hooks
import { useStockMovements } from "./hooks/useStockMovements";
import { useMovementFilters } from "./hooks/useMovementFilters";
import { useMovementStats } from "./hooks/useMovementStats";

// Components
import { Header } from "./components/Header";
import { KpiCards } from "./components/KpiCards";
import { StockFilters } from "./components/StockFilters";
import { StockTable } from "./components/StockTable";
import { MovementDrawer } from "./components/MovementDrawer";
import { EntryWizard } from "./components/EntryWizard";
import { ExitWizard } from "./components/ExitWizard";
import { ImportWizard } from "./components/ImportWizard";

export default function MouvementsStockPage() {
  const { user } = useAuth();
  const isMoveAllowed = user && ["ADMIN", "GL", "OPERATEUR"].includes(user.role);

  const filters = useMovementFilters();
  const { movements, pagination, loading, error, fetchData, addEntree, addSortieBulk } = useStockMovements(filters);
  const { stats, loading: statsLoading } = useMovementStats();

  // Modals & Drawer State
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (movement) => {
    setSelectedMovement(movement);
    setDrawerOpen(true);
  };

  const handleEntrySubmit = async (formData) => {
    setModalError("");
    try {
      const payload = {
        ...formData,
        planification_id: formData.planification_id ? formData.planification_id : null,
        quantite: parseInt(formData.quantite),
        etat: formData.etat === true || formData.etat === "true",
      };
      await addEntree(payload);
      setEntryModalOpen(false);
    } catch (err) {
      setModalError(err.error || err.message || "Erreur lors de l'enregistrement de l'entrée.");
    }
  };

  const handleExitSubmit = async (formData) => {
    setModalError("");
    try {
      if (formData.items && formData.items.length > 0) {
        const payload = {
          matricule: formData.matricule,
          items: formData.items.map((item) => ({
            article_id: item.article_id,
            quantite: parseInt(item.quantite),
            emplacement: item.emplacement
          }))
        };
        await addSortieBulk(payload);
      }
      setExitModalOpen(false);
    } catch (err) {
      setModalError(err.error || err.message || "Erreur lors de l'enregistrement de la sortie.");
    }
  };

  if (loading && movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-700">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-sm font-medium animate-pulse">Loading stock movements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Header 
        isMoveAllowed={isMoveAllowed}
        onRefresh={fetchData}
        onNewEntry={() => { setModalError(""); setEntryModalOpen(true); }}
        onNewExit={() => { setModalError(""); setExitModalOpen(true); }}
        onImport={() => setImportModalOpen(true)}
        lastSync={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <KpiCards stats={stats} />

      <StockFilters 
        searchTerm={filters.searchTerm} setSearchTerm={filters.setSearchTerm}
        typeFilter={filters.typeFilter} setTypeFilter={filters.setTypeFilter}
        dateRange={filters.dateRange} setDateRange={filters.setDateRange}
      />

      <StockTable 
        movements={movements}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPageChange={filters.setPage}
        onLimitChange={filters.setLimit}
      />

      <MovementDrawer 
        movement={selectedMovement}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <EntryWizard 
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        onSubmit={handleEntrySubmit}
        error={modalError}
      />

      <ExitWizard 
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        onSubmit={handleExitSubmit}
        userMatricule={user?.matricule || ""}
        error={modalError}
      />

      <ImportWizard
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onRefresh={fetchData}
        user={user}
      />
    </div>
  );
}
