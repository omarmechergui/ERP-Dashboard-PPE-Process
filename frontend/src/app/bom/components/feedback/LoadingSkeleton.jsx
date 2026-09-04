import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
      
      {/* Statistics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 h-24 flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
              <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex gap-6 h-[calc(100vh-16rem)] min-h-[480px]">
        {/* Sidebar Skeleton */}
        <div className="w-80 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
          <div className="h-8 w-full bg-slate-100 rounded-lg"></div>
          <div className="space-y-3 mt-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
              <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
            </div>
            <div className="h-9 w-32 bg-slate-100 rounded-xl"></div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-slate-100 rounded-md"></div>
                <div className="h-10 w-full bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 mt-4"></div>
        </div>
      </div>
    </div>
  );
}
