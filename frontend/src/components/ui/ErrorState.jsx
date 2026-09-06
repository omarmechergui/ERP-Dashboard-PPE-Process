import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-xl border border-danger/20 shadow-sm w-full">
      <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4">
        <AlertOctagon className="w-8 h-8 text-danger" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">Erreur système</h3>
      <p className="text-sm text-secondary-foreground max-w-md mx-auto mb-6">
        {error || "Une erreur inattendue s'est produite lors du chargement des données. Veuillez réessayer ou contacter le support."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary hover:text-primary transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}
