"use client";

import React, { useState } from "react";
import StatusBadge from "./common/StatusBadge";
import { MoreVertical, CalendarCheck, User, Eye, Edit2, Copy, Trash2, Loader2, Calendar } from "lucide-react";

export default function PreventiveTable({ 
  data, 
  loading,
  onView, 
  onEdit, 
  onDuplicate, 
  onDelete
}) {
  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (id) => {
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatFrequency = (freq) => {
      const map = {
          'DAILY': 'Quotidienne',
          'WEEKLY': 'Hebdomadaire',
          'MONTHLY': 'Mensuelle',
          'QUARTERLY': 'Trimestrielle',
          'SEMI_ANNUALLY': 'Semestrielle',
          'ANNUALLY': 'Annuelle'
      };
      return map[freq] || freq;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl">
        <Loader2 className="w-12 h-12 text-indigo-500 mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900">Chargement des plans...</h3>
        <p className="text-sm text-gray-500 mt-1">Veuillez patienter pendant la récupération des données.</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-xl">
        <CalendarCheck className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Aucun plan trouvé</h3>
        <p className="text-sm text-gray-500 mt-1">Il n&apos;y a aucun plan de maintenance correspondant à vos critères.</p>
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
              <th className="px-6 py-3 font-semibold">Machine</th>
              <th className="px-6 py-3 font-semibold">Fréquence</th>
              <th className="px-6 py-3 font-semibold">Prochaine Date</th>
              <th className="px-6 py-3 font-semibold">Technicien</th>
              <th className="px-6 py-3 font-semibold text-center">Statut</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((int) => (
              <tr key={int.id} className={`hover:bg-gray-50 transition-colors duration-200 group ${int.status === 'OVERDUE' ? 'bg-rose-50/30' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-900">{int.code || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{int.machine?.nom || "-"} ({int.machine?.code || "-"})</td>
                <td className="px-6 py-4 text-gray-600">{formatFrequency(int.frequency)}</td>
                <td className={`px-6 py-4 font-medium ${int.status === 'OVERDUE' ? 'text-rose-600' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        {formatDate(int.nextMaintenanceDate)}
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    {int.technicien?.nom || "-"}
                  </div>
                </td>
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
                        {onEdit && (
                            <button onClick={() => { onEdit(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 className="w-4 h-4" /> Modifier
                            </button>
                        )}
                        {onDuplicate && (
                            <button onClick={() => { onDuplicate(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Dupliquer
                            </button>
                        )}
                        {onDelete && (
                            <>
                            <hr className="my-1 border-gray-100" />
                            <button onClick={() => { onDelete(int.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                            </>
                        )}
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
