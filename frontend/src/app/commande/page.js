/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Package, Clock, CheckCircle, AlertTriangle, RefreshCw, Download } from "lucide-react";
import API from "../../lib/api";
import * as XLSX from "xlsx-js-style";

import CommandeForm from "./components/CommandeForm";
import CommandeTable from "./components/CommandeTable";
import CommandeFilters from "./components/CommandeFilters";
import BulkActionsToolbar from "./components/BulkActionsToolbar";
import CommandeDetailsDrawer from "./components/CommandeDetailsDrawer";
import PageHeader from "../../components/ui/PageHeader";

export default function CommandePage() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    dateRange: "ALL"
  });

  // UI State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedCommandeId, setSelectedCommandeId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/commandes");
      setCommandes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch commandes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes, refreshKey]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const total = commandes.length;
    const pending = commandes.filter((c) => c.status === "PENDING").length;
    const received = commandes.filter((c) => c.status === "RECEIVED").length;
    
    // Assume PENDING orders older than 7 days are 'En retard'
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const late = commandes.filter(
      (c) => c.status === "PENDING" && new Date(c.createdAt) < sevenDaysAgo
    ).length;

    return { total, pending, received, late };
  }, [commandes]);

  const handleOrderCreated = () => {
    setIsWizardOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = () => {
    try {
      // Export either selected rows or all filtered rows if none selected
      const dataToExport = selectedRowIds.length > 0 
        ? filteredCommandes.filter((c) => selectedRowIds.includes(c.id))
        : filteredCommandes;

      if (dataToExport.length === 0) {
        alert("Aucune commande à exporter.");
        return;
      }

      const exportData = dataToExport.map((cmd) => {
        const totalQuantite = cmd.lignes?.reduce((sum, l) => sum + (l.quantite || 0), 0) || 0;
        return {
          "Référence": cmd.reference || `CMD${String(cmd.id).padStart(3, "0")}`,
          "Fournisseur": cmd.fournisseur?.nom || "N/A",
          "Date": cmd.createdAt ? new Date(cmd.createdAt).toLocaleDateString("fr-FR") : "N/A",
          "Statut": cmd.status === "PENDING" ? "En attente" : cmd.status === "RECEIVED" ? "Reçue" : cmd.status,
          "Quantité Totale": totalQuantite,
          "Total (DT)": cmd.total || 0,
          "Articles": cmd.lignes?.map(l => l.article?.nom || l.article?.nom_article).join(", ") || "N/A"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      worksheet["!cols"] = [
        { wch: 15 }, // Ref
        { wch: 25 }, // Fournisseur
        { wch: 15 }, // Date
        { wch: 15 }, // Statut
        { wch: 15 }, // Qte
        { wch: 15 }, // Total
        { wch: 50 }, // Articles
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");
      XLSX.writeFile(workbook, `Commandes_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Une erreur est survenue lors de l'export.");
    }
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "ALL", dateRange: "ALL" });
  };

  const filteredCommandes = useMemo(() => {
    return commandes.filter((cmd) => {
      // Status Filter
      if (filters.status !== "ALL" && cmd.status !== filters.status) return false;
      
      // Search Filter (Fournisseur or Reference)
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const ref = `cmd${String(cmd.id).padStart(3, "0")}`.toLowerCase();
        const fName = cmd.fournisseur?.nom?.toLowerCase() || "";
        const hasArticle = cmd.lignes?.some((l) => 
            (l.article?.nom?.toLowerCase() || l.article?.nom_article?.toLowerCase() || "").includes(q)
        );
        if (!ref.includes(q) && !fName.includes(q) && !hasArticle) return false;
      }
      return true;
    });
  }, [commandes, filters]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Section */}
        <PageHeader 
          icon={Package}
          title="Commandes Fournisseur"
          description="Centre de contrôle et de gestion des approvisionnements"
          action={
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="p-2 text-secondary-foreground hover:text-primary hover:bg-primary/5 bg-card border border-border rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
                title="Exporter"
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">Exporter</span>
              </button>
              <button 
                onClick={handleRefresh}
                className="p-2 text-secondary-foreground hover:text-foreground bg-card border border-border rounded-lg shadow-sm hover:shadow transition-all"
                title="Rafraîchir"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-primary" : ""}`} />
              </button>
              <button 
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Commande
              </button>
            </div>
          }
        />

        {/* KPI Cards Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Commandes" 
            value={kpis.total} 
            icon={<Package className="w-5 h-5 text-blue-600" />} 
            bg="bg-blue-50"
            onClick={() => setFilters({ ...filters, status: "ALL" })}
            active={filters.status === "ALL"}
          />
          <KpiCard 
            title="En Attente" 
            value={kpis.pending} 
            icon={<Clock className="w-5 h-5 text-amber-600" />} 
            bg="bg-amber-50"
            onClick={() => setFilters({ ...filters, status: "PENDING" })}
            active={filters.status === "PENDING"}
          />
          <KpiCard 
            title="Reçues / Validées" 
            value={kpis.received} 
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} 
            bg="bg-emerald-50"
            onClick={() => setFilters({ ...filters, status: "RECEIVED" })}
            active={filters.status === "RECEIVED"}
          />
          <KpiCard 
            title="En Retard (>7j)" 
            value={kpis.late} 
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} 
            bg="bg-rose-50"
            // No specific filter action for 'late' yet, just visual indicator
          />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
          
          <CommandeFilters 
            filters={filters} 
            setFilters={setFilters} 
            clearFilters={clearFilters}
          />
          
          <BulkActionsToolbar 
            selectedIds={selectedRowIds} 
            onClearSelection={() => setSelectedRowIds([])}
            onActionComplete={handleRefresh}
            onExport={handleExport}
          />

          <CommandeTable 
            commandes={filteredCommandes} 
            loading={loading}
            selectedRowIds={selectedRowIds}
            setSelectedRowIds={setSelectedRowIds}
            onRowClick={(id) => setSelectedCommandeId(id)}
            onActionComplete={handleRefresh}
          />

        </div>

      </div>

      {/* Overlays */}
      {isWizardOpen && (
        <CommandeForm 
          onClose={() => setIsWizardOpen(false)} 
          onOrderCreated={handleOrderCreated} 
        />
      )}

      {selectedCommandeId && (
        <CommandeDetailsDrawer 
          commandeId={selectedCommandeId}
          onClose={() => setSelectedCommandeId(null)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  );
}

function KpiCard({ title, value, icon, bg, onClick, active }) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border ${active ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200'} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className={`p-2 rounded-lg ${bg}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}