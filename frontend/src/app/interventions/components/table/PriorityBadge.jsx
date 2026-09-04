import React from 'react';
import { ArrowUpCircle, AlertTriangle, ArrowDownCircle, MinusCircle } from 'lucide-react';

export default function PriorityBadge({ priority }) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let Icon = MinusCircle;

  const p = priority?.toLowerCase() || "";

  if (p === "critical" || p === "critique") {
    colorClass = "bg-red-100 text-red-700 border-red-200";
    Icon = AlertTriangle;
  } else if (p === "high" || p === "haute") {
    colorClass = "bg-orange-100 text-orange-700 border-orange-200";
    Icon = ArrowUpCircle;
  } else if (p === "medium" || p === "moyenne") {
    colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    Icon = MinusCircle;
  } else if (p === "low" || p === "basse") {
    colorClass = "bg-green-100 text-green-700 border-green-200";
    Icon = ArrowDownCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {priority || "Inconnu"}
    </span>
  );
}
