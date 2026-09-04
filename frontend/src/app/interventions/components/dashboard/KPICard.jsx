import React from 'react';

export default function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  color = "blue"
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const iconColorClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${iconColorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {trendLabel && (
            <>
              <span className="text-gray-300">•</span>
              <p className="text-xs text-gray-400">{trendLabel}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
