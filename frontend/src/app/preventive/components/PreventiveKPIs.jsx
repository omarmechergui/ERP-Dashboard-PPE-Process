import React from 'react';
import KPICard from '../../interventions/components/dashboard/KPICard';
import { ClipboardList, Clock, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';

export default function PreventiveKPIs({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KPICard
        title="Total des plans"
        value={stats.total || 0}
        icon={ClipboardList}
        color="indigo"
      />
      <KPICard
        title="À Faire"
        value={stats.toDo || 0}
        icon={Clock}
        color="blue"
      />
      <KPICard
        title="En Retard"
        value={stats.overdue || 0}
        icon={AlertTriangle}
        color="red"
      />
      <KPICard
        title="Terminés"
        value={stats.completed || 0}
        icon={CheckCircle}
        color="emerald"
      />
      <KPICard
        title="Prochains 7 jours"
        value={stats.upcoming || 0}
        icon={CalendarDays}
        color="amber"
      />
    </div>
  );
}
