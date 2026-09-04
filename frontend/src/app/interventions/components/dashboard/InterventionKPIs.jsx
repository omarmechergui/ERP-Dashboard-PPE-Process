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
        title="Temps Moyen Rép. (MTTR)"
        value={stats.mttr || "0h"}
        icon={Timer}
        color="amber"
      />
      <KPICard
        title="Temps Moyen Rép. (Réponse)"
        value={stats.avgResponse || "0m"}
        icon={Clock}
        color="indigo"
      />
      <KPICard
        title="Taux de Complétion"
        value={`${stats.completionRate || 0}%`}
        icon={Percent}
        color="emerald"
      />
      <KPICard
        title="Disponibilité Machine"
        value={stats.availability || "0%"}
        icon={Power}
        color="blue"
      />
    </div>
  );
}
