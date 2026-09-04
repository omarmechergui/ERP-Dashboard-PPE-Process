import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';

export function OrganigrammeList({ organigrammes, onSelect, activeId }) {
  if (!organigrammes || organigrammes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <p className="text-gray-500">Aucun organigramme trouvé.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Version</th>
              <th className="px-6 py-3">Titre</th>
              <th className="px-6 py-3">Créateur</th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3">Date de Soumission</th>
              <th className="px-6 py-3">Dernière Modif</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {organigrammes.map((org) => (
              <tr 
                key={org.id} 
                className={`hover:bg-gray-50 transition-colors ${activeId === org.id ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-6 py-4 font-bold text-gray-700">
                  V{org.version}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                  {org.titre}
                  {activeId === org.id && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      ACTIF
                    </span>
                  )}
                  {org.statut === 'VALIDE' && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      PUBLIÉ
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {org.creator?.nom || 'Inconnu'}
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <WorkflowStatusBadge status={org.statut} />
                  {org.statut === 'REJETE' && org.lastRejection && (
                    <div className="relative group cursor-help">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        <span className="font-bold block mb-1">Motif de rejet :</span>
                        {org.lastRejection.rejection_reason}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {org.submittedAt ? format(new Date(org.submittedAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {format(new Date(org.updatedAt), 'dd MMM yyyy', { locale: fr })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onSelect(org)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
