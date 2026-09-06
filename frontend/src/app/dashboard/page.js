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

import PageHeader from '../../components/ui/PageHeader';
import FilterBar from './components/layout/FilterBar';
import KPICard from '../../components/ui/KPICard';
import ProjectProgressChart from './components/charts/ProjectProgressChart';
import StockMovementChart from './components/charts/StockMovementChart';
import ProductionStatus from './components/widgets/ProductionStatus';
import CriticalStockPanel from './components/widgets/CriticalStockPanel';
import RecentActivityTimeline from './components/widgets/RecentActivityTimeline';
import RankingsWidget from './components/widgets/RankingsWidget';
import MovementsTable from './components/table/MovementsTable';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

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

  const kpiCards = [
    {
      title: 'Panneaux en Cours',
      value: kpis?.panneaux_en_cours ?? 0,
      icon: BarChart2,
      status: 'info',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      title: 'Terminés Aujourd\'hui',
      value: kpis?.termines_aujourdhui ?? 0,
      icon: CheckCircle2,
      status: 'success',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Opérateurs Actifs',
      value: technicians?.filter(t => t.statut === 'ACTIF').length ?? 0,
      icon: Factory,
      status: 'neutral',
      trend: 'Normal',
      trendUp: true,
    },
    {
      title: 'Articles en Rupture',
      value: criticalStockItems?.length ?? 0,
      icon: ShieldCheck,
      status: 'danger',
      trend: '-2',
      trendUp: true,
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Factory}
        title="Tableau de Bord MES" 
        description={`Dernière synchro : ${syncTime ? syncTime.toLocaleTimeString() : '--:--:--'}`}
      />

      {/* Row 0.5: Filter Bar & Quick Actions */}
      <div className="space-y-4">
        <FilterBar />
        {/* <QuickActions /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            status={kpi.status}
            trend={kpi.trend}
            trendUp={kpi.trendUp}
            delay={index * 0.1}
            loading={kpisLoading || techniciansLoading || criticalStockItemsLoading}
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
