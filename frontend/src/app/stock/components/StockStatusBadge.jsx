import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { getStockStatus } from "../utils/stockStatus";

export const StockStatusBadge = ({ article }) => {
  const status = getStockStatus(article);
  
  let Icon = CheckCircle2;
  if (status.variant === "warning") Icon = AlertTriangle;
  if (status.variant === "critical" || status.variant === "danger") Icon = XCircle;
  if (status.variant === "reserved") Icon = Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${status.bg} ${status.color} ${status.border}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {status.label}
    </span>
  );
};
