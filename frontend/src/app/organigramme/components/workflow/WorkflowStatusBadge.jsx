import React from 'react';
import { Clock, CheckCircle, XCircle, Archive, Edit3 } from 'lucide-react';

export function WorkflowStatusBadge({ status, className = "" }) {
  const configs = {
    BROUILLON: {
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Edit3,
      label: 'Brouillon'
    },
    EN_VALIDATION: {
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Clock,
      label: 'En Validation'
    },
    VALIDE: {
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      label: 'Validé'
    },
    REJETE: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      label: 'Rejeté'
    },
    ARCHIVE: {
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      icon: Archive,
      label: 'Archivé'
    }
  };

  const config = configs[status] || configs.BROUILLON;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
