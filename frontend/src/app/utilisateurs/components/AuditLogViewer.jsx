/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react';
import API from '../../../lib/api';
import { Search, Filter, History } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterAction, setFilterAction] = useState('ALL');
  
  useEffect(() => {
    fetchLogs();
  }, []);
  
  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await API.get('/users/audit');
      setLogs(res.data);
    } catch (err) {
      setError(err.message || "Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  };

  function getActionColor(action) {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  function formatChanges(changesStr) {
    if (!changesStr) return null;
    try {
      const changes = JSON.parse(changesStr);
      
      // For CREATE
      if (changes.nom && typeof changes.nom === 'string') {
        return <div className="text-xs text-gray-500">Création: {changes.role} - {changes.nom}</div>;
      }
      
      // For DELETE
      if (changes.deletedUser) {
        return <div className="text-xs text-red-500">Suppression: {changes.deletedUser.nom}</div>;
      }
      
      // For UPDATE
      return Object.entries(changes).map(([field, vals]) => (
        <div key={field} className="text-xs text-gray-600 flex items-center gap-1 mb-1">
          <span className="font-semibold text-gray-800">{field}:</span>
          <span className="line-through text-red-400">{vals.old || 'vide'}</span>
          <span>→</span>
          <span className="text-emerald-600">{vals.new || 'vide'}</span>
        </div>
      ));
    } catch (e) {
      return <span className="text-xs text-gray-400">Détails illisibles</span>;
    }
  };

  const filteredLogs = filterAction === 'ALL' ? logs : logs.filter(l => l.action === filterAction);

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement de l&apos;historique...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Journal d&apos;Audit
        </h3>
        
        <select 
          value={filterAction} 
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white"
        >
          <option value="ALL">Toutes les actions</option>
          <option value="CREATE">Créations</option>
          <option value="UPDATE">Modifications</option>
          <option value="DELETE">Suppressions/Désactivations</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Acteur</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Cible</th>
              <th className="px-6 py-3">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {log.actor ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.actor.nom}</div>
                      <div className="text-xs text-gray-500">{log.actor.matricule}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Système</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {log.user ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.user.nom}</div>
                      <div className="text-xs text-gray-500">{log.user.matricule}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="max-w-md">
                    {formatChanges(log.changes)}
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Aucun log trouvé pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
