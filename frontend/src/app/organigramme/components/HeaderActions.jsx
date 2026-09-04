import React from 'react';
import { RefreshCw, Download, Maximize } from 'lucide-react';

export function HeaderActions({ onRefresh, onExport, onFullScreen }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Organigramme
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Visualisation de la hiérarchie de l&apos;entreprise
        </p>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onRefresh}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
        
        <button
          onClick={onExport}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          title="Exporter en PDF"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={onFullScreen}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          title="Plein écran"
        >
          <Maximize className="w-4 h-4" />
          <span className="hidden sm:inline">Plein écran</span>
        </button>
      </div>
    </div>
  );
}
