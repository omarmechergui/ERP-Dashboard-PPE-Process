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
import LoadingState from '../interventions/components/common/LoadingState';

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Calendar className="w-6 h-6" />
              </span>
              Maintenance Préventive
            </h1>
            <p className="text-slate-500 mt-1">Gérez la planification et le suivi des entretiens réguliers.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {canEdit && (
                <>
                    <button 
                      onClick={() => setIsImportWizardOpen(true)}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Import Excel
                    </button>
                    <button 
                      onClick={handleOpenCreate}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Nouveau Plan
                    </button>
                </>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
            <p className="text-rose-700">{error}</p>
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
