import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = "Aucune donnée", 
  message = "Aucun élément n'a été trouvé.", 
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card rounded-xl border border-dashed border-border shadow-sm w-full">
      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-secondary-foreground max-w-sm mx-auto mb-6">{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
