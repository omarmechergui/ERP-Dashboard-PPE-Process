import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { organigrammeService } from '../../services/organigrammeService';

export function WorkflowHistory({ organigrammeId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!organigrammeId) return;
      try {
        setLoading(true);
        const data = await organigrammeService.getOrganigrammeHistory(organigrammeId);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [organigrammeId]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Chargement de l&apos;historique...</div>;
  }

  if (history.length === 0) {
    return <div className="p-4 text-sm text-gray-500">Aucun historique disponible.</div>;
  }

  return (
    <div className="relative border-l border-gray-200 ml-3 my-4 space-y-6">
      {history.map((event, idx) => (
        <div key={event.id || idx} className="relative pl-6">
          <div className="absolute -left-1.5 mt-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full" />
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {event.user?.nom || 'Système'}
                </span>
                <span className="text-gray-400 text-sm">a passé le statut à</span>
                <WorkflowStatusBadge status={event.new_status} />
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(event.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
              </span>
            </div>
            
            {event.comment && (
              <p className="text-sm text-gray-600 mt-2">{event.comment}</p>
            )}
            
            {event.rejection_reason && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                <span className="font-semibold block mb-1">Motif du rejet :</span>
                {event.rejection_reason}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
