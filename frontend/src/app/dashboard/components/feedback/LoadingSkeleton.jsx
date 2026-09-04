import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div>
          <div className="h-9 w-72 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-44 bg-slate-100 rounded-full"></div>
          <div className="h-9 w-9 bg-slate-100 rounded-full"></div>
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-10 w-96 bg-slate-100 rounded-xl"></div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-36">
            <div className="flex justify-between mb-4">
              <div className="h-10 w-10 bg-slate-100 rounded-xl"></div>
              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
              <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-96">
            <div className="h-5 w-48 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-3 w-32 bg-slate-100 rounded-md mb-6"></div>
            <div className="h-64 bg-slate-50 rounded-xl"></div>
          </div>
        ))}
      </div>

      {/* Widgets Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-80">
            <div className="h-5 w-40 bg-slate-200 rounded-lg mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-12 bg-slate-50 rounded-xl"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
