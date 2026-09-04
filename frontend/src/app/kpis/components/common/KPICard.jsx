import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPI_THEMES = {
  blue: {
    icon: 'text-blue-600 bg-blue-100',
    background: 'bg-white',
    text: 'text-slate-800',
    border: 'border-blue-100'
  },
  green: {
    icon: 'text-emerald-600 bg-emerald-100',
    background: 'bg-white',
    text: 'text-slate-800',
    border: 'border-emerald-100'
  },
  orange: {
    icon: 'text-orange-500 bg-orange-100',
    background: 'bg-white',
    text: 'text-slate-800',
    border: 'border-orange-100'
  },
  red: {
    icon: 'text-rose-500 bg-rose-100',
    background: 'bg-white',
    text: 'text-slate-800',
    border: 'border-rose-100'
  }
};

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  theme = 'blue', 
  delay = 0,
  tooltip,
  invertedTrend = false // If true, negative trend is green, positive is red (e.g. for MTTR)
}) {
  const selectedTheme = KPI_THEMES[theme] || KPI_THEMES.blue;
  
  const isPositiveTrend = trend > 0;
  const isNegativeTrend = trend < 0;
  const isNeutralTrend = trend === 0;
  
  let trendColor = 'bg-slate-100 text-slate-700';
  if (isPositiveTrend) {
    trendColor = invertedTrend ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700';
  } else if (isNegativeTrend) {
    trendColor = invertedTrend ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  }
  
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative p-5 rounded-2xl border shadow-sm transition-all ${selectedTheme.background} ${selectedTheme.border}`}
      title={tooltip}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${selectedTheme.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trendColor}`}>
            {isPositiveTrend && <TrendingUp className="w-3 h-3" />}
            {isNegativeTrend && <TrendingDown className="w-3 h-3" />}
            {isNeutralTrend && <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h4 className="text-slate-500 text-sm font-semibold mb-1">{title}</h4>
        <div className={`text-2xl font-bold ${selectedTheme.text}`}>{value}</div>
      </div>
      
      {/* Sparkline placeholder for industrial look */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50 rounded-b-2xl"></div>
    </motion.div>
  );
}
