/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Package, Clock, CheckCircle, XCircle, ShoppingBag, RefreshCw, Archive } from "lucide-react";
import API from "@/lib/api";
import { useAuth } from "@/lib/auth";

import ReservationForm from "./components/ReservationForm";
import ReservationTable from "./components/ReservationTable";
import ReservationFilters from "./components/ReservationFilters";
import ReservationBulkActions from "./components/ReservationBulkActions";
import ReservationDetailsDrawer from "./components/ReservationDetailsDrawer";

export default function ReservationPage() {
  const { user } = useAuth();
  const isWriteAllowed = user && ['ADMIN', 'GL'].includes(user.role);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
  });

  // UI State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/reservations");
      setReservations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations, refreshKey]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const total = reservations.length;
    const enAttente = reservations.filter(r => r.status === "EN_ATTENTE").length;
    const validees = reservations.filter(r => r.status === "VALIDEE").length;
    const consumed = reservations.filter(r => r.status === "CONSUMED").length;
    const terminees = reservations.filter(r => r.status === "TERMINE").length;
    const annulees = reservations.filter(r => r.status === "ANNULEE").length;

    return { total, enAttente, validees, consumed, terminees, annulees };
  }, [reservations]);

  const handleReservationCreated = () => {
    setIsWizardOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "ALL" });
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Status filter
      if (filters.status !== "ALL" && r.status !== filters.status) return false;

      // Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const ref = (r.reference || "").toLowerCase();
        const client = (r.client || "").toLowerCase();
        const hasArticle = r.lignes?.some(l =>
          (l.article?.nom_article || "").toLowerCase().includes(q) ||
          (l.article_id || "").toLowerCase().includes(q)
        );
        if (!ref.includes(q) && !client.includes(q) && !hasArticle) return false;
      }
      return true;
    });
  }, [reservations, filters]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Réservations de Stock
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Centre de contrôle des réservations et de la disponibilité des articles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
            {isWriteAllowed && (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Réservation
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            title="Total"
            value={kpis.total}
            icon={<Package className="w-5 h-5 text-blue-600" />}
            bg="bg-blue-50"
            onClick={() => setFilters({ ...filters, status: "ALL" })}
            active={filters.status === "ALL"}
          />
          <KpiCard
            title="En Attente"
            value={kpis.enAttente}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            bg="bg-amber-50"
            onClick={() => setFilters({ ...filters, status: "EN_ATTENTE" })}
            active={filters.status === "EN_ATTENTE"}
          />
          <KpiCard
            title="Validées"
            value={kpis.validees}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            bg="bg-emerald-50"
            onClick={() => setFilters({ ...filters, status: "VALIDEE" })}
            active={filters.status === "VALIDEE"}
          />
          <KpiCard
            title="Consommées"
            value={kpis.consumed}
            icon={<ShoppingBag className="w-5 h-5 text-violet-600" />}
            bg="bg-violet-50"
            onClick={() => setFilters({ ...filters, status: "CONSUMED" })}
            active={filters.status === "CONSUMED"}
          />
          <KpiCard
            title="Terminées"
            value={kpis.terminees}
            icon={<Archive className="w-5 h-5 text-slate-500" />}
            bg="bg-slate-100"
            onClick={() => setFilters({ ...filters, status: "TERMINE" })}
            active={filters.status === "TERMINE"}
          />
          <KpiCard
            title="Annulées"
            value={kpis.annulees}
            icon={<XCircle className="w-5 h-5 text-rose-600" />}
            bg="bg-rose-50"
            onClick={() => setFilters({ ...filters, status: "ANNULEE" })}
            active={filters.status === "ANNULEE"}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">

          <ReservationFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
          />

          <ReservationBulkActions
            selectedIds={selectedRowIds}
            onClearSelection={() => setSelectedRowIds([])}
            onActionComplete={handleRefresh}
            isWriteAllowed={isWriteAllowed}
          />

          <ReservationTable
            reservations={filteredReservations}
            loading={loading}
            selectedRowIds={selectedRowIds}
            setSelectedRowIds={setSelectedRowIds}
            onRowClick={(id) => setSelectedReservationId(id)}
            onActionComplete={handleRefresh}
            isWriteAllowed={isWriteAllowed}
          />
        </div>
      </div>

      {/* Overlays */}
      {isWizardOpen && (
        <ReservationForm
          onClose={() => setIsWizardOpen(false)}
          onReservationCreated={handleReservationCreated}
        />
      )}

      {selectedReservationId && (
        <ReservationDetailsDrawer
          reservationId={selectedReservationId}
          reservations={reservations}
          onClose={() => setSelectedReservationId(null)}
          onUpdate={handleRefresh}
          isWriteAllowed={isWriteAllowed}
        />
      )}
    </div>
  );
}

function KpiCard({ title, value, icon, bg, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border ${active ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200'} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className={`p-1.5 rounded-lg ${bg}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
