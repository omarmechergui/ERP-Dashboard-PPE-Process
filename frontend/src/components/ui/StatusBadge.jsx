import React from 'react';

const STATUS_CONFIG = {
  SUCCESS: { icon: '✓', colors: 'text-success bg-success/10 border-success/20' },
  WARNING: { icon: '!', colors: 'text-warning bg-warning/10 border-warning/20' },
  DANGER: { icon: '×', colors: 'text-danger bg-danger/10 border-danger/20' },
  INFO: { icon: '●', colors: 'text-info bg-info/10 border-info/20' },
  NEUTRAL: { icon: '○', colors: 'text-neutral bg-neutral/10 border-neutral/20' },
  PLANIFIEE: { icon: '○', colors: 'text-blue-700 bg-blue-100 border-blue-200' },
  ANNULEE: { icon: '×', colors: 'text-rose-700 bg-rose-100 border-rose-200' },
};

export default function StatusBadge({ status, label }) {
  // Infer configuration from common keywords if no explicit status is provided
  let configKey = 'NEUTRAL';
  const labelLower = (label || '').toLowerCase();
  const statusLower = (status || '').toLowerCase();
  
  const strToMatch = labelLower || statusLower;

  if (['réussi', 'terminée', 'conforme', 'validée', 'active', 'termine', 'success', 'done'].includes(strToMatch) || strToMatch.includes('termin')) {
    configKey = 'SUCCESS';
  } else if (['à venir', 'en attente', 'planifiée', 'attention', 'warning', 'pending', 'planned'].includes(strToMatch)) {
    configKey = 'WARNING';
  } else if (['échec', 'en retard', 'annulée', 'non conforme', 'danger', 'failed', 'cancelled', 'retard'].includes(strToMatch)) {
    configKey = 'DANGER';
  } else if (['en cours', 'en validation', 'info', 'progress', 'khm'].includes(strToMatch)) {
    configKey = 'INFO';
  }

  // Explicit override via status prop if it matches our keys
  if (status && STATUS_CONFIG[status.toUpperCase()]) {
    configKey = status.toUpperCase();
  }

  const { icon, colors } = STATUS_CONFIG[configKey];
  const displayLabel = label || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors}`}>
      <span>{icon}</span>
      {displayLabel}
    </span>
  );
}
