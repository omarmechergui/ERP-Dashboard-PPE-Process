import React, { useMemo } from 'react';
import { format, differenceInDays, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function GanttView({ planifications }) {
  const { startDate, endDate, totalDays, timelineDays } = useMemo(() => {
    if (!planifications || planifications.length === 0) {
      return { startDate: new Date(), endDate: new Date(), totalDays: 0, timelineDays: [] };
    }

    let min = new Date(planifications[0].date_debut);
    let max = new Date(planifications[0].date_fin);

    planifications.forEach(p => {
      const start = new Date(p.date_debut);
      const end = new Date(p.date_fin);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    // Add padding to dates (5 days before and after)
    min = addDays(startOfDay(min), -5);
    max = addDays(startOfDay(max), 5);

    const total = differenceInDays(max, min) + 1;
    const days = Array.from({ length: total }).map((_, i) => addDays(min, i));

    return { startDate: min, endDate: max, totalDays: total, timelineDays: days };
  }, [planifications]);

  if (!planifications || !planifications.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold tracking-wide">Aucune planification pour le Gantt</p>
      </div>
    );
  }

  const getDayOffsetPercentage = (date) => {
    return (differenceInDays(new Date(date), startDate) / totalDays) * 100;
  };

  const getDurationPercentage = (start, end) => {
    return (differenceInDays(new Date(end), new Date(start)) / totalDays) * 100;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full h-[600px]">
      
      {/* Header timeline */}
      <div className="flex border-b border-slate-200 bg-slate-50 backdrop-blur-md z-10 sticky top-0">
        {/* Row Header Label Area */}
        <div className="w-64 flex-shrink-0 p-4 border-r border-slate-200 flex items-center bg-slate-50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Planification</h3>
        </div>
        {/* Days area */}
        <div className="flex-1 flex relative overflow-hidden" style={{ minWidth: `${totalDays * 40}px` }}>
          {timelineDays.map((day, i) => {
            const isToday = differenceInDays(startOfDay(new Date()), startOfDay(day)) === 0;
            return (
              <div 
                key={i} 
                className={`flex-1 border-r border-slate-200 flex flex-col items-center justify-center py-2 ${isToday ? 'bg-blue-50' : ''}`}
                style={{ minWidth: '40px' }}
              >
                <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                  {format(day, 'MMM', { locale: fr })}
                </span>
                <span className={`text-sm font-black ${isToday ? 'text-blue-700 bg-blue-100 px-2 rounded-md' : 'text-slate-700'}`}>
                  {format(day, 'dd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {/* Today line indicator */}
        <div 
          className="absolute top-0 bottom-0 border-l-2 border-blue-500/50 z-0 pointer-events-none"
          style={{ left: `calc(256px + ${getDayOffsetPercentage(new Date())}%)` }}
        >
          <div className="absolute top-0 -left-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
        </div>

        {planifications.map((plan, index) => {
          const left = getDayOffsetPercentage(plan.date_debut);
          const width = getDurationPercentage(plan.date_debut, plan.date_fin) || 1; // min 1%
          
          let colorClass = "from-blue-600 to-blue-400 border-blue-400";
          if (plan.progress === 100) colorClass = "from-emerald-600 to-emerald-400 border-emerald-400";
          else if (plan.progress < 40) colorClass = "from-amber-600 to-amber-400 border-amber-400";

          return (
            <div key={plan.id} className="flex border-b border-slate-200 hover:bg-slate-50 transition-colors group">
              {/* Row Header */}
              <div className="w-64 flex-shrink-0 p-4 border-r border-slate-200 bg-white flex flex-col justify-center relative z-10">
                <p className="text-sm font-bold text-slate-800 truncate pr-4">{plan.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">{plan.progress}%</span>
                  <span className="text-[10px] text-slate-500 truncate">{plan.project || 'Sans projet'}</span>
                </div>
              </div>
              
              {/* Gantt Area */}
              <div className="flex-1 relative" style={{ minWidth: `${totalDays * 40}px` }}>
                {/* Background grid lines matching header */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {timelineDays.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-slate-200" style={{ minWidth: '40px' }} />
                  ))}
                </div>

                {/* The Gantt Bar */}
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg bg-gradient-to-r ${colorClass} border-l-4 shadow-md flex items-center px-3 overflow-hidden cursor-pointer hover:brightness-110 transition-all`}
                  style={{ left: `${left}%` }}
                  title={`${plan.title} (${plan.progress}%)`}
                >
                  {/* Progress fill inside the bar */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-white/20" 
                    style={{ width: `${plan.progress}%` }}
                  />
                  <span className="text-[10px] font-bold text-white relative z-10 whitespace-nowrap drop-shadow-md">
                    {format(new Date(plan.date_debut), 'dd MMM', { locale: fr })} - {format(new Date(plan.date_fin), 'dd MMM', { locale: fr })}
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
