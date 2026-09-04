import React from "react";
import { motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpLeft, Users } from "lucide-react";

const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 ${colorClass.split(' ')[1]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    
    <div className="relative z-10">
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  </motion.div>
);

export const KpiCards = ({ stats }) => {
  const cards = [
    {
      title: "Total Movements",
      value: stats.totalMovements.toString(),
      subtitle: "Recorded transactions",
      icon: Activity,
      colorClass: "from-blue-500 to-indigo-600 text-blue-600",
    },
    {
      title: "Items Received",
      value: stats.quantityIn.toString(),
      subtitle: `${stats.entriesToday} entries today`,
      icon: ArrowDownRight,
      colorClass: "from-emerald-400 to-teal-500 text-emerald-600",
    },
    {
      title: "Items Issued",
      value: stats.quantityOut.toString(),
      subtitle: `${stats.exitsToday} issues today`,
      icon: ArrowUpLeft,
      colorClass: "from-rose-400 to-red-500 text-rose-500",
    },
    {
      title: "Active Operators",
      value: stats.activeOperators.toString(),
      subtitle: "Performing transactions",
      icon: Users,
      colorClass: "from-purple-400 to-pink-500 text-purple-600",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <KpiCard key={idx} {...card} delay={idx * 0.1} />
      ))}
    </div>
  );
};
