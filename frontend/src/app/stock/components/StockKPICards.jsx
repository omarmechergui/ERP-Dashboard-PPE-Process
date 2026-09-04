import React from "react";
import { motion } from "framer-motion";
import { Package, DollarSign, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../utils/stockFormatters";

const KPICard = ({ title, value, subtitle, icon: Icon, colorClass, delay = 0, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 ${colorClass.split(' ')[1]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </motion.div>
  );
};

export const StockKPICards = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm h-[130px] animate-pulse flex flex-col justify-between">
            <div className="w-10 h-10 bg-slate-200 rounded-xl mb-4"></div>
            <div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats.totalValue),
      subtitle: "Capital locked in warehouse",
      icon: DollarSign,
      colorClass: "from-blue-500 to-indigo-600 text-blue-600",
      trend: 2.4,
    },
    {
      title: "Available Articles",
      value: stats.totalArticles.toString(),
      subtitle: `${stats.availableStock} items in stock`,
      icon: Package,
      colorClass: "from-emerald-400 to-teal-500 text-emerald-600",
      trend: 1.2,
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount.toString(),
      subtitle: "Require immediate restock",
      icon: AlertTriangle,
      colorClass: "from-amber-400 to-orange-500 text-amber-500",
      trend: -5.1,
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      subtitle: "Production blockers",
      icon: XCircle,
      colorClass: "from-rose-400 to-red-500 text-rose-500",
      trend: 0,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <KPICard key={idx} {...card} delay={idx * 0.1} />
      ))}
    </div>
  );
};
