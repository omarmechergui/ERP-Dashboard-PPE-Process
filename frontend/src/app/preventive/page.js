"use client";

import React, { useState } from 'react';
import { usePreventiveMaintenance } from './hooks/usePreventiveMaintenance';
import { preventiveService } from './services/preventiveService';

import PreventiveKPIs from './components/PreventiveKPIs';
import PreventiveFilters from './components/PreventiveFilters';
import PreventiveTable from './components/PreventiveTable';
import PreventiveModal from './components/PreventiveModal';
import PreventiveDetailModal from './components/PreventiveDetailModal';
import PreventiveImportWizard from './components/PreventiveImportWizard';
import LoadingState from '../../components/ui/LoadingSkeleton';
import PageHeader from '../../components/ui/PageHeader';

import { Plus, Download, Upload, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function PreventivePage() {
  const { user } = useAuth();
  const {
    data,
    kpis,
    loading,
    error,
    filters,
    searchQuery,
    setSearchQuery,
    onFilterChange,
    onResetFilters,
    refreshData
  } = usePreventiveMaintenance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const canEdit = ['ADMIN', 'GL', 'SUPERVISEUR', 'TL'].includes(user?.role);
  
  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (plan) => {
      setSelectedPlan(plan);
      setIsDetailModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce plan de maintenance ?")) {
        try {
            await preventiveService.delete(id);
            refreshData();
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    }
  };

  const handleDuplicate = (plan) => {
      const duplicatedPlan = { ...plan, code: undefined, id: undefined, status: 'PLANNED' };
      setSelectedPlan(duplicatedPlan);
      setIsModalOpen(true);
  };

  if (loading && !data.length) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-fade-in">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <PageHeader 
          icon={Calendar}
          title="Maintenance Préventive"
          description="Gérez la planification et le suivi des entretiens réguliers."
          action={
            canEdit && (
              <>
                <button 
                  onClick={() => setIsImportWizardOpen(true)}
                  className="px-5 py-2.5 bg-card border border-border text-foreground rounded-xl text-sm font-bold hover:bg-secondary transition-colors shadow-sm flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" /> Import Excel
                </button>
                <button 
                  onClick={handleOpenCreate}
                  className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Créer un Plan
                </button>
              </>
            )
          }
        />

        {/* Error State */}
        {error && (
          <div className="bg-danger/10 border-l-4 border-danger p-4 rounded-r-xl">
            <p className="text-danger font-bold">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <PreventiveKPIs stats={kpis} />

        {/* Filters */}
        <PreventiveFilters 
          filters={filters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterChange={onFilterChange}
          onReset={onResetFilters}
          onRefresh={refreshData}
        />

        {/* Table */}
        <PreventiveTable 
          data={data}
          loading={loading}
          onView={handleOpenDetails}
          onEdit={canEdit ? handleOpenEdit : undefined}
          onDelete={canEdit ? handleDelete : undefined}
          onDuplicate={canEdit ? handleDuplicate : undefined}
        />

        {/* Modals */}
        {isModalOpen && (
            <PreventiveModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    refreshData();
                }}
                plan={selectedPlan}
            />
        )}

        {isDetailModalOpen && (
            <PreventiveDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                plan={selectedPlan}
                onRefresh={refreshData}
                user={user}
            />
        )}

        {isImportWizardOpen && (
            <PreventiveImportWizard
                isOpen={isImportWizardOpen}
                onClose={() => setIsImportWizardOpen(false)}
                onRefresh={refreshData}
                user={user}
            />
        )}

      </div>
    </div>
  );
}
