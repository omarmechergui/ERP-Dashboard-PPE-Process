"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePlanification } from "./hooks/usePlanification";
import PageHeader from "../../components/ui/PageHeader";
import { Calendar, Plus, RefreshCw, BarChart2 } from "lucide-react";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import ProgressBar from "../../components/ui/ProgressBar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PlanificationKPICards from "./components/PlanificationKPICards";
import PlanificationFilterBar from "./components/PlanificationFilterBar";
import PlanificationForm from "./components/PlanificationForm";
import GanttView from "./components/GanttView";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PlanificationPage() {
  const router = useRouter();
  const { 
    loading, 
    error, 
    loadPlanifications, 
    loadDashboardStats, 
    loadBoms, 
    loadUsers 
  } = usePlanification();
  
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [boms, setBoms] = useState([]);
  const [users, setUsers] = useState({ gls: [], superviseurs: [] });
  
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  
  const [filters, setFilters] = useState({
    search: '',
    bom_id: '',
    matricule_gl: '',
    matricule_superviseur: '',
    date_debut: '',
    date_fin: ''
  });
  
  const [activeTab, setActiveTab] = useState("liste");
  const [activeKpi, setActiveKpi] = useState('ALL');
  
  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [planData, dashStats] = await Promise.all([
        loadPlanifications({
          ...filters,
          status: activeKpi === 'ALL' ? '' : activeKpi,
          page: meta.page,
          limit: meta.limit
        }),
        loadDashboardStats()
      ]);
      setData(planData.data || []);
      if (planData.meta) setMeta(prev => ({ ...prev, total: planData.meta.total }));
      setStats(dashStats);
    } catch (err) {
      console.error(err);
    }
  }, [filters, activeKpi, meta.page, meta.limit, loadPlanifications, loadDashboardStats]);

  const loadDependencies = useCallback(async () => {
    const [fetchedBoms, fetchedUsers] = await Promise.all([
      loadBoms(),
      loadUsers()
    ]);
    setBoms(fetchedBoms);
    setUsers(fetchedUsers);
  }, [loadBoms, loadUsers]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  const handleKpiChange = (kpiId) => {
    setActiveKpi(kpiId);
    setMeta(prev => ({ ...prev, page: 1 }));
  };

  const columns = [
    {
      header: "Référence & Projet",
      cell: (row) => (
        <div className="flex flex-col min-w-[200px]">
          <span className="font-bold text-slate-800 text-[13px]">{row.reference}</span>
          <span className="text-xs text-slate-500 truncate mt-0.5">{row.project || "—"}</span>
        </div>
      )
    },
    {
      header: "Source & Quantité",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {row.production_mode === 'BOM' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">BOM</span>}
            {row.production_mode === 'FIX' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">FIX</span>}
            {row.production_mode === 'MANUEL' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">MANUEL</span>}
            {!row.production_mode && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">N/A</span>}
            <span className="font-semibold text-slate-700 text-xs truncate max-w-[120px]" title={row.bom?.nom_projet}>
              {row.production_mode === 'BOM' ? (row.bom?.nom_projet || "—") : (row.production_mode === 'FIX' ? "Production Fix" : row.production_mode === 'MANUEL' ? "Production Manuelle" : "—")}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Qté: <span className="font-bold text-slate-700">{row.quantite ?? "—"}</span>
          </span>
        </div>
      )
    },
    {
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Progression",
      cell: (row) => (
        <div className="w-32">
          {row.progress === null ? (
            <span className="text-slate-400 text-xs font-semibold">—</span>
          ) : (
            <ProgressBar progress={row.progress} />
          )}
        </div>
      )
    },
    {
      header: "Équipe",
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold">GL</span>
            <span className="text-[11px] font-medium text-slate-700 truncate max-w-[120px]">{row.gl?.nom || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold">SP</span>
            <span className="text-[11px] font-medium text-slate-700 truncate max-w-[120px]">{row.superviseur?.nom || "—"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Période",
      cell: (row) => (
        <div className="flex flex-col text-[11px] font-medium text-slate-600 gap-0.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {format(new Date(row.date_debut), 'dd MMM yyyy', { locale: fr })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            {format(new Date(row.date_fin), 'dd MMM yyyy', { locale: fr })}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 pb-24">
      {/* Header */}
      <PageHeader
        icon={Calendar}
        title="Planification de Production"
        description="Gérez les cycles de production, attribuez les BOMs et suivez l'avancement"
        action={
          <div className="flex gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                onClick={() => setActiveTab("liste")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "liste"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setActiveTab("gantt")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "gantt"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Gantt
              </button>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle planification
            </button>
          </div>
        }
      />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "liste" ? (
            <motion.div
              key="liste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* KPIs */}
              <PlanificationKPICards 
                stats={stats} 
                activeFilter={activeKpi} 
                onFilterChange={handleKpiChange} 
              />

              {/* Filters */}
              <PlanificationFilterBar 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                boms={boms} 
                users={users} 
              />

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                  columns={columns}
                  data={data}
                  loading={loading}
                  onRowClick={(row) => router.push(`/planification/${row.id}`)}
                />
                
                {/* Simple Pagination */}
                {meta.totalPages > 1 && (
                  <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <span className="text-sm text-slate-500 font-medium">
                      Page {meta.page} sur {meta.totalPages} ({meta.total} résultats)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={meta.page === 1}
                        onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Précédent
                      </button>
                      <button
                        disabled={meta.page === meta.totalPages}
                        onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gantt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[600px]">
                <GanttView 
                  planifications={data} 
                  loading={loading}
                  onPlanificationClick={(id) => router.push(`/planification/${id}`)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Placeholder for Wizard (we'll implement this next) */}
      <PlanificationForm 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async () => {
          setIsCreateModalOpen(false);
          fetchAll();
        }}
        initialData={null}
        boms={boms}
        users={users}
      />

    </div>
  );
}
