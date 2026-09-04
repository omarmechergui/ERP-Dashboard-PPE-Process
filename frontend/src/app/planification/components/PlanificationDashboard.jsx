import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Activity, CheckCircle, Clock, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = {
  BROUILLON: '#94a3b8',
  PLANIFIE: '#3b82f6',
  EN_PRODUCTION: '#9333ea',
  TERMINE: '#059669',
  ANNULE: '#e11d48'
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

export default function PlanificationDashboard({ stats, statusDistribution, timelineData }) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "Total Actives",
            value: stats.totalActive,
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-100",
            border: "border-blue-200",
            trend: "+2"
          },
          {
            title: "En Production",
            value: stats.inProduction,
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-100",
            border: "border-purple-200",
            trend: "En cours"
          },
          {
            title: "Terminées",
            value: stats.completed,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-100",
            border: "border-emerald-200",
            trend: "Ce mois"
          },
          {
            title: "En Retard",
            value: stats.delayed,
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-100",
            border: "border-rose-200",
            trend: "Attention",
            alert: stats.delayed > 0
          },
          {
            title: "Avancement Global",
            value: `${stats.globalProgress}%`,
            icon: Clock,
            color: "text-slate-700",
            bg: "bg-slate-100",
            border: "border-slate-200",
            trend: "Moyenne"
          }
        ].map((card, i) => (
          <motion.div
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            key={i}
            className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between relative overflow-hidden group 
              ${card.alert ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
                <p className={`text-3xl font-black tracking-tight ${card.alert ? 'text-rose-600' : 'text-slate-800'}`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${card.bg} ${card.border}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.alert ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                {card.trend}
              </span>
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/0 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Progress Timeline Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Avancement par Planification
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="title" fontSize={11} tickLine={false} axisLine={false} stroke="#64748b" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} stroke="#64748b" />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, 'Avancement']}
                  labelStyle={{ color: '#475569', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="progress" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {
                    timelineData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : entry.progress < 40 ? '#f59e0b' : '#3b82f6'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" /> Répartition des Statuts
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            {statusDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.map(d => ({ ...d, formattedName: d.name.replace('_', ' ') }))}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    nameKey="formattedName"
                    stroke="none"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-500">
                Aucune donnée
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
