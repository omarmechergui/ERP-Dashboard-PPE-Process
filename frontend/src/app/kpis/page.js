'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { useMaintenanceKpis } from './hooks/useMaintenanceKpis';

import DashboardHeader from './components/dashboard/DashboardHeader';
import KPIGrid from './components/dashboard/KPIGrid';

import MTTRChart from './components/kpi/MTTRChart';
import ABCChart from './components/kpi/ABCChart';
import HeatmapChart from './components/kpi/HeatmapChart';
import PlanningTimeline from './components/kpi/PlanningTimeline';

import SkeletonDashboard from './components/common/SkeletonDashboard';
import EmptyState from './components/common/EmptyState';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function KpisPage() {
  const { data, loading, error, syncTime, period, changePeriod, refreshData } = useMaintenanceKpis('month');

  if (loading) return <SkeletonDashboard />;
  
  if (error) return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-sm max-w-md text-center">
        <h3 className="text-rose-800 font-bold text-xl mb-1">Erreur de chargement</h3>
        <p className="text-rose-600 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="px-6 py-2.5 bg-white text-rose-700 text-sm font-bold border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
        >
          Réessayer
        </button>
      </div>
    </div>
  );

  if (!data) return <EmptyState onRefresh={refreshData} />;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        <DashboardHeader
          syncTime={syncTime}
          onRefresh={refreshData}
          period={period}
          onPeriodChange={changePeriod}
          data={data}
        />

        <KPIGrid kpis={data.kpis} trends={data.trends} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <MTTRChart data={data.mttrData} />
          </motion.div>

          <motion.div variants={itemVariants} className="xl:col-span-1">
            <ABCChart data={data.abcData} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <HeatmapChart data={data.heatmapData} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PlanningTimeline planning={data.planning} />
        </motion.div>

      </div>
    </div>
  );
}
