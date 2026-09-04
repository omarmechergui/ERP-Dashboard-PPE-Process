import React from "react";
import { ArrowDownRight, ArrowUpLeft, Download, RefreshCw, UploadCloud } from "lucide-react";

export const Header = ({ isMoveAllowed, onRefresh, onNewEntry, onNewExit, onImport, lastSync }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Movements</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-slate-500">
            Audit and track all inventory transactions
          </p>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Synced: {lastSync || "Just now"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          title="Refresh Data"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <button
          className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          title="Export Report"
        >
          <Download className="h-5 w-5" />
        </button>
        
        {isMoveAllowed && (
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={onNewEntry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Receive Stock</span>
            </button>
            <button
              onClick={onNewExit}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
            >
              <ArrowUpLeft className="h-4 w-4" />
              <span>Issue Stock</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
