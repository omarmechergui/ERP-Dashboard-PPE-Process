import React from 'react';
import { Users, UserCheck, UserX, Network, Briefcase, Wrench, FileEdit, Clock, CheckCircle, XCircle, Archive } from 'lucide-react';

function StatCard({ title, value, icon: Icon, trend, colorClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

export function StatisticsCards({ stats, workflowStats }) {
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-4">
      {workflowStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Brouillons"
            value={workflowStats.brouillon}
            icon={FileEdit}
            colorClass="bg-slate-100 text-slate-600"
          />
          <StatCard
            title="En validation"
            value={workflowStats.en_validation}
            icon={Clock}
            colorClass="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Validés"
            value={workflowStats.valide}
            icon={CheckCircle}
            colorClass="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title="Rejetés"
            value={workflowStats.rejete}
            icon={XCircle}
            colorClass="bg-red-100 text-red-600"
          />
          <StatCard
            title="Archivés"
            value={workflowStats.archive}
            icon={Archive}
            colorClass="bg-gray-100 text-gray-600"
          />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        title="Total Employés"
        value={stats.total}
        icon={Users}
        colorClass="bg-blue-50 text-blue-600"
      />
      <StatCard
        title="Managers"
        value={stats.managers}
        icon={Network}
        colorClass="bg-indigo-50 text-indigo-600"
      />
      <StatCard
        title="Départements"
        value={stats.departments}
        icon={Briefcase}
        colorClass="bg-purple-50 text-purple-600"
      />
      <StatCard
        title="Techniciens"
        value={stats.technicians}
        icon={Wrench}
        colorClass="bg-orange-50 text-orange-600"
      />
      <StatCard
        title="Actifs"
        value={stats.active}
        icon={UserCheck}
        colorClass="bg-emerald-50 text-emerald-600"
        trend="+2"
      />
      <StatCard
        title="Inactifs / Congés"
        value={stats.inactive}
        icon={UserX}
        colorClass="bg-slate-50 text-slate-600"
      />
    </div>
    </div>
  );
}
