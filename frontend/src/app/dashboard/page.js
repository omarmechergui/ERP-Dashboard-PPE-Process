'use client';

import React from 'react';
import {
  BarChart2,
  Boxes,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  BookmarkPlus,
  Factory,
  Layers
} from 'lucide-react';

import { useDashboardData } from './components/hooks/useDashboardData';

import DashboardHeader from './components/layout/DashboardHeader';
import FilterBar from './components/layout/FilterBar';
import KPICard from './components/kpi/KPICard';
import ProjectProgressChart from './components/charts/ProjectProgressChart';
import StockMovementChart from './components/charts/StockMovementChart';
import ProductionStatus from './components/widgets/ProductionStatus';
import CriticalStockPanel from './components/widgets/CriticalStockPanel';
import RecentActivityTimeline from './components/widgets/RecentActivityTimeline';
import RankingsWidget from './components/widgets/RankingsWidget';
import MovementsTable from './components/table/MovementsTable';
import LoadingSkeleton from './components/feedback/LoadingSkeleton';

export default function DashboardPage() {
  const {
    kpis, kpisLoading, kpisError,
    projectProgress, projectProgressLoading, projectProgressError,
    stockStats, stockStatsLoading, stockStatsError,
    recentMovements, recentMovementsLoading, recentMovementsError,
    criticalStockItems, criticalStockItemsLoading, criticalStockItemsError,
    technicians, techniciansLoading, techniciansError,
    syncTime,
    refreshData
  } = useDashboardData();

  // If a critical error happens (e.g. all fail or a major one fails), we can still show a global error if desired.
  // But per instructions, do not show a full-page error unless a truly critical dependency fails. 
  // Let's remove the global error screen and rely on widgets' internal error handling.

  // KPI card configurations — 4 from real API, 4 mocked placeholders
  const kpiCards = [
    {
      title: 'Panneaux en Cours',
      value: kpis?.panneaux_en_cours ?? 0,
      icon: BarChart2,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      title: 'Terminés Aujourd\'hui',
      value: kpis?.termines_aujourdhui ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
      trend: (kpis?.termines_aujourdhui ?? 0) > 0 ? 'Actif' : '-',
      trendUp: (kpis?.termines_aujourdhui ?? 0) > 0,
    },
    {
      title: 'Stock Critique',
      value: kpis?.articles_critique > 0
        ? `${kpis.articles_critique}`
        : '0',
      icon: Boxes,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      border: 'border-rose-200',
      trend: kpis?.articles_critique > 0 ? `${kpis.articles_critique} art.` : 'Aucun',
      trendUp: !(kpis?.articles_critique > 0),
    },
    {
      title: 'Réservations Actives',
      value: kpis?.reservations_actives ?? 0,
      icon: BookmarkPlus,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      trend: (kpis?.reservations_actives ?? 0) > 0 ? 'En cours' : '-',
      trendUp: true,
    },
    {
      title: 'Planifications Actives',
      value: kpis?.planifications_actives ?? 0,
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200',
      trend: 'En cours',
      trendUp: true,
    },
    {
      title: 'Conformité KHM',
      value: `${kpis?.taux_conformite_khm ?? 0}%`,
      icon: ShieldCheck,
      color: 'text-teal-600',
      bg: 'bg-teal-100',
      border: 'border-teal-200',
      trend: `${kpis?.taux_conformite_khm ?? 0}%`,
      trendUp: (kpis?.taux_conformite_khm ?? 0) >= 80,
    },
    {
      title: 'Production Aujourd\'hui',
      value: kpis?.production_aujourdhui ?? 0,
      icon: Factory,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      trend: (kpis?.production_aujourdhui ?? 0) > 0 ? 'Actif' : '-',
      trendUp: true,
    },
    {
      title: 'BOM Actives',
      value: kpis?.boms_actives ?? 0,
      icon: Layers,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
      trend: 'En cours',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-7 max-w-[1600px] mx-auto p-2 pb-10">
      {/* Row 0: Header */}
      <DashboardHeader syncTime={syncTime} onRefresh={refreshData} />

      {/* Row 0.5: Filter Bar & Quick Actions */}
      <div className="space-y-4">
        <FilterBar />
        {/* <QuickActions /> */}
      </div>

      {/* Row 1: 8 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <KPICard 
            key={card.title} 
            {...card} 
            loading={kpisLoading} 
            error={kpisError}
            delay={i * 0.08} 
          />
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressChart 
          projectProgress={projectProgress} 
          loading={projectProgressLoading}
          error={projectProgressError}
        />
        <StockMovementChart 
          stockStats={stockStats} 
          loading={stockStatsLoading}
          error={stockStatsError}
        />
      </div>

      {/* Row 3: Production Status + Critical Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionStatus />
        <CriticalStockPanel 
          criticalStockItems={criticalStockItems} 
          loading={criticalStockItemsLoading}
          error={criticalStockItemsError}
        />
      </div>

      {/* Row 4: Timeline + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityTimeline 
          recentMovements={recentMovements} 
          loading={recentMovementsLoading}
          error={recentMovementsError}
        />
        <RankingsWidget 
          projectProgress={projectProgress} 
          technicians={technicians} 
          loading={techniciansLoading || projectProgressLoading}
          error={techniciansError || projectProgressError}
        />
      </div>

      {/* Row 5: Stock Movements Table */}
      <MovementsTable 
        recentMovements={recentMovements} 
        loading={recentMovementsLoading}
        error={recentMovementsError}
      />
    </div>
  );
}
