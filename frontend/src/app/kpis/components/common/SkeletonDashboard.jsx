import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonDashboard() {
  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-10 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse"></div>
              <div className="w-16 h-6 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
            <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
            <div className="w-24 h-8 bg-slate-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-80 animate-pulse flex flex-col">
          <div className="w-48 h-6 bg-slate-200 rounded mb-6"></div>
          <div className="flex-1 bg-slate-50 rounded-xl"></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-80 animate-pulse flex flex-col">
          <div className="w-48 h-6 bg-slate-200 rounded mb-6"></div>
          <div className="flex-1 bg-slate-50 rounded-xl"></div>
        </div>
      </div>
      
      {/* Third Row Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-64 animate-pulse flex flex-col">
        <div className="w-48 h-6 bg-slate-200 rounded mb-6"></div>
        <div className="flex-1 bg-slate-50 rounded-xl"></div>
      </div>
    </div>
  );
}
