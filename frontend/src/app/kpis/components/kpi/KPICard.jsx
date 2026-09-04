'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function KPICard({ title, value, icon: Icon, trend, colorClass, delay = 0 }) {
  const isPositive = trend >= 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6 flex flex-col justify-between overflow-hidden relative group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-slate-400">vs dernier mois</span>
        </div>
      )}
      
      <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 ${colorClass.replace('text-', 'bg-').replace('bg-opacity-10', '')}`} style={{ opacity: 0.7 }} />
    </motion.div>
  );
}
