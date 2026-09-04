import React from "react";
import { motion } from "framer-motion";

export const StockQuantityBar = ({ current, min, max }) => {
  // If no max is provided, assume it's 3x min or something reasonable for visualization
  const maxStock = max || (min > 0 ? min * 3 : 100);
  const percentage = Math.min(100, Math.max(0, (current / maxStock) * 100));
  
  let barColor = "bg-emerald-500";
  if (current <= 0) barColor = "bg-red-500";
  else if (current <= min / 2) barColor = "bg-rose-500";
  else if (current <= min) barColor = "bg-amber-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-700">{current}</span>
        <span className="text-slate-400">Min: {min}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
};
