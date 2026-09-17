"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePlanification } from "./hooks/usePlanification";
import PageHeader from "../../components/ui/PageHeader";
import { Calendar, Plus, RefreshCw, BarChart2, MoreVertical, Edit, Trash2, Eye, AlertCircle, X } from "lucide-react";
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
    loadUsers,
    deletePlanification
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
  
  // Create/Edit Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Dropdown & Delete State
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [actionError, setActionError] = useState("");

  const handleEditClick = (e, row) => {
    e.stopPropagation();
    setOpenDropdown(null);
    setEditData(row);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setOpenDropdown(null);
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      setActionError("");
      await deletePlanification(deleteModal.id);
      setDeleteModal({ isOpen: false, id: null });
      fetchAll();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || "Erreur de suppression.");
    }
  };

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
      if (planData.meta) {
        setMeta(prev => ({ 
          ...prev, 
          total: planData.meta.total,
          totalPages: planData.meta.totalPages
        }));
      }
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
    },
    {
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="relative flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === row.id ? null : row.id);
            }} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {openDropdown === row.id && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdown(null);
                  }}
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: -10 }} 
                  className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 shadow-lg rounded-xl z-20 py-1 overflow-hidden"
                >
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/planification/${row.id}`); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Eye className="w-4 h-4" /> Voir
                  </button>
                  <button onClick={(e) => handleEditClick(e, row)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors">
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={(e) => handleDeleteClick(e, row.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
              onClick={() => { setEditData(null); setIsCreateModalOpen(true); }}
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

              {/* Data Table Area */}
              <div className="mt-4">
                {loading && data.length === 0 ? (
                   <div className="p-8 text-center space-y-4">
                     <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-slate-500 text-sm">Chargement des planifications...</p>
                   </div>
                ) : data.length === 0 ? (
                   <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center">
                     <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                       <BarChart2 className="w-8 h-8" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-700 mb-1">Aucune planification</h3>
                     <p className="text-slate-500 text-sm max-w-sm mb-6">Nous n'avons trouvé aucune planification correspondant à vos critères de recherche.</p>
                     <button
                        onClick={() => handleFilterChange({search: '', bom_id: '', matricule_gl: '', matricule_superviseur: '', date_debut: '', date_fin: '', status: ''})}
                        className="text-blue-600 bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                     >
                       Réinitialiser les filtres
                     </button>
                   </div>
                ) : (
                  <div className="space-y-4">
                    <DataTable
                      columns={columns}
                      data={data}
                      loading={loading}
                      onRowClick={(row) => router.push(`/planification/${row.id}`)}
                      pagination={{
                        page: meta.page,
                        limit: meta.limit,
                        total: meta.total,
                        totalPages: meta.totalPages
                      }}
                      onPageChange={(newPage) => setMeta(prev => ({ ...prev, page: newPage }))}
                    />
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
        onClose={() => { setIsCreateModalOpen(false); setEditData(null); }}
        onSubmit={async () => {
          setIsCreateModalOpen(false);
          setEditData(null);
          fetchAll();
        }}
        initialData={editData}
        boms={boms}
        users={users}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Supprimer la planification ?</h3>
                <p className="text-sm text-slate-500 mb-6">Cette action supprimera définitivement la planification. Si des panneaux ou un historique sont liés, la suppression sera bloquée pour préserver l'intégrité des données.</p>
                
                {actionError && (
                  <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 text-rose-700 text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{actionError}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setDeleteModal({ isOpen: false, id: null }); setActionError(""); }} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
                  <button onClick={confirmDelete} className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
