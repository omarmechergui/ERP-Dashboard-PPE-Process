import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Settings, Clock, CheckCircle, XCircle, AlertTriangle, Play, Package, ShieldAlert } from 'lucide-react';
import API from '../../../../lib/api';

const STATUS_COLORS = {
  'PLANIFIÉE': 'bg-blue-100 text-blue-800 border-blue-200',
  'EN_ATTENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'EN_COURS': 'bg-orange-100 text-orange-800 border-orange-200',
  'TERMINÉE': 'bg-green-100 text-green-800 border-green-200',
  'ANNULÉE': 'bg-red-100 text-red-800 border-red-200',
};

const PRIORITY_COLORS = {
  'Basse': 'text-gray-500 bg-gray-100',
  'Normal': 'text-blue-500 bg-blue-100',
  'Haute': 'text-orange-500 bg-orange-100',
  'Critique': 'text-red-500 bg-red-100',
  'Urgent': 'text-red-600 bg-red-200 font-bold',
};

export default function InterventionDetailModal({ isOpen, onClose, interventionId, onUpdate }) {
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, parts, timeline

  // Completion form state
  const [completing, setCompleting] = useState(false);
  const [cause, setCause] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [downtime, setDowntime] = useState('');

  // Parts form state
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [addingPart, setAddingPart] = useState(false);

  useEffect(() => {
    if (!isOpen || !interventionId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/maintenance/interventions/${interventionId}`);
        setIntervention(res.data?.data);
        
        // Also fetch articles for parts addition
        const articlesRes = await API.get('/stock/articles?grouped=true');
        setArticles(articlesRes.data || []);
      } catch (err) {
        setError('Erreur lors du chargement des détails.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, interventionId]);

  if (!isOpen) return null;

  const handleStart = async () => {
    try {
      await API.patch(`/maintenance/interventions/${interventionId}/start`);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Erreur lors du démarrage de l'intervention");
    }
  };

  const handleComplete = async () => {
    try {
      await API.patch(`/maintenance/interventions/${interventionId}/complete`, {
        cause,
        action,
        result,
        downtime: downtime ? parseFloat(downtime) : null
      });
      setCompleting(false);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Erreur lors de la clôture de l'intervention");
    }
  };

  const handleAddPart = async () => {
    if (!selectedArticle || partQty <= 0) return;
    setAddingPart(true);
    try {
      await API.post(`/maintenance/interventions/${interventionId}/parts`, {
        articleId: selectedArticle,
        quantite: partQty
      });
      // Refresh details
      const res = await API.get(`/maintenance/interventions/${interventionId}`);
      setIntervention(res.data?.data);
      setSelectedArticle('');
      setPartQty(1);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'ajout de la pièce");
    } finally {
      setAddingPart(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
          <div className="text-red-500 mb-4">{error || "Intervention introuvable"}</div>
          <button onClick={onClose} className="w-full bg-gray-100 py-2 rounded text-gray-700 hover:bg-gray-200">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-bold text-gray-900">{intervention.code}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[intervention.status] || STATUS_COLORS['EN_ATTENTE']}`}>
                {intervention.status}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[intervention.priority] || PRIORITY_COLORS['Normal']}`}>
                {intervention.priority}
              </span>
            </div>
            <h2 className="text-lg font-medium text-gray-700">{intervention.title || intervention.description}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-6 overflow-y-auto hidden md:block">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Settings className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Machine</p>
                    <p className="text-gray-600">{intervention.machine ? `${intervention.machine.code} - ${intervention.machine.nom}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Technicien</p>
                    <p className="text-gray-600">{intervention.technicien ? intervention.technicien.nom : 'Non assigné'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Type</p>
                    <p className="text-gray-600">{intervention.type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Planification</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Créé le</p>
                    <p className="text-gray-600">{new Date(intervention.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {intervention.plannedStart && (
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Début prévu</p>
                      <p className="text-gray-600">{new Date(intervention.plannedStart).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
                {intervention.actualStart && (
                  <div className="flex items-start gap-2 text-sm">
                    <Play className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Début réel</p>
                      <p className="text-gray-600">{new Date(intervention.actualStart).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
                {intervention.actualEnd && (
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Fin réelle</p>
                      <p className="text-gray-600">{new Date(intervention.actualEnd).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 pt-4 space-x-6">
              <button
                className={`pb-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('details')}
              >
                Détails & Diagnostic
              </button>
              <button
                className={`pb-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'parts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('parts')}
              >
                Pièces utilisées
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{intervention.parts?.length || 0}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Description / Constat Initial
                    </h4>
                    <p className="text-gray-700 text-sm">{intervention.description || intervention.defaut}</p>
                  </div>

                  {(intervention.cause || intervention.result || intervention.action) ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                        <CheckCircle className="w-4 h-4" /> Rapport d&apos;Intervention
                      </h4>
                      
                      {intervention.cause && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cause racine</p>
                          <p className="text-gray-800 text-sm">{intervention.cause}</p>
                        </div>
                      )}
                      
                      {(intervention.action) && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Action réalisée</p>
                          <p className="text-gray-800 text-sm">{intervention.action}</p>
                        </div>
                      )}

                      {intervention.result && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Résultat</p>
                          <p className="text-gray-800 text-sm">{intervention.result}</p>
                        </div>
                      )}

                      {intervention.downtime !== null && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Temps d&apos;arrêt</p>
                          <p className="text-gray-800 text-sm">{intervention.downtime} heures</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                      <p className="text-sm text-gray-500">Aucun rapport d&apos;intervention n&apos;a été saisi.</p>
                    </div>
                  )}

                  {completing && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm mt-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Clôturer l&apos;intervention
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cause racine (Diagnostic)</label>
                          <textarea className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" rows={2} value={cause} onChange={e => setCause(e.target.value)}></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Action réalisée</label>
                          <textarea className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" rows={2} value={action} onChange={e => setAction(e.target.value)}></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Résultat / Observations</label>
                          <textarea className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" rows={2} value={result} onChange={e => setResult(e.target.value)}></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Temps d&apos;arrêt (heures)</label>
                          <input type="number" step="0.25" min="0" className="w-32 border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 text-sm" value={downtime} onChange={e => setDowntime(e.target.value)} />
                          <span className="ml-2 text-xs text-gray-500">(Laissez vide pour calculer automatiquement)</span>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setCompleting(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                          <button onClick={handleComplete} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">Valider la clôture</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Pièces consommées</h3>
                  </div>

                  {/* Add Part Form */}
                  {(intervention.status === 'EN_COURS' || intervention.status === 'En cours') && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Article du stock</label>
                        <select 
                          value={selectedArticle} 
                          onChange={(e) => setSelectedArticle(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Sélectionner un article...</option>
                          {articles.map(a => (
                            <option key={a.id} value={a.id}>{a.id} - {a.nom_article} (Stock: {a.quantite})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="any"
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button 
                        onClick={handleAddPart}
                        disabled={addingPart || !selectedArticle}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {addingPart ? 'Ajout...' : 'Ajouter'}
                      </button>
                    </div>
                  )}

                  {intervention.parts && intervention.parts.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d&apos;ajout</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {intervention.parts.map(part => (
                            <tr key={part.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {part.articleId} - {part.nom_article}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {part.quantite}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(part.createdAt).toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-200 border-dashed">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Aucune pièce n&apos;a été utilisée pour cette intervention.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-2xl">
          <div className="text-xs text-gray-400">
            Dernière mise à jour : {new Date(intervention.updatedAt).toLocaleString('fr-FR')}
          </div>
          <div className="flex gap-3">
            {(intervention.status === 'PLANIFIÉE' || intervention.status === 'EN_ATTENTE' || intervention.status === 'En attente') && (
              <button 
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
              >
                <Play className="w-4 h-4" /> Démarrer l&apos;intervention
              </button>
            )}
            
            {(intervention.status === 'EN_COURS' || intervention.status === 'En cours') && !completing && (
              <button 
                onClick={() => { setActiveTab('details'); setCompleting(true); }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Terminer
              </button>
            )}
            
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
