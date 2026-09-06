import React from 'react';

export default function LoadingSkeleton({ type = 'table' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[130px] bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col justify-between animate-pulse">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-secondary"></div>
              <div className="w-16 h-5 rounded-full bg-secondary"></div>
            </div>
            <div>
              <div className="h-3 w-24 bg-secondary rounded mb-3"></div>
              <div className="h-8 w-16 bg-secondary rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[130px] bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col justify-between animate-pulse">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-secondary"></div>
                <div className="w-16 h-5 rounded-full bg-secondary"></div>
              </div>
              <div>
                <div className="h-3 w-24 bg-secondary rounded mb-3"></div>
                <div className="h-8 w-16 bg-secondary rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-16 bg-card rounded-xl border border-border shadow-sm animate-pulse flex items-center px-4 gap-4">
          <div className="h-10 w-48 bg-secondary rounded-lg"></div>
          <div className="h-10 w-32 bg-secondary rounded-lg"></div>
        </div>
        <div className="h-96 bg-card rounded-xl border border-border shadow-sm animate-pulse p-6">
          <div className="h-8 w-64 bg-secondary rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-secondary/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: table
  return (
    <div className="w-full bg-card rounded-xl border border-border overflow-hidden shadow-sm animate-pulse">
      <div className="h-12 bg-secondary border-b border-border"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 border-b border-border flex items-center px-6 gap-4">
           <div className="h-4 bg-secondary rounded w-1/4"></div>
           <div className="h-4 bg-secondary rounded w-1/4"></div>
           <div className="h-4 bg-secondary rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}
