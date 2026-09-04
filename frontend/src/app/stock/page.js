"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";

// Hooks
import { useStock } from "./hooks/useStock";
import { useStockFilters } from "./hooks/useStockFilters";
import { useStockStatistics } from "./hooks/useStockStatistics";
import { useSuppliers } from "./hooks/useSuppliers";
import { useArticleForm } from "./hooks/useArticleForm";

// Components
import { StockHeader } from "./components/StockHeader";
import { StockKPICards } from "./components/StockKPICards";
import { StockFilters } from "./components/StockFilters";
import { StockTable } from "./components/StockTable";
import { StockDrawer } from "./components/StockDrawer";
import { ArticleModal } from "./components/ArticleModal";
import { ImportWizard } from "../mouvements-stock/components/ImportWizard";

export default function StockPage() {
  const { user } = useAuth();
  const isWriteAllowed = user && ["ADMIN", "GL"].includes(user.role);

  // Custom Hooks
  const { suppliers, addSupplier, isAdding: isAddingSupplier } = useSuppliers();
  
  const {
    searchTerm, setSearchTerm,
    debouncedSearchTerm,
    selectedSupplier, setSelectedSupplier,
    availabilityFilter, setAvailabilityFilter,
    page, setPage, limit, setLimit
  } = useStockFilters();

  const { 
    articles, pagination, stats: backendStats, loading: stockLoading, error: stockError, 
    fetchArticles, addArticle, updateArticle, deleteArticle 
  } = useStock({
    page, limit, debouncedSearchTerm, selectedSupplier, availabilityFilter
  });
  
  const stats = useStockStatistics(articles, backendStats);

  const {
    formData, editArticleId, modalOpen, modalError, setModalError,
    handleInputChange, openCreateModal, openEditModal, closeModal
  } = useArticleForm(suppliers[0]?.id || "");

  // Local state for drawer and modals
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleRowClick = (article) => {
    setSelectedArticle(article);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!formData.id || !formData.nom_article || !formData.fournisseur_id) {
      setModalError("Please fill in all required fields.");
      return;
    }

    try {
      const supplier = suppliers.find(s => s.id === formData.fournisseur_id);
      
      if (editArticleId) {
        const { id, ...updateData } = formData;
        await updateArticle(editArticleId, updateData, supplier?.nom);
      } else {
        await addArticle(formData, supplier?.nom);
      }
      closeModal();
    } catch (err) {
      setModalError(
        err.error || 
        err.message ||
        "An error occurred."
      );
    }
  };

  // Loading state is now handled inline by components for progressive rendering

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <StockHeader 
        isWriteAllowed={isWriteAllowed}
        onAddArticle={openCreateModal}
        onRefresh={fetchArticles}
        onImport={() => setImportModalOpen(true)}
        lastSync={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        data={articles}
        userRole={user?.role}
        filters={{
          search: searchTerm,
          fournisseur_id: selectedSupplier,
          availability: availabilityFilter
        }}
      />

      {stockError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <p className="font-semibold">{stockError}</p>
        </div>
      )}

      <StockKPICards stats={stats} loading={stockLoading} />

      <StockFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        availabilityFilter={availabilityFilter}
        setAvailabilityFilter={setAvailabilityFilter}
        suppliers={suppliers}
      />

      <StockTable 
        articles={articles}
        loading={stockLoading}
        pagination={pagination}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={setLimit}
        isWriteAllowed={isWriteAllowed}
        onEdit={openEditModal}
        onDelete={deleteArticle}
        onRowClick={handleRowClick}
      />

      <StockDrawer 
        article={selectedArticle}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <ArticleModal 
        isOpen={modalOpen}
        onClose={closeModal}
        isEdit={!!editArticleId}
        formData={formData}
        handleInputChange={handleInputChange}
        onSubmit={handleFormSubmit}
        error={modalError}
        suppliers={suppliers}
        isAddingSupplier={isAddingSupplier}
        onAddSupplier={addSupplier}
      />

      <ImportWizard
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onRefresh={fetchArticles}
        user={user}
      />

    </div>
  );
}
