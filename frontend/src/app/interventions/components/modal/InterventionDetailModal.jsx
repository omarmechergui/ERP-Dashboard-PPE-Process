import React, { useState, useEffect } from 'react';
import { Calendar, User, Settings, Clock, CheckCircle, XCircle, AlertTriangle, Play, Package, ShieldAlert, FileText, Activity } from 'lucide-react';
import API from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';
import StatusBadge from '../../../../components/ui/StatusBadge';

const PRIORITY_COLORS = {
  'Basse': 'text-muted bg-secondary',
  'Normal': 'text-info bg-info/10',
  'Haute': 'text-warning bg-warning/10',
  'Critique': 'text-danger bg-danger/10 font-bold',
  'Urgent': 'text-danger bg-danger/20 font-bold',
};

export default function InterventionDetailModal({ isOpen, onClose, interventionId, onUpdate }) {
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // Completion form state
  const [completing, setCompleting] = useState(false);
  const [cause, setCause] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [downtime, setDowntime] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setCompleting(false);
      setActiveTab('details');
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
      setSubmitting(true);
      await API.patch(`/maintenance/interventions/${interventionId}/start`);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Erreur lors du démarrage de l'intervention");
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
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
      setSubmitting(false);
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

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'en attente' || s === 'waiting') return 'En attente';
    if (s === 'en cours' || s === 'in progress') return 'En cours';
    if (s.includes('termin') || s === 'completed' || s.includes('clôtur')) return 'Clôturée';
    if (s === 'cancelled' || s.includes('annul')) return 'Annulée';
    if (s === 'planned' || s.includes('planifi')) return 'Planifiée';
    return status || 'Inconnu';
  };

  const modalFooter = (
    <>
      <div className="flex-1 text-xs font-medium text-muted text-left">
        {intervention && `Dernière mise à jour : ${new Date(intervention.updatedAt).toLocaleString('fr-FR')}`}
      </div>
      <div className="flex gap-3">
        {intervention && (intervention.status === 'PLANIFIÉE' || intervention.status === 'EN_ATTENTE' || intervention.status === 'En attente') && (
          <button 
            onClick={handleStart}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Démarrer l&apos;intervention
          </button>
        )}
        
        {intervention && (intervention.status === 'EN_COURS' || intervention.status === 'En cours') && !completing && (
          <button 
            onClick={() => { setActiveTab('details'); setCompleting(true); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-success-foreground bg-success rounded-xl hover:bg-success/90 shadow-sm transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Terminer
          </button>
        )}
        
        <button 
          onClick={onClose}
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-bold text-secondary-foreground bg-card border border-border rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
        >
          Fermer
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={intervention ? intervention.code : 'Détails de l\'intervention'}
      description={intervention ? (intervention.title || intervention.defaut) : ''}
      footer={modalFooter}
      maxWidth="max-w-5xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Chargement des détails...</p>
        </div>
      ) : error || !intervention ? (
        <div className="py-12 text-center text-danger">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-semibold">{error || "Intervention introuvable"}</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={getStatusLabel(intervention.status)} />
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${PRIORITY_COLORS[intervention.priority] || PRIORITY_COLORS['Normal']}`}>
                {intervention.priority}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Machine</p>
                    <p className="text-secondary-foreground font-medium">{intervention.machine ? `${intervention.machine.code} - ${intervention.machine.nom}` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Technicien</p>
                    <p className="text-secondary-foreground font-medium">{intervention.technicien ? intervention.technicien.nom : 'Non assigné'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Type</p>
                    <p className="text-secondary-foreground font-medium">{intervention.type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">KPI configuré</p>
                    <p className="text-secondary-foreground mt-0.5">
                      {intervention.kpiType === 'MTTR' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-info/10 text-info border border-info/20">MTTR</span>
                      ) : intervention.kpiType === 'MTBF' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-success/10 text-success border border-success/20">MTBF</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">Non défini</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Planification</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Créé le</p>
                    <p className="text-secondary-foreground font-medium">{new Date(intervention.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {intervention.plannedStart && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-2 bg-info/10 rounded-lg text-info">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Début prévu</p>
                      <p className="text-secondary-foreground font-medium">{new Date(intervention.plannedStart).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
                {intervention.actualStart && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-2 bg-warning/10 rounded-lg text-warning">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Début réel</p>
                      <p className="text-secondary-foreground font-medium">{new Date(intervention.actualStart).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
                {intervention.actualEnd && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="p-2 bg-success/10 rounded-lg text-success">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Fin réelle</p>
                      <p className="text-secondary-foreground font-medium">{new Date(intervention.actualEnd).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border bg-secondary/30 px-2 pt-2">
              <button
                className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 rounded-t-lg ${activeTab === 'details' ? 'border-primary text-primary bg-card' : 'border-transparent text-secondary-foreground hover:text-foreground hover:bg-secondary/50'}`}
                onClick={() => setActiveTab('details')}
              >
                Détails & Diagnostic
              </button>
              <button
                className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 rounded-t-lg flex items-center gap-2 ${activeTab === 'parts' ? 'border-primary text-primary bg-card' : 'border-transparent text-secondary-foreground hover:text-foreground hover:bg-secondary/50'}`}
                onClick={() => setActiveTab('parts')}
              >
                Pièces utilisées
                <span className="bg-secondary text-secondary-foreground py-0.5 px-2 rounded-full text-[10px]">{intervention.parts?.length || 0}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto">
              {activeTab === 'details' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-info/5 border border-info/20 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-info mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Description / Constat Initial
                    </h4>
                    <p className="text-foreground font-medium text-sm leading-relaxed">{intervention.description || intervention.defaut}</p>
                  </div>

                  {(intervention.cause || intervention.result || intervention.action) ? (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                        <CheckCircle className="w-4 h-4 text-success" /> Rapport d&apos;Intervention
                      </h4>
                      
                      {intervention.cause && (
                        <div>
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Cause racine</p>
                          <p className="text-foreground font-medium text-sm">{intervention.cause}</p>
                        </div>
                      )}
                      
                      {(intervention.action) && (
                        <div>
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Action réalisée</p>
                          <p className="text-foreground font-medium text-sm">{intervention.action}</p>
                        </div>
                      )}

                      {intervention.result && (
                        <div>
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Résultat</p>
                          <p className="text-foreground font-medium text-sm">{intervention.result}</p>
                        </div>
                      )}

                      {intervention.downtime !== null && (
                        <div>
                          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Temps d&apos;arrêt</p>
                          <p className="text-foreground font-medium text-sm">{intervention.downtime} heures</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-secondary/30 rounded-xl border border-border border-dashed">
                      <p className="text-sm font-medium text-secondary-foreground">Aucun rapport d&apos;intervention n&apos;a été saisi.</p>
                    </div>
                  )}

                  {completing && (
                    <div className="bg-success/5 border border-success/20 rounded-xl p-5 mt-6 animate-slide-up">
                      <h4 className="text-sm font-bold text-success mb-5 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Clôturer l&apos;intervention
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Cause racine (Diagnostic)</label>
                          <textarea 
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all resize-none" 
                            rows={2} 
                            value={cause} 
                            onChange={e => setCause(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Action réalisée</label>
                          <textarea 
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all resize-none" 
                            rows={2} 
                            value={action} 
                            onChange={e => setAction(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Résultat / Observations</label>
                          <textarea 
                            className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all resize-none" 
                            rows={2} 
                            value={result} 
                            onChange={e => setResult(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Temps d&apos;arrêt (minutes)</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              step="1" 
                              min="0" 
                              className="w-32 px-4 py-2.5 bg-background border border-input rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all" 
                              value={downtime} 
                              onChange={e => setDowntime(e.target.value)} 
                            />
                            <span className="text-xs font-medium text-muted">(Laissez vide pour calculer automatiquement)</span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-success/10 mt-4">
                          <button onClick={() => setCompleting(false)} className="px-4 py-2 text-sm font-bold text-secondary-foreground bg-card border border-border rounded-xl hover:bg-secondary transition-all">Annuler</button>
                          <button disabled={submitting} onClick={handleComplete} className="px-6 py-2 text-sm font-bold text-success-foreground bg-success rounded-xl hover:bg-success/90 shadow-sm transition-all disabled:opacity-50">Valider la clôture</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">Pièces consommées</h3>
                  </div>

                  {/* Add Part Form */}
                  {(intervention.status === 'EN_COURS' || intervention.status === 'En cours') && (
                    <div className="bg-secondary/30 border border-border rounded-xl p-4 flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-secondary-foreground mb-1.5">Article du stock</label>
                        <select 
                          value={selectedArticle} 
                          onChange={(e) => setSelectedArticle(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2rem' }}
                        >
                          <option value="">Sélectionner un article...</option>
                          {articles.map(a => (
                            <option key={a.id} value={a.id}>{a.id} - {a.nom_article} (Stock: {a.quantite})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="block text-xs font-semibold text-secondary-foreground mb-1.5">Quantité</label>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="any"
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleAddPart}
                        disabled={addingPart || !selectedArticle}
                        className="px-5 py-2 h-[38px] bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-sm shrink-0"
                      >
                        {addingPart ? 'Ajout...' : 'Ajouter'}
                      </button>
                    </div>
                  )}

                  {intervention.parts && intervention.parts.length > 0 ? (
                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-border text-left">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="px-5 py-3 text-xs font-semibold text-secondary-foreground uppercase tracking-wider">Article</th>
                            <th className="px-5 py-3 text-xs font-semibold text-secondary-foreground uppercase tracking-wider text-right">Quantité</th>
                            <th className="px-5 py-3 text-xs font-semibold text-secondary-foreground uppercase tracking-wider text-right">Date d&apos;ajout</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {intervention.parts.map(part => (
                            <tr key={part.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-5 py-3 text-sm font-semibold text-foreground">
                                {part.articleId} - {part.nom_article}
                              </td>
                              <td className="px-5 py-3 text-sm font-medium text-secondary-foreground text-right">
                                {part.quantite}
                              </td>
                              <td className="px-5 py-3 text-sm font-medium text-secondary-foreground text-right">
                                {new Date(part.createdAt).toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border border-dashed">
                      <Package className="w-10 h-10 text-muted mx-auto mb-3" />
                      <p className="text-sm font-medium text-secondary-foreground">Aucune pièce n&apos;a été utilisée pour cette intervention.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
