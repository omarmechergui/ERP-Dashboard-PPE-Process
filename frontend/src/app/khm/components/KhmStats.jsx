"use client";

import React from "react";
import { ClipboardList, Clock, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

export default function KhmStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Total Contrôles</p>
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">En Attente</p>
          <p className="text-xl font-bold text-slate-900">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Conforme</p>
          <p className="text-xl font-bold text-slate-900">{stats.conforme}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Non Conforme</p>
          <p className="text-xl font-bold text-slate-900">{stats.nonConforme}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4 col-span-2 md:col-span-1">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Taux Qualité</p>
          <p className="text-xl font-bold text-slate-900">{stats.qualityRate}%</p>
        </div>
      </div>
    </div>
  );
}
