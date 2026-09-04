import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function StockBadge({ status }) {
  if (status === 'Out of Stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
        <XCircle className="h-3.5 w-3.5" />
        Out of Stock
      </span>
    );
  }

  if (status === 'Low Stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Enough
    </span>
  );
}
