import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function HeatmapChart({ data }) {
  // Find max value for color scaling
  const maxVal = useMemo(() => {
    if (!data || !data.data) return 1;
    return Math.max(...data.data.map(d => d[2]), 1); // min 1 to avoid division by zero
  }, [data]);

  if (!data || !data.data) return null;

  const { days, hours, data: matrixData } = data;

  // Generate color based on intensity (0 to 1)
  const getColor = (val) => {
    if (val === 0) return 'bg-slate-50'; // Empty state
    const intensity = val / maxVal;
    
    // Scale: from light orange to dark red
    if (intensity < 0.2) return 'bg-orange-100';
    if (intensity < 0.4) return 'bg-orange-300';
    if (intensity < 0.6) return 'bg-orange-500';
    if (intensity < 0.8) return 'bg-rose-500';
    return 'bg-rose-700';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">Fréquence des Défaillances</h3>
        <p className="text-sm text-slate-500 font-medium">Répartition temporelle par jour et tranche horaire (Heatmap)</p>
      </div>
      
      <div className="flex-1 flex flex-col min-h-[300px] justify-center overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px]">
          {/* Header row (Hours) */}
          <div className="flex mb-2 ml-12">
            {hours.map((hour, i) => (
              <div key={`h-${i}`} className="flex-1 text-center text-xs font-semibold text-slate-400">
                {hour}
              </div>
            ))}
          </div>
          
          {/* Grid rows (Days) */}
          <div className="flex flex-col gap-1.5">
            {days.map((day, dayIdx) => (
              <div key={`d-${dayIdx}`} className="flex items-center">
                <div className="w-12 text-xs font-semibold text-slate-500 text-right pr-3">
                  {day}
                </div>
                <div className="flex flex-1 gap-1.5">
                  {hours.map((_, hourIdx) => {
                    const point = matrixData.find(d => d[0] === dayIdx && d[1] === hourIdx);
                    const val = point ? point[2] : 0;
                    return (
                      <motion.div
                        key={`cell-${dayIdx}-${hourIdx}`}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        title={`${day} à ${hours[hourIdx]} : ${val} pannes`}
                        className={`flex-1 aspect-[3/1] rounded-md transition-colors cursor-pointer border border-slate-100 ${getColor(val)}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex items-center justify-end gap-2 text-xs text-slate-500 font-medium">
            <span>Moins</span>
            <div className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-100"></div>
            <div className="w-3 h-3 rounded-sm bg-orange-100"></div>
            <div className="w-3 h-3 rounded-sm bg-orange-300"></div>
            <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
            <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
            <div className="w-3 h-3 rounded-sm bg-rose-700"></div>
            <span>Plus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
