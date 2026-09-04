import React, { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function InterventionTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" /> Planning / Gantt
        </h3>
        <EmptyState title="Aucun planning" message="Il n'y a pas d'interventions planifiées pour cette période." />
      </div>
    );
  }

  // Helper to determine the color of the bar based on priority or status
  const getBarColor = (item) => {
    if (item.status === 'Completed') return 'bg-emerald-500';
    if (item.status === 'Cancelled') return 'bg-red-500';
    if (item.priority === 'Critical') return 'bg-red-600';
    if (item.priority === 'High') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  // Mocking timeline rendering since we don't have a real Gantt library installed
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" /> Planning des Interventions
        </h3>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Terminé</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600"></span> Critique</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Haute</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Standard</div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header (Hours) */}
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            <div className="w-48 flex-shrink-0 font-medium text-sm text-gray-500">Machine</div>
            <div className="flex-1 flex justify-between text-xs text-gray-400 px-4">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>23:59</span>
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="space-y-4">
            {timeline.map((item, index) => {
              // Calculate actual positioning based on time if available
              let startPercent = 0;
              let widthPercent = 10;
              
              if (item.startDate) {
                const sDate = new Date(item.startDate);
                const hours = sDate.getHours();
                const minutes = sDate.getMinutes();
                startPercent = ((hours * 60 + minutes) / (24 * 60)) * 100;
                
                if (item.endDate) {
                  const eDate = new Date(item.endDate);
                  const endHours = eDate.getHours();
                  const endMinutes = eDate.getMinutes();
                  let endPercent = ((endHours * 60 + endMinutes) / (24 * 60)) * 100;
                  if (endPercent < startPercent) endPercent = 100; // cross-day simple clamp
                  widthPercent = endPercent - startPercent;
                } else if (item.downtime) {
                  widthPercent = (item.downtime / 24) * 100;
                }
              }

              // Ensure min width
              if (widthPercent < 5) widthPercent = 5;
              if (startPercent + widthPercent > 100) widthPercent = 100 - startPercent;

              return (
                <div key={item.id || index} className="flex items-center group">
                  <div className="w-48 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900 truncate pr-4">{item.machine?.nom || item.machine || '-'}</p>
                    <p className="text-xs text-gray-500 truncate pr-4">{item.technicien?.nom || item.technician?.nom || item.technician || '-'}</p>
                  </div>
                  
                  <div className="flex-1 relative h-10 bg-gray-50 rounded-lg border border-gray-100">
                    {/* Gantt Bar */}
                    <div 
                      className={`absolute h-8 top-1 rounded-md shadow-sm flex items-center justify-center overflow-hidden transition-all group-hover:shadow-md ${getBarColor(item)} text-white text-xs font-medium px-2`}
                      style={{ 
                        left: `${startPercent}%`, 
                        width: `${widthPercent}%`,
                        minWidth: '40px'
                      }}
                      title={`${item.code} | Machine: ${item.machine?.nom || '-'} | Type: ${item.type} | Statut: ${item.status}`}
                    >
                      <span className="truncate">{item.code}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
