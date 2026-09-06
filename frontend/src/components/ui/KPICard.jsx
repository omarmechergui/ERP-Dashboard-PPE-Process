import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

export default function KPICard({ 
  title, 
  value, 
  unit = '',
  icon: Icon, 
  trend,
  trendUp,
  status = 'neutral', // success, warning, danger, neutral
  delay = 0,
  loading = false,
  error = null
}) {
  if (loading) {
    return (
      <div className="relative bg-card rounded-2xl p-5 border border-border shadow-sm overflow-hidden h-[130px]">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary animate-pulse" />
          <div className="w-14 h-5 rounded-full bg-secondary animate-pulse" />
        </div>
        <div>
          <div className="w-24 h-3 bg-secondary rounded animate-pulse mb-3" />
          <div className="w-16 h-8 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-danger/10 rounded-2xl p-5 border border-danger/20 shadow-sm overflow-hidden h-[130px] flex flex-col justify-center items-center text-center">
        <AlertCircle className="w-6 h-6 text-danger mb-2" />
        <p className="text-[10px] font-semibold text-danger uppercase tracking-wider">{title}</p>
        <p className="text-xs text-danger/80 mt-1">Erreur de chargement</p>
      </div>
    );
  }

  // Determine icon styling based on status or defaults
  let iconColor = 'text-primary';
  let iconBg = 'bg-primary/10';
  let trendColor = 'text-neutral';
  let trendBg = 'bg-neutral/10';

  if (trendUp === true) {
    trendColor = 'text-success';
    trendBg = 'bg-success/10';
  } else if (trendUp === false) {
    trendColor = 'text-danger';
    trendBg = 'bg-danger/10';
  }

  if (status === 'success') {
    iconColor = 'text-success';
    iconBg = 'bg-success/10';
  } else if (status === 'warning') {
    iconColor = 'text-warning';
    iconBg = 'bg-warning/10';
  } else if (status === 'danger') {
    iconColor = 'text-danger';
    iconBg = 'bg-danger/10';
  } else if (status === 'info') {
    iconColor = 'text-info';
    iconBg = 'bg-info/10';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all group h-[130px] flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendColor} ${trendBg}`}>
            {trendUp === true && <ArrowUpRight className="w-3 h-3" />}
            {trendUp === false && <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-[12px] font-semibold text-secondary-foreground uppercase tracking-wider mb-1 truncate">
          {title}
        </h3>
        <div className="flex items-baseline gap-1">
          <motion.p 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: delay + 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          >
            {value}
          </motion.p>
          {unit && <span className="text-sm font-medium text-secondary-foreground">{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}
