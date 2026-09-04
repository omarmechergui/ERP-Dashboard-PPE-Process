import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ progress }) {
  const safeProgress = typeof progress === 'number' && !isNaN(progress) ? progress : 0;
  
  // Determine color based on progress
  let colorClass = 'bg-emerald-500'; // 80-100%
  let trackClass = 'bg-emerald-100';
  let textClass = 'text-emerald-700';

  if (safeProgress < 40) {
    colorClass = 'bg-amber-500';
    trackClass = 'bg-amber-100';
    textClass = 'text-amber-700';
  } else if (safeProgress < 80) {
    colorClass = 'bg-blue-500';
    trackClass = 'bg-blue-100';
    textClass = 'text-blue-700';
  }

  return (
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <div className={`relative w-full h-2 rounded-full overflow-hidden ${trackClass}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute top-0 left-0 h-full rounded-full ${colorClass}`}
        />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${textClass}`}>
        {safeProgress}%
      </span>
    </div>
  );
}
