import React from "react";
import { Plus, RefreshCw, UploadCloud } from "lucide-react";
import ExportMenu from "./export/ExportMenu";

export const StockHeader = ({ isWriteAllowed, onAddArticle, onRefresh, onImport, lastSync, data, userRole, filters }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          Stock & Inventaire
        </h1>
        <p className="text-sm text-secondary-foreground mt-2 font-medium flex items-center gap-2">
          Gestion des matières premières et consommables
          <span className="text-border">•</span>
          <span className="flex items-center gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            Dernière synchro: {lastSync || "À l'instant"}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors border border-transparent"
          title="Actualiser les données"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <ExportMenu data={data} userRole={userRole} moduleName="Stock" filters={filters} />
        
        {isWriteAllowed && (
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="bg-secondary/50 border border-border hover:bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Import Excel</span>
            </button>
            <button
              onClick={onAddArticle}
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Article</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
