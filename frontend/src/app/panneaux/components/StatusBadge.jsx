"use client";

import React from "react";

export default function StatusBadge({ label, status, type = "validation" }) {
  let colors = "bg-gray-100 text-gray-700 border-gray-200";

  if (type === "validation") {
    if (status === "VALIDE") colors = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (status === "REJETE") colors = "bg-rose-50 text-rose-700 border-rose-200";
    else colors = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (type === "khm") {
    if (status === "CONFORME") colors = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (status === "NON_CONFORME") colors = "bg-rose-50 text-rose-700 border-rose-200";
    else colors = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const displayStatus = status ? status.replace('_', ' ') : 'INCONNU';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border whitespace-nowrap ${colors}`}>
      {label}: {displayStatus}
    </span>
  );
}
