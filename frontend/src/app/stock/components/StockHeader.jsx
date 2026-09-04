import React from "react";
import { Plus, RefreshCw, UploadCloud } from "lucide-react";
import ExportMenu from "./export/ExportMenu";

export const StockHeader = ({ isWriteAllowed, onAddArticle, onRefresh, onImport, lastSync, data, userRole, filters }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock & Inventory</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-slate-500">
            Enterprise Materials Management
          </p>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Last synced: {lastSync || "Just now"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          title="Refresh Data"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <ExportMenu data={data} userRole={userRole} moduleName="Stock" filters={filters} />
        
        {isWriteAllowed && (
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={onAddArticle}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Quick Add Article</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
