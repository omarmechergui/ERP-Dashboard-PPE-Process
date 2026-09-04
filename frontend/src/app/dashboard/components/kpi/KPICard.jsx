import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  border,
  trend = '+5.2%',
  trendUp = true,
  delay = 0,
  loading = false,
  error = null
}) {
  if (loading) {
    return (
      <div className={`relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm overflow-hidden h-[130px]`}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="w-14 h-5 rounded-full bg-slate-100 animate-pulse" />
        </div>
        <div>
          <div className="w-24 h-3 bg-slate-100 rounded animate-pulse mb-3" />
          <div className="w-16 h-8 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-rose-50/50 rounded-2xl p-5 border border-rose-100 shadow-sm overflow-hidden h-[130px] flex flex-col justify-center items-center text-center`}>
        <AlertCircle className="w-6 h-6 text-rose-400 mb-2" />
        <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">{title}</p>
        <p className="text-xs text-rose-500 mt-1">Erreur de chargement</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-white rounded-2xl p-5 border ${border} shadow-sm hover:shadow-xl transition-all group overflow-hidden h-[130px]`}
    >
      {/* Background Glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${bg} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {title}
        </h3>
        <div className="flex items-end justify-between">
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: delay + 0.2 }}
            className="text-3xl font-black text-slate-800 tracking-tight"
          >
            {value}
          </motion.p>
          {/* Sparkline removed per business requirements: no historical trend arrays available */}
        </div>
      </div>
    </motion.div>
  );
}
