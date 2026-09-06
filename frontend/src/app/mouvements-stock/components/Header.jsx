import React from "react";
import { ArrowDownRight, ArrowUpLeft, Download, RefreshCw, UploadCloud } from "lucide-react";

export const Header = ({ isMoveAllowed, onRefresh, onNewEntry, onNewExit, onImport, lastSync }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          Mouvements de Stock
        </h1>
        <p className="text-sm text-secondary-foreground mt-2 font-medium flex items-center gap-2">
          Suivi et audit des transactions d&apos;inventaire
          <span className="text-border">•</span>
          <span className="flex items-center gap-1 text-xs">
            <RefreshCw className="h-3 w-3" />
            Synchro: {lastSync || "À l'instant"}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-secondary rounded-xl transition-colors border border-transparent"
          title="Actualiser"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <button
          className="p-2.5 text-secondary-foreground hover:text-primary hover:bg-secondary rounded-xl transition-colors border border-transparent"
          title="Exporter"
        >
          <Download className="h-5 w-5" />
        </button>
        
        {isMoveAllowed && (
          <div className="flex gap-2">
            <button
              onClick={onImport}
              className="bg-secondary/50 border border-border hover:bg-secondary text-foreground px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={onNewEntry}
              className="bg-success/10 border border-success/30 hover:bg-success/20 text-success px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Entrée</span>
            </button>
            <button
              onClick={onNewExit}
              className="bg-danger/10 border border-danger/30 hover:bg-danger/20 text-danger px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <ArrowUpLeft className="h-4 w-4" />
              <span>Sortie</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
