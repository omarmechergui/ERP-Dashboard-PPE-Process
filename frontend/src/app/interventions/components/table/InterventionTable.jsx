import React, { useState } from 'react';
import { Eye, Edit2, Copy, Trash2, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import EmptyState from '../common/EmptyState';

export default function InterventionTable({ interventions, onView, onEdit, onDuplicate, onDelete, onChangeStatus }) {
  const [activeMenu, setActiveMenu] = useState(null);

  if (!interventions || interventions.length === 0) {
    return <EmptyState title="Aucune intervention" message="Aucune intervention ne correspond à vos critères." />;
  }

  const toggleMenu = (id) => {
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium">Code / Date</th>
              <th className="px-4 py-3 font-medium">Machine & Type</th>
<th className="px-4 py-3 font-medium">Panneau</th>
              <th className="px-4 py-3 font-medium">Priorité</th>
              <th className="px-4 py-3 font-medium">Problème</th>
              <th className="px-4 py-3 font-medium">Technicien</th>
              <th className="px-4 py-3 font-medium text-center">Temps (Est/Réel)</th>
              <th className="px-4 py-3 font-medium text-center">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {interventions.map((int) => (
              <tr key={int.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{int.code || `#INT-${int.id.substring(0,4)}`}</div>
                  <div className="text-xs text-gray-500">{formatDate(int.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-blue-600">{int.machine?.nom ?? '-'}</div>
                  <div className="text-xs text-gray-500">{int.type || 'Corrective'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-green-600">{int.panneau?.title_panneau ?? '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={int.priority} />
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate" title={int.failure}>
                  {int.failure}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                      {int.technicien?.nom ? int.technicien.nom.substring(0, 2) : '??'}
                    </div>
                    <span>{int.technicien?.nom || 'Non assigné'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {int.estimatedTime || '-'} / {int.actualTime || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={int.status} />
                </td>
                <td className="px-4 py-3 text-right relative">
                  <button 
                    onClick={() => toggleMenu(int.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeMenu === int.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-6 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                        <button onClick={() => { onView(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Voir détails
                        </button>
                        <button onClick={() => { onEdit(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                        <button onClick={() => { onDuplicate(int); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Copy className="w-4 h-4" /> Dupliquer
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={() => { onChangeStatus(int.id, 'Completed'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-gray-50 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Marquer terminé
                        </button>
                        <button onClick={() => { onChangeStatus(int.id, 'Cancelled'); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Annuler
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={() => { onDelete(int.id); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
