import React from 'react';
import KPICard from './KPICard';
import { ClipboardList, Activity, CheckCircle, AlertTriangle, Clock, Timer, Percent, Power } from 'lucide-react';

export default function InterventionKPIs({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Total Interventions"
        value={stats.total || 0}
        icon={ClipboardList}
        color="indigo"
      />
      <KPICard
        title="En cours"
        value={stats.inProgress || 0}
        icon={Activity}
        color="blue"
      />
      <KPICard
        title="Terminées"
        value={stats.completed || 0}
        icon={CheckCircle}
        color="emerald"
        trend={2.4}
        trendLabel="vs mois dernier"
      />
      <KPICard
        title="Critiques"
        value={stats.critical || 0}
        icon={AlertTriangle}
        color="red"
      />
      <KPICard
        title="MTTR"
        value={stats.mttr ? stats.mttr.replace('h', ' min') : "0 min"}
        icon={Timer}
        color="amber"
        qualityData={stats.mttrQuality ? {
          percentage: stats.mttrQuality.qualityPercentage || 0,
          valid: stats.mttrQuality.validCount || 0,
          eligible: stats.mttrQuality.eligibleCount || 0,
          eligibleLabel: 'interventions',
          tooltip: 'Pourcentage des interventions éligibles disposant des données nécessaires au calcul du MTTR.'
        } : null}
      />
      <KPICard
        title="MTBF"
        value={stats.mtbf ? stats.mtbf.replace('h', ' min') : "0 min"}
        icon={Clock}
        color="indigo"
        qualityData={stats.mtbfQuality ? {
          percentage: stats.mtbfQuality.qualityPercentage || 0,
          valid: stats.mtbfQuality.validCount || 0,
          eligible: stats.mtbfQuality.eligibleCount || 0,
          eligibleLabel: 'éligibles',
          tooltip: 'Pourcentage des données éligibles disposant des informations nécessaires au calcul du MTBF.'
        } : null}
      />
      <KPICard
        title="Taux de Complétion"
        value={`${stats.completionRate || 0}%`}
        icon={Percent}
        color="emerald"
      />
      
    </div>
  );
}
