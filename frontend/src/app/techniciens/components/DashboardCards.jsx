'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Wrench, TrendingUp } from 'lucide-react';

export default function DashboardCards({ data }) {
  const kpis = [
    { title: 'Techniciens', value: data.totalTechnicians, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Disponibles', value: data.availableTechnicians, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Interventions', value: data.totalInterventions, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Performance', value: `${data.avgPerformance}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
    >
      {kpis.map((kpi, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-300 flex items-center gap-4"
        >
          <div className={`p-4 rounded-xl ${kpi.bg}`}>
            <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{kpi.title}</p>
            <p className="text-2xl font-bold text-slate-800 leading-tight mt-1">{kpi.value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
