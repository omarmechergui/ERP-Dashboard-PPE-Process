"use client";

import React from "react";
import { Calendar } from "lucide-react";

export default function InterventionTimeline({ timeline }) {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getColorClass = (color) => {
    switch(color) {
      case "success": return "bg-success";
      case "warning": return "bg-warning";
      case "danger": return "bg-danger";
      case "info": return "bg-info";
      default: return "bg-primary";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Timeline des interventions — Semaine en cours</h2>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[700px]">
          {/* Header row */}
          <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-3 mb-4 text-[11px] font-bold text-muted uppercase tracking-wider text-center border-b border-border pb-3">
            <div className="text-left font-bold pl-2">Machine / Code</div>
            {days.map((day) => (
              <div key={day} className="px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Timeline rows */}
          <div className="space-y-4">
            {timeline && timeline.length > 0 ? (
              timeline.slice(0, 10).map((item, idx) => {
                // Compute grid cells for the current week
                const gridCells = Array(7).fill(false);
                const now = new Date();
                const startOfWeek = new Date(now);
                // Adjust to Monday (1)
                const day = startOfWeek.getDay() || 7; 
                startOfWeek.setDate(startOfWeek.getDate() - day + 1);
                startOfWeek.setHours(0,0,0,0);
                
                const intStart = item.actualStart || item.plannedStart || item.createdAt;
                const intEnd = item.actualEnd || item.plannedEnd || (item.status === 'En cours' ? now : intStart);
                
                if (intStart) {
                  const s = new Date(intStart);
                  const e = new Date(intEnd);
                  
                  for (let i = 0; i < 7; i++) {
                    const currentDayStart = new Date(startOfWeek);
                    currentDayStart.setDate(startOfWeek.getDate() + i);
                    const currentDayEnd = new Date(currentDayStart);
                    currentDayEnd.setDate(currentDayStart.getDate() + 1);
                    
                    if (s < currentDayEnd && e >= currentDayStart) {
                      gridCells[i] = true;
                    }
                  }
                }
                
                // Color mapping
                const color = (item.status === 'Clôturée' || item.status === 'TERMINÉE') ? 'success' : (item.status === 'En cours' || item.status === 'EN_COURS') ? 'warning' : 'danger';
                
                return (
                  <div key={item.id || idx} className="grid grid-cols-[140px_repeat(7,1fr)] gap-3 items-center hover:bg-secondary/20 p-2 -mx-2 rounded-xl transition-colors">
                    <div className="text-xs font-bold text-foreground truncate pr-2" title={item.code}>
                      {item.code}
                    </div>
                    {gridCells.map((isActive, j) => (
                      <div key={j} className="h-7 flex items-center justify-center group relative">
                        {isActive ? (
                          <>
                            <div className={`w-full h-3 rounded-full ${getColorClass(color)} opacity-90 shadow-sm transition-transform group-hover:scale-y-125`} />
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10 shadow-lg">
                              {item.status}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-1 bg-secondary rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div className="text-sm font-medium text-muted text-center py-8 bg-secondary/30 rounded-xl border border-border border-dashed">
                Aucune donnée de timeline disponible pour cette semaine.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
