import React from 'react';

const STATUS_CONFIG = {
  // Explicit Planification Statuses
  BROUILLON: { icon: '○', colors: 'text-slate-700 bg-slate-100 border-slate-200' },
  PLANIFIEE: { icon: '📅', colors: 'text-blue-700 bg-blue-100 border-blue-200' },
  EN_PRODUCTION: { icon: '⚙️', colors: 'text-amber-700 bg-amber-100 border-amber-200' },
  TERMINEE: { icon: '✓', colors: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  ANNULEE: { icon: '×', colors: 'text-rose-700 bg-rose-100 border-rose-200' },

  // Panneaux/Construction Statuses
  EN_CONSTRUCTION: { icon: '🔨', colors: 'text-amber-700 bg-amber-100 border-amber-200' },
  EN_VALIDATION: { icon: '🔍', colors: 'text-blue-700 bg-blue-100 border-blue-200' },
  TERMINE: { icon: '✓', colors: 'text-emerald-700 bg-emerald-100 border-emerald-200' },

  // Fallbacks
  SUCCESS: { icon: '✓', colors: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
  WARNING: { icon: '!', colors: 'text-amber-700 bg-amber-100 border-amber-200' },
  DANGER: { icon: '×', colors: 'text-rose-700 bg-rose-100 border-rose-200' },
  INFO: { icon: '●', colors: 'text-blue-700 bg-blue-100 border-blue-200' },
  NEUTRAL: { icon: '○', colors: 'text-slate-700 bg-slate-100 border-slate-200' },
};

export default function StatusBadge({ status, label, className = '' }) {
  let configKey = 'NEUTRAL';
  let displayLabel = label || status || 'Inconnu';

  // Explicit override via status prop if it matches our keys
  if (status && STATUS_CONFIG[status.toUpperCase()]) {
    configKey = status.toUpperCase();
    if (!label) {
       // Format explicitly mapped statuses well
       if (status === 'EN_PRODUCTION') displayLabel = 'En Production';
       else if (status === 'EN_CONSTRUCTION') displayLabel = 'En Construction';
       else if (status === 'EN_VALIDATION') displayLabel = 'En Validation';
       else if (status === 'TERMINEE' || status === 'TERMINE') displayLabel = 'Terminé';
       else displayLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  } else {
    // Fallback logic for dynamic words
    const strToMatch = (label || status || '').toLowerCase();
    
    if (['réussi', 'terminée', 'conforme', 'validée', 'active', 'termine', 'success', 'done'].includes(strToMatch) || strToMatch.includes('termin')) {
      configKey = 'SUCCESS';
    } else if (['à venir', 'en attente', 'planifiée', 'attention', 'warning', 'pending', 'planned'].includes(strToMatch)) {
      configKey = 'WARNING';
    } else if (['échec', 'en retard', 'annulée', 'non conforme', 'danger', 'failed', 'cancelled', 'retard'].includes(strToMatch)) {
      configKey = 'DANGER';
    } else if (['en cours', 'en validation', 'info', 'progress', 'khm'].includes(strToMatch)) {
      configKey = 'INFO';
    }
  }

  const { icon, colors } = STATUS_CONFIG[configKey] || STATUS_CONFIG.NEUTRAL;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors} ${className}`}>
      <span className="text-[10px]">{icon}</span>
      {displayLabel}
    </span>
  );
}
