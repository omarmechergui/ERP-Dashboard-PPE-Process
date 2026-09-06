import React from 'react';

export default function ProgressBar({ progress, label, showValue = true, height = 'h-2' }) {
  if (progress === null || progress === undefined) {
    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="text-sm font-bold text-slate-400">—</span>
          </div>
        )}
        <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 ${height}`}>
        </div>
      </div>
    );
  }

  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {showValue && (
            <span className="text-sm font-bold text-slate-700">{safeProgress}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 ${height}`}>
        <div 
          className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}
