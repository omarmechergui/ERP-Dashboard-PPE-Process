/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Box } from 'lucide-react';

import { useBomData } from './components/hooks/useBomData';

import BomSidebar from './components/layout/BomSidebar';
import BomDetails from './components/layout/BomDetails';
import BomStatistics from './components/layout/BomStatistics';
import BomTable from './components/table/BomTable';

import CreateBomModal from './components/modals/CreateBomModal';
import AddComponentModal from './components/modals/AddComponentModal';
import DeleteDialog from './components/modals/DeleteDialog';
import BomImportModal from './components/modals/BomImportModal';

import LoadingSkeleton from './components/feedback/LoadingSkeleton';
import EmptyState from './components/feedback/EmptyState';

export default function BomPage() {
  const {
    isWriteAllowed,
    boms,
    selectedBom,
    bomPage,
    bomTotalPages,
    bomSearch,
    setBomSearch,
    bomsLoading,
    detailsLoading,
    error,
    toast,
    actions
  } = useBomData();

  const [articlesMap, setArticlesMap] = useState(new Map());

  // Fetch stock data for the current BOM
  React.useEffect(() => {
    if (selectedBom?.lignes?.length > 0) {
      const articleIds = selectedBom.lignes.map(l => l.article_id);
      import('@/lib/api').then(({ default: API }) => {
        API.post('/stock/articles/by-ids', { ids: articleIds }).then(res => {
          const map = new Map();
          res.data.forEach(a => map.set(a.id, a));
          setArticlesMap(map);
        }).catch(err => console.error(err));
      });
    } else {
      setArticlesMap(new Map());
    }
  }, [selectedBom]);

  // Modal states
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [bomModalData, setBomModalData] = useState(null); // null = create, object = edit

  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [componentModalData, setComponentModalData] = useState(null); // null = add, object = edit

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportData, setParsedImportData] = useState(null);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  // Handlers for BOM Modal
  const handleOpenCreateBom = () => {
    setBomModalData(null);
    setIsBomModalOpen(true);
  };

  const handleOpenEditBom = (bom) => {
    setBomModalData({
      nom_projet: bom.nom_projet,
      nom_bom: bom.nom_bom,
      jig: bom.jig || '',
      contrepartie: bom.contrepartie || '',
      clip: bom.clip || ''
    });
    setIsBomModalOpen(true);
  };

  const handleSubmitBom = async (data) => {
    if (bomModalData) { // Edit
      await actions.updateBom(selectedBom.id, data);
    } else { // Create
      await actions.createBom(data);
    }
    setIsBomModalOpen(false);
  };

  // Handlers for Delete Dialog
  const handleOpenDeleteBom = (id) => {
    setDeleteDialog({
      isOpen: true,
      type: 'bom',
      id,
      title: 'Supprimer la Nomenclature',
      message: 'Êtes-vous sûr de vouloir supprimer cette nomenclature ? Cette action est irréversible et supprimera tous les composants liés.'
    });
  };

  const handleOpenDeleteLine = (id) => {
    setDeleteDialog({
      isOpen: true,
      type: 'line',
      id,
      title: 'Retirer le composant',
      message: 'Voulez-vous vraiment retirer ce composant de la nomenclature ?'
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteDialog.type === 'bom') {
        await actions.deleteBom(deleteDialog.id);
      } else if (deleteDialog.type === 'line') {
        await actions.deleteLine(selectedBom.id, deleteDialog.id);
      }
    } catch (e) {
      // Error is handled by useBomData, we just catch it to prevent unhandled rejections
    } finally {
      setDeleteDialog({ ...deleteDialog, isOpen: false });
    }
  };

  // Handlers for Component Modal
  const handleOpenAddComponent = () => {
    setComponentModalData(null);
    setIsComponentModalOpen(true);
  };

  const handleOpenEditComponent = (line) => {
    setComponentModalData({
      article_id: line.article_id,
      quantite: line.quantite
    });
    setIsComponentModalOpen(true);
  };

  const handleSubmitComponent = async (data) => {
    if (componentModalData) {
      // It's an edit, find the line ID
      const line = selectedBom.lignes.find(l => l.article_id === data.article_id);
      if (line) {
        await actions.updateLine(selectedBom.id, line.id, data.article_id, data.quantite);
      }
    } else {
      await actions.addLine(selectedBom.id, data.article_id, data.quantite);
    }
    setIsComponentModalOpen(false);
  };

  // Render logic
  if (bomsLoading && boms.length === 0) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Box className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">BOM</h2>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-12">
            Gestion de la structure des produits et configuration des planches de câblage
          </p>
        </div>
      </div>

      {/* Global Feedback */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm flex items-center gap-3 shadow-sm"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
        {toast.message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }} 
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3 shadow-xl shadow-emerald-600/20"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      <BomStatistics />

      {/* Main Layout */}
      <div className="flex gap-6 h-[calc(100vh-18rem)] min-h-[600px]">
        {/* Left Sidebar (BOM List) */}
        <BomSidebar 
          boms={boms} 
          selectedBom={selectedBom} 
          isWriteAllowed={isWriteAllowed}
          onSelectBom={actions.loadBomDetails}
          onCreateClick={handleOpenCreateBom}
          onEditClick={handleOpenEditBom}
          onDeleteClick={handleOpenDeleteBom}
          bomPage={bomPage}
          bomTotalPages={bomTotalPages}
          onPageChange={(page) => actions.loadBoms(page, bomSearch)}
          searchQuery={bomSearch}
          onSearchChange={(query) => {
            setBomSearch(query);
            actions.loadBoms(1, query); // Load page 1 on new search
          }}
          bomsLoading={bomsLoading}
        />

        {/* Right Details Panel */}
        <div className="flex-1 flex flex-col gap-5 overflow-hidden">
          {selectedBom ? (
            <>
              {/* BOM Info & Form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm shrink-0">
                <BomDetails 
                  selectedBom={selectedBom} 
                  isWriteAllowed={isWriteAllowed} 
                  onUpdate={actions.updateBom} 
                />
              </div>

              {/* Table */}
              <div className="flex-1 min-h-0">
                <BomTable 
                  selectedBom={selectedBom} 
                  articlesMap={articlesMap} 
                  isWriteAllowed={isWriteAllowed}
                  onAddLine={handleOpenAddComponent}
                  onEditLine={handleOpenEditComponent}
                  onDeleteLine={handleOpenDeleteLine}
                  onOpenImportModal={() => {
                    setParsedImportData(null);
                    setIsImportModalOpen(true);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl h-full flex items-center justify-center">
              <EmptyState />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateBomModal 
        isOpen={isBomModalOpen} 
        onClose={() => setIsBomModalOpen(false)} 
        initialData={bomModalData}
        onSubmit={handleSubmitBom}
      />

      <AddComponentModal 
        isOpen={isComponentModalOpen} 
        onClose={() => setIsComponentModalOpen(false)} 
        initialData={componentModalData}
        searchArticles={actions.searchArticles}
        onSubmit={handleSubmitComponent}
      />

      <BomImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        parsedData={parsedImportData}
        articlesMap={articlesMap}
        selectedBom={selectedBom}
        actions={actions}
      />

      <DeleteDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteDialog.title}
        message={deleteDialog.message}
      />
    </div>
  );
}
