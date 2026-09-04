"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { useOrganizationTree } from "./hooks/useOrganizationTree";

import { HeaderActions } from "./components/HeaderActions";
import { StatisticsCards } from "./components/StatisticsCards";
import { SearchToolbar } from "./components/SearchToolbar";
import { OrganizationChart } from "./components/chart/OrganizationChart";
import { EmployeeDrawer } from "./components/EmployeeDrawer";
import { LoadingSkeleton, ErrorState } from "./components/common/CommonStates";
import { ActionAlert } from "./components/common/ActionAlert";

import { useOrganigrammeWorkflow } from "./hooks/useOrganigrammeWorkflow";
import { WorkflowStatusBadge } from "./components/workflow/WorkflowStatusBadge";
import { WorkflowActions } from "./components/workflow/WorkflowActions";
import { WorkflowHistory } from "./components/workflow/WorkflowHistory";
import { RejectModal } from "./components/workflow/RejectModal";
import { OrganigrammeList } from "./components/workflow/OrganigrammeList";
import { AlertTriangle, ChevronDown, ChevronUp, List, Layout } from 'lucide-react';

export default function OrganigrammePage() {
  const { user } = useAuth();
  const {
    treeData,
    stats,
    loading,
    error,
    refreshData,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    expandedNodes,
    toggleNode,
    isDrawerOpen,
    selectedEmployee,
    openEmployeeDrawer,
    closeEmployeeDrawer,
  } = useOrganizationTree();

  const workflow = useOrganigrammeWorkflow(user);
  const [showHistory, setShowHistory] = useState(false);
  const [showList, setShowList] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [alert, setAlert] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derived current org
  const currentOrg = selectedOrgId 
    ? workflow.organigrammes.find(o => o.id === selectedOrgId) 
    : workflow.activeOrganigramme;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleExportPDF = () => {
    // Dans une implémentation réelle, ceci utiliserait une librairie comme html2pdf.js ou jsPDF
    window.alert("L'export PDF sera disponible prochainement.");
  };

  if (loading && (!treeData || treeData.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 transition-all ${isFullscreen ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
      
      {/* Action Feedback Alert */}
      {alert && (
        <ActionAlert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert(null)} 
        />
      )}
      
      {/* Global Error overrides if no data */}
      {workflow.error && !workflow.organigrammes.length && (
         <ActionAlert type="error" message={workflow.error} onClose={() => workflow.setError(null)} />
      )}

      <div className={`mx-auto space-y-6 ${isFullscreen ? 'max-w-none h-screen flex flex-col' : 'max-w-[1600px]'}`}>
        
        {/* Header & Stats - Hide in fullscreen if desired, or keep */}
        {!isFullscreen && (
          <>
            <HeaderActions 
              onRefresh={() => { refreshData(); workflow.refreshWorkflow(); }}
              onExport={handleExportPDF}
              onFullScreen={toggleFullscreen}
            />
            
            {/* Workflow Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {currentOrg ? currentOrg.titre : "Organigramme"}
                  </h2>
                  {currentOrg && <WorkflowStatusBadge status={currentOrg.statut} />}
                </div>
                
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <button
                    onClick={() => setShowList(!showList)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {showList ? <Layout className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    {showList ? "Vue Principale" : "Liste des Versions"}
                  </button>
                  
                  {currentOrg && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      Historique
                      {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Rejection Alert */}
              {currentOrg?.statut === 'REJETE' && currentOrg.lastRejection && (
                <div className="p-4 bg-red-50 border-b border-red-100 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-red-800">Organigramme rejeté</h3>
                    <p className="text-sm text-red-700 mt-1">{currentOrg.lastRejection.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {currentOrg && !showList && (
                <div className="p-4 border-b border-gray-200">
                  <WorkflowActions 
                    organigramme={currentOrg}
                    workflowConfig={workflow}
                    onRejectClick={() => setIsRejectModalOpen(true)}
                    onEditClick={() => window.alert("Edition non implémentée dans cette démo")}
                    setAlert={setAlert}
                  />
                </div>
              )}

              {/* History Panel */}
              {showHistory && currentOrg && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Historique des statuts</h3>
                  <WorkflowHistory organigrammeId={currentOrg.id} />
                </div>
              )}
            </div>

            <StatisticsCards stats={stats} workflowStats={workflow.stats} />
          </>
        )}

        {/* Fullscreen header toggle */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={toggleFullscreen}
              className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border border-gray-200 text-gray-700 hover:text-blue-600"
            >
              Quitter le plein écran
            </button>
          </div>
        )}

        {/* Error notification if data exists but there's a background error */}
        {error && (
          <div className={isFullscreen ? 'px-6 pt-6' : ''}>
            <ErrorState error={error} onRetry={refreshData} />
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex flex-col gap-6 ${isFullscreen ? 'flex-1 p-6 pt-16 overflow-hidden' : ''}`}>
          
          {showList && !isFullscreen ? (
             <OrganigrammeList 
               organigrammes={workflow.organigrammes} 
               activeId={currentOrg?.id}
               onSelect={(org) => {
                 setSelectedOrgId(org.id);
                 setShowList(false);
               }}
             />
          ) : (
            <>
              <SearchToolbar
                filters={filters}
                setFilters={setFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              
              <div className={isFullscreen ? 'flex-1' : ''}>
                <OrganizationChart 
                  data={treeData}
                  expandedNodes={expandedNodes}
                  onToggle={toggleNode}
                  onNodeClick={openEmployeeDrawer}
                />
              </div>
            </>
          )}
        </div>

        {/* Side Drawer for Employee Details */}
        <EmployeeDrawer 
          isOpen={isDrawerOpen}
          onClose={closeEmployeeDrawer}
          employee={selectedEmployee}
        />

        {/* Reject Modal */}
        <RejectModal 
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          isSubmitting={workflow.actionInProgress}
          onConfirm={async (reason, comment) => {
            const res = await workflow.reject(currentOrg.id, reason, comment);
            setIsRejectModalOpen(false);
            if (res.success) {
              setAlert({ type: 'success', message: 'Organigramme rejeté avec succès.' });
            } else {
              setAlert({ type: 'error', message: res.error });
            }
          }}
        />
      </div>
    </div>
  );
}
