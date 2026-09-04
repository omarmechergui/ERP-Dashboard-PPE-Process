import React from 'react';

export default function LoadingState() {
  return (
    <div className="p-6 w-full mx-auto space-y-6">
      {/* Dashboard KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between animate-pulse">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-gray-100"></div>
              <div className="w-16 h-6 rounded bg-gray-100"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse flex items-center px-4 gap-4">
        <div className="h-10 w-48 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
      </div>

      {/* Main Content Area Skeleton (Table/Timeline) */}
      <div className="h-96 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse p-6">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-50 rounded-lg flex items-center px-4">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
