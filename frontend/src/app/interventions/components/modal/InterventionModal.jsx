import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Wrench, FileText, AlertTriangle, Loader2, Activity } from 'lucide-react';
import API from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';

const TYPE_OPTIONS = [
  { value: 'Corrective', label: 'Corrective' },
  { value: 'Préventive', label: 'Préventive' },
];

const PRIORITY_OPTIONS = [
  { value: 'Basse', label: 'Basse' },
  { value: 'Normal', label: 'Normale' },
  { value: 'Haute', label: 'Haute' },
  { value: 'Critique', label: 'Critique' },
];

const STATUS_OPTIONS = [
  { value: 'En attente', label: 'En attente' },
  { value: 'En cours', label: 'En cours' },
  { value: 'Clôturée', label: 'Clôturée' },
];

const SHIFT_OPTIONS = [
  { value: '', label: '— Aucun —' },
  { value: 'Matin', label: 'Matin' },
  { value: 'Après-midi', label: 'Après-midi' },
  { value: 'Nuit', label: 'Nuit' },
];

const emptyForm = {
  machineId: '',
  technicienId: '',
  type: 'Corrective',
  kpiType: '',
  priority: 'Normal',
  shift: '',
  status: 'En attente',
  defaut: '',
  action: '',
  downtime: '',
  codeSap: '',
};

function mapInterventionToForm(apiData) {
  return {
    machineId: apiData.machineId ?? '',
    technicienId: apiData.technicienId ?? '',
    type: apiData.type || 'Corrective',
    kpiType: apiData.kpiType || '',
    priority: apiData.priority || 'Normal',
    shift: apiData.shift || '',
    status: apiData.status || 'En attente',
    defaut: apiData.defaut || '',
    action: apiData.action || '',
    downtime: apiData.downtime ?? '',
    codeSap: apiData.codeSap || '',
  };
}

function mapFormToPayload(formData) {
  return {
    machineId: formData.machineId ? formData.machineId : null,
    technicienId: formData.technicienId ? formData.technicienId : null,
    type: formData.type,
    kpiType: formData.kpiType || null,
    priority: formData.priority,
    shift: formData.shift || null,
    status: formData.status,
    defaut: formData.defaut,
    action: formData.action || null,
    downtime: formData.downtime !== '' ? parseFloat(formData.downtime) : null,
    codeSap: formData.codeSap || null,
  };
}

export default function InterventionModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState(emptyForm);
  const [machines, setMachines] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  
  const isEditing = !!initialData && !!initialData.id;

  useEffect(() => {
    if (!isOpen) return;

    setLoadingRef(true);
    setApiError(null);

    Promise.all([
      API.get('/maintenance/machines').then(r => r.data?.data || []),
      API.get('/maintenance/techniciens').then(r => r.data?.data?.techniciens || []),
    ])
      .then(([machinesData, techniciensData]) => {
        setMachines(machinesData);
        setTechniciens(techniciensData);
      })
      .catch(err => {
        console.error('Failed to load reference data:', err);
        setApiError('Erreur lors du chargement des données de référence.');
      })
      .finally(() => setLoadingRef(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setApiError(null);
    setSaving(false);

    if (initialData) {
      setFormData(mapInterventionToForm(initialData));
    } else {
      setFormData({ ...emptyForm });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handleKpiSelect = (kpiType) => {
    setFormData(prev => ({ ...prev, kpiType }));
    if (errors.kpiType) {
      setErrors(prev => { const next = { ...prev }; delete next.kpiType; return next; });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.defaut || formData.defaut.trim() === '') {
      newErrors.defaut = 'La description du problème est obligatoire.';
    }
    if (formData.downtime !== '' && (isNaN(parseFloat(formData.downtime)) || parseFloat(formData.downtime) < 0)) {
      newErrors.downtime = 'La durée doit être une valeur numérique positive.';
    }
    // Only require KPI selection on creation or if one was already set
    if (!isEditing && !formData.kpiType) {
      newErrors.kpiType = 'Veuillez sélectionner un type de KPI.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to the first error if needed
      const firstError = document.querySelector('.border-danger');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = mapFormToPayload(formData);
      const result = await onSubmit(payload);

      if (result && !result.success) {
        setApiError(result.error || 'Une erreur est survenue lors de l\'enregistrement.');
        setSaving(false);
      }
    } catch (err) {
      setApiError(err.message || 'Une erreur inattendue est survenue.');
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 bg-background border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
      errors[field] 
        ? 'border-danger focus:border-danger focus:ring-danger/20 text-danger' 
        : 'border-input focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted'
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  const labelClass = "block text-sm font-semibold text-secondary-foreground mb-1.5";

  const modalFooter = (
    <>
      <button 
        type="button" 
        onClick={onClose}
        disabled={saving}
        className="px-5 py-2.5 text-sm font-bold text-secondary-foreground bg-card border border-border rounded-xl hover:bg-secondary transition-all disabled:opacity-50"
      >
        Annuler
      </button>
      <button 
        type="submit" 
        form="intervention-form"
        disabled={saving || loadingRef}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEditing ? 'Enregistrement...' : 'Création...'}
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {isEditing ? 'Enregistrer les modifications' : 'Créer l\'intervention'}
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier l\'intervention' : 'Nouvelle Intervention'}
      description="Remplissez les informations concernant l'intervention de maintenance."
      footer={modalFooter}
      maxWidth="max-w-4xl"
    >
      {apiError && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm font-medium text-danger flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{apiError}</p>
        </div>
      )}

      {loadingRef ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium">Chargement des données...</p>
        </div>
      ) : (
        <form id="intervention-form" onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Informations Générales */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="w-4 h-4 text-primary" />
              Informations Générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Machine / Équipement</label>
                <select
                  name="machineId"
                  value={formData.machineId}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('machineId')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">— Aucune —</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.code} — {m.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Type d&apos;intervention</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('type')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={labelClass}>Priorité</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('priority')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  Problème / Défaut constaté <span className="text-danger">*</span>
                </label>
                <textarea
                  name="defaut"
                  id="defaut"
                  value={formData.defaut}
                  onChange={handleChange}
                  disabled={saving}
                  rows={3}
                  placeholder="Décrivez la panne ou le constat initial..."
                  className={`${inputClass('defaut')} resize-none`}
                  aria-required="true"
                  aria-invalid={!!errors.defaut}
                />
                {errors.defaut && <p className="mt-1.5 text-xs font-medium text-danger">{errors.defaut}</p>}
              </div>

              <div className="flex flex-col">
                <label id="kpi-label" className={labelClass}>
                  Type de KPI <span className="text-danger">*</span>
                </label>
                {isEditing && !formData.kpiType ? (
                  <div className="p-4 bg-secondary/50 border border-border rounded-xl text-secondary-foreground text-sm flex-1 flex flex-col justify-center">
                    <p className="font-bold flex items-center gap-2"><Activity className="w-4 h-4"/> Non défini (Historique)</p>
                    <p className="mt-1 text-xs opacity-80">Cette intervention utilise la règle de calcul automatique du KPI.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 flex-1" role="radiogroup" aria-labelledby="kpi-label" aria-required="true" aria-invalid={!!errors.kpiType}>
                    <button 
                      type="button"
                      role="radio"
                      aria-checked={formData.kpiType === 'MTTR'}
                      onClick={() => !saving && handleKpiSelect('MTTR')}
                      className={`
                        relative flex flex-col p-3 cursor-pointer border-2 rounded-xl transition-all duration-200 h-full text-left
                        ${formData.kpiType === 'MTTR' 
                          ? 'border-info bg-info/5 shadow-sm' 
                          : 'border-border bg-card hover:border-info/50 hover:bg-secondary/50'}
                        ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                        focus:outline-none focus:ring-2 focus:ring-info/50
                      `}
                    >
                      <div className="flex items-center justify-between mb-1 w-full">
                        <span className={`font-bold ${formData.kpiType === 'MTTR' ? 'text-info' : 'text-foreground'}`}>
                          MTTR
                        </span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.kpiType === 'MTTR' ? 'border-info' : 'border-muted'}`}>
                          {formData.kpiType === 'MTTR' && <div className="w-2 h-2 bg-info rounded-full" />}
                        </div>
                      </div>
                      <span className={`text-xs leading-relaxed ${formData.kpiType === 'MTTR' ? 'text-info/80 font-medium' : 'text-secondary-foreground'}`}>
                        Intervention corrective / réparation
                      </span>
                    </button>

                    <button 
                      type="button"
                      role="radio"
                      aria-checked={formData.kpiType === 'MTBF'}
                      onClick={() => !saving && handleKpiSelect('MTBF')}
                      className={`
                        relative flex flex-col p-3 cursor-pointer border-2 rounded-xl transition-all duration-200 h-full text-left
                        ${formData.kpiType === 'MTBF' 
                          ? 'border-success bg-success/5 shadow-sm' 
                          : 'border-border bg-card hover:border-success/50 hover:bg-secondary/50'}
                        ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                        focus:outline-none focus:ring-2 focus:ring-success/50
                      `}
                    >
                      <div className="flex items-center justify-between mb-1 w-full">
                        <span className={`font-bold ${formData.kpiType === 'MTBF' ? 'text-success' : 'text-foreground'}`}>
                          MTBF
                        </span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.kpiType === 'MTBF' ? 'border-success' : 'border-muted'}`}>
                          {formData.kpiType === 'MTBF' && <div className="w-2 h-2 bg-success rounded-full" />}
                        </div>
                      </div>
                      <span className={`text-xs leading-relaxed ${formData.kpiType === 'MTBF' ? 'text-success/80 font-medium' : 'text-secondary-foreground'}`}>
                        Fiabilité / fonctionnement entre pannes
                      </span>
                    </button>
                  </div>
                )}
                {errors.kpiType && <p className="mt-1.5 text-xs font-medium text-danger">{errors.kpiType}</p>}
              </div>
            </div>
          </section>

          {/* Section: Exécution */}
          <section className="space-y-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
              <Wrench className="w-4 h-4 text-warning" />
              Exécution & Détails
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-2">
                <label className={labelClass}>Technicien Assigné</label>
                <select
                  name="technicienId"
                  value={formData.technicienId}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('technicienId')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="">— Non assigné —</option>
                  {techniciens.map(t => (
                    <option key={t.id} value={t.id}>{t.empNumber} — {t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Temps (minutes)</label>
                <input
                  type="number"
                  name="downtime"
                  value={formData.downtime}
                  onChange={handleChange}
                  disabled={saving}
                  min="0"
                  step="1"
                  placeholder="Ex: 30"
                  className={inputClass('downtime')}
                />
                {errors.downtime && <p className="mt-1.5 text-xs font-medium text-danger">{errors.downtime}</p>}
              </div>

              <div>
                <label className={labelClass}>Shift / Poste</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('shift')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {SHIFT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={labelClass}>Code SAP</label>
                <input
                  type="text"
                  name="codeSap"
                  value={formData.codeSap}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Ex: SAP-1234"
                  className={inputClass('codeSap')}
                />
              </div>

              <div>
                <label className={labelClass}>Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                  className={`${inputClass('status')} appearance-none`}
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="lg:col-span-2">
                <label className={labelClass}>Action Réalisée</label>
                <textarea
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  disabled={saving}
                  rows={2}
                  placeholder="Décrivez les actions correctives menées..."
                  className={`${inputClass('action')} resize-none`}
                />
              </div>
            </div>
          </section>

        </form>
      )}
    </Modal>
  );
}
