"use client";

import React from "react";
import { Calendar } from "lucide-react";

export default function InterventionTimeline({ timeline }) {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getColorClass = (color) => {
    switch(color) {
      case "success": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "danger": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold">Timeline des interventions — Semaine en cours</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-2 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
            <div className="text-left">Machine / Code</div>
            {days.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Timeline rows */}
          <div className="space-y-3">
            {timeline && timeline.length > 0 ? (
              timeline.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[120px_repeat(7,1fr)] gap-2 items-center">
                  <div className="text-sm font-medium text-gray-700 truncate pr-2" title={item.code}>
                    {item.code}
                  </div>
                  {item.gridCells?.map((isActive, j) => (
                    <div key={j} className="h-6 flex items-center justify-center">
                      {isActive ? (
                        <div className={`w-full h-2.5 rounded-full ${getColorClass(item.color)} opacity-80 shadow-sm`} title={item.statut}></div>
                      ) : (
                        <div className="w-full h-1 bg-gray-100 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">Aucune donnée de timeline disponible.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
