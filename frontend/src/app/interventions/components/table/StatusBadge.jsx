"use client";

import React from "react";
import { CheckCircle, Clock, AlertCircle, XCircle, CalendarClock } from "lucide-react";

export default function StatusBadge({ status }) {
  let colorClass = "bg-gray-100 text-gray-700 border-gray-200";
  let Icon = AlertCircle;

  const s = status?.toLowerCase() || "";

  if (s === "completed" || s === "terminé" || s === "termine") {
    colorClass = "bg-green-100 text-green-700 border-green-200";
    Icon = CheckCircle;
  } else if (s === "in progress" || s === "en cours") {
    colorClass = "bg-blue-100 text-blue-700 border-blue-200";
    Icon = Clock;
  } else if (s === "waiting" || s === "en attente") {
    colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    Icon = CalendarClock;
  } else if (s === "cancelled" || s === "annulé" || s === "annule") {
    colorClass = "bg-red-100 text-red-700 border-red-200";
    Icon = XCircle;
  } else if (s === "planned" || s === "planifié") {
    colorClass = "bg-purple-100 text-purple-700 border-purple-200";
    Icon = CalendarClock;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {status || "Inconnu"}
    </span>
  );
}
