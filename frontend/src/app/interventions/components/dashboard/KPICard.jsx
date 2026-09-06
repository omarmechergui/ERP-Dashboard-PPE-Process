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
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    primary: "bg-primary/10 text-primary border-primary/20",
  };

  const iconColorClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-xl border transition-transform duration-300 group-hover:scale-110 ${iconColorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-secondary-foreground'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '−'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-4xl font-extrabold text-foreground tracking-tight">{value}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-bold text-secondary-foreground uppercase tracking-wider">{title}</p>
          {trendLabel && (
            <>
              <span className="text-border">•</span>
              <p className="text-[11px] font-bold text-secondary-foreground uppercase">{trendLabel}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
