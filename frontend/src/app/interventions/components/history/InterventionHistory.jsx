import React from 'react';
import { History, User, CheckCircle, Clock, Plus, Edit2, AlertCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function InterventionHistory({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> Historique de l&apos;intervention
          </h3>
        </div>
        <div className="p-6">
          <EmptyState title="Aucun historique" message="L'historique de cette intervention est vide." />
        </div>
      </div>
    );
  }

  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'created':
        return <Plus className="w-4 h-4 text-emerald-600" />;
      case 'updated':
        return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'status_changed':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'created':
        return 'bg-emerald-100 ring-emerald-500';
      case 'updated':
        return 'bg-blue-100 ring-blue-500';
      case 'status_changed':
        return 'bg-orange-100 ring-orange-500';
      case 'completed':
        return 'bg-emerald-100 ring-emerald-500';
      default:
        return 'bg-gray-100 ring-gray-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: '--', time: '--' };
    const d = new Date(dateString);
    return {
      date: new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
    };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" /> Historique de l&apos;intervention
        </h3>
      </div>
      
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {history.map((event, eventIdx) => {
              const { date, time } = formatDate(event.timestamp);
              return (
                <li key={event.id || eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== history.length - 1 ? (
                      <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    ) : null}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white ${getActionColor(event.action)}`}>
                          {getActionIcon(event.action)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{event.title || 'Action'}</p>
                          {event.comment && (
                            <p className="mt-1 text-sm text-gray-500">{event.comment}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span>{event.user || 'Système'}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-500">
                          <div className="font-medium text-gray-900">{date}</div>
                          <div>{time}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
