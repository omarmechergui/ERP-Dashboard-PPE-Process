"use client";

import React, { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { useInterventions } from "./hooks/useInterventions";
import InterventionKPIs from "./components/dashboard/InterventionKPIs";
import InterventionFilters from "./components/filters/InterventionFilters";
import InterventionTable from "./components/InterventionTable";
import InterventionTimeline from "./components/timeline/InterventionTimeline";
import InterventionModal from "./components/modal/InterventionModal";
import InterventionDetailModal from "./components/modal/InterventionDetailModal";
import LoadingState from "./components/common/LoadingState";
import ErrorState from "./components/common/ErrorState";

export default function InterventionsPage() {
  const {
    interventions,
    timeline,
    stats,
    loading,
    error,
    filters,
    searchQuery,
    setSearchQuery,
    updateFilters,
    resetFilters,
    refreshData,
    createIntervention,
    updateIntervention,
    deleteIntervention,
    changeStatus
  } = useInterventions({
    type: 'Tous',
    priority: 'Tous',
    status: 'Tous',
    shift: 'Tous'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInterventionId, setDetailInterventionId] = useState(null);

  const handleOpenModal = (intervention = null) => {
    setEditingIntervention(intervention);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (intervention) => {
    setDetailInterventionId(intervention.id);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailInterventionId(null);
    setDetailModalOpen(false);
  };

  const handleCloseModal = () => {
    setEditingIntervention(null);
    setIsModalOpen(false);
  };

  const handleSubmitIntervention = async (payload) => {
    let result;
    // If it has an ID, it's an update. If it doesn't (like a duplicated item), it's a create.
    if (editingIntervention && editingIntervention.id) {
      result = await updateIntervention(editingIntervention.id, payload);
    } else {
      result = await createIntervention(payload);
    }

    if (result.success) {
      handleCloseModal();
    }
    return result;
  };

  const handleDuplicate = (intervention) => {
    const duplicatedData = { ...intervention };
    delete duplicatedData.id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    delete duplicatedData.code; // Backend handles code generation
    handleOpenModal(duplicatedData);
  };

  if (loading && interventions.length === 0) {
    return <LoadingState />;
  }

  if (error && interventions.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState error={error} onRetry={refreshData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              Interventions de Maintenance
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Gérez vos activités de maintenance préventive et corrective
            </p>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nouvelle intervention
          </button>
        </div>

        {/* Dashboard KPIs */}
        <InterventionKPIs stats={stats} />

        {/* Error notification if data exists but there's a background error */}
        {error && (
          <div className="mb-6">
            <ErrorState error={error} onRetry={refreshData} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="w-full">
            <InterventionFilters
              filters={filters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterChange={updateFilters}
              onReset={resetFilters}
              onRefresh={refreshData}
            />
            
            <InterventionTable 
              interventions={interventions} 
              loading={loading}
              onView={handleOpenDetail}
              onEdit={handleOpenModal}
              onDuplicate={handleDuplicate}
              onDelete={(id) => {
                if (window.confirm("Êtes-vous sûr de vouloir supprimer cette intervention ?")) {
                  deleteIntervention(id);
                }
              }}
              onChangeStatus={changeStatus}
            />
          </div>
        </div>

        {/* Timeline Section */}
        <InterventionTimeline timeline={interventions} />

        {/* Modals */}
        <InterventionModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSubmit={handleSubmitIntervention}
          initialData={editingIntervention}
        />
        
        <InterventionDetailModal
          isOpen={detailModalOpen}
          onClose={handleCloseDetail}
          interventionId={detailInterventionId}
          onUpdate={refreshData}
        />
      </div>
    </div>
  );
}
