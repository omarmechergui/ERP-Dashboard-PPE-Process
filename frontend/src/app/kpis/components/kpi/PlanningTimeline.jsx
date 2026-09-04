'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PlanningTimeline({ planning }) {
  if (!planning) return null;
  
  // Generate days for the timeline header
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Planning des interventions</h3>
          <p className="text-sm text-slate-500 font-medium">Aperçu sur les 7 prochains jours</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>Préventif</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>Curatif</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>Terminé</div>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-[700px]">
          {/* Timeline Header */}
          <div className="grid grid-cols-[180px_1fr] gap-6 mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Machine / Ligne</div>
            <div className="flex justify-between relative text-xs font-bold text-slate-400 uppercase tracking-widest">
              {days.map((day, i) => (
                <div key={i} className="flex-1 text-center relative">
                  {day}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-px h-full min-h-[220px] bg-slate-100 -z-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="flex flex-col gap-4 relative z-10">
            {planning.map((plan, index) => (
              <div key={index} className="grid grid-cols-[180px_1fr] gap-6 items-center group">
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                  <span className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                    {plan.ligne}
                  </span>
                </div>
                
                <div className="relative h-12 bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 group-hover:bg-slate-50 transition-colors">
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: plan.width, opacity: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                    className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg shadow-sm group-hover:shadow-md transition-all cursor-pointer flex items-center px-3 hover:brightness-110"
                    style={{ left: plan.left, backgroundColor: plan.color || '#3b82f6' }}
                  >
                    <div className="w-full h-full relative group/tooltip">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover/tooltip:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs py-2 px-3 rounded-lg shadow-xl whitespace-nowrap transition-all duration-200 pointer-events-none z-50 transform scale-95 group-hover/tooltip:scale-100">
                        <span className="font-semibold">{plan.ligne}</span> - Intervention
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
