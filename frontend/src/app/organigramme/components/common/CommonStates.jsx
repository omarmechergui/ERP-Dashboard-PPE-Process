import React from 'react';
import { Users, RefreshCw, AlertOctagon } from 'lucide-react';

export function EmptyState({ title = "Aucune donnée", message = "Aucun collaborateur trouvé." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-dashed border-gray-300">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{message}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="p-6 w-full mx-auto space-y-6">
      {/* Dashboard KPI Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-100 mb-4"></div>
            <div className="h-6 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse flex items-center px-4 gap-4">
        <div className="h-10 w-64 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
      </div>

      {/* Chart Skeleton */}
      <div className="h-[500px] bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse p-6 flex flex-col items-center justify-start pt-10">
        <div className="w-48 h-20 bg-gray-200 rounded-lg mb-8"></div>
        <div className="flex gap-8">
           <div className="w-48 h-20 bg-gray-100 rounded-lg"></div>
           <div className="w-48 h-20 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-red-100 shadow-sm">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertOctagon className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Erreur système</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
        {error || "Une erreur est survenue lors du chargement de l'organigramme."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
