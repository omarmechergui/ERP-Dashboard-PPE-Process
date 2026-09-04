"use client";

import React, { useState } from "react";
import StatusBadge from "./table/StatusBadge";
import { MoreVertical, Wrench, Clock, User, Eye, Edit2, Copy, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function InterventionTable({ 
  interventions, 
  loading,
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onChangeStatus 
}) {
  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (id) => {
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl">
        <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900">Chargement des interventions...</h3>
        <p className="text-sm text-gray-500 mt-1">Veuillez patienter pendant la récupération des données.</p>
      </div>
    );
  }

  if (!interventions || interventions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl">
        <Wrench className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Aucune intervention</h3>
        <p className="text-sm text-gray-500 mt-1">Il n&apos;y a aucune intervention correspondant à vos critères.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden pb-[150px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-semibold">Code</th>
              <th className="px-6 py-3 font-semibold">Machine / Panneau</th>
              <th className="px-6 py-3 font-semibold">Défaut</th>
              <th className="px-6 py-3 font-semibold">Technicien</th>
              <th className="px-6 py-3 font-semibold">Temps</th>
              <th className="px-6 py-3 font-semibold">Shift</th>
              <th className="px-6 py-3 font-semibold">Code SAP</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {interventions.map((int) => (
              <tr key={int.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                <td className="px-6 py-4 font-medium text-gray-900">{int.code || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{int.machine?.nom || int.panneau || "-"}</td>
                <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate" title={int.defaut}>{int.defaut || "-"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    {int.technicien?.nom || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {int.downtime ? `${int.downtime} min` : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 capitalize">{int.shift || "-"}</td>
                <td className="px-6 py-4 text-gray-600 capitalize">{int.codeSap || int.machine?.code || "-"}</td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={int.status} />
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button 
                    onClick={() => toggleMenu(int.id)}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {activeMenu === int.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-6 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-left">
                        <button onClick={() => { onView && onView(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Voir détails
                        </button>
                        <button onClick={() => { onEdit && onEdit(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                        <button onClick={() => { onDuplicate && onDuplicate(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Copy className="w-4 h-4" /> Dupliquer
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={() => { onChangeStatus && onChangeStatus(int.id, 'Clôturée'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-gray-50 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Marquer terminé
                        </button>
                        <button onClick={() => { onDelete && onDelete(int.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
