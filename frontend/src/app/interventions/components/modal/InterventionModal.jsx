import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Wrench, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import API from '../../../../lib/api';

// --- Backend data contract (from Prisma schema) ---
// type:     String  default "Corrective"  → Corrective, Préventive
// priority: String  default "Normal"      → Basse, Normal, Haute, Critique
// status:   String  default "En attente"  → En attente, En cours, Clôturée
// shift:    String? → Matin, Après-midi, Nuit
// defaut:   String  (REQUIRED)
// action:   String?
// downtime: Float?  (hours)
// machineId:    Int?
// technicienId: Int?

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
  priority: 'Normal',
  shift: '',
  status: 'En attente',
  defaut: '',
  action: '',
  downtime: '',
  codeSap: '',
};

// --- Mappers between backend API response and form state ---
function mapInterventionToForm(apiData) {
  return {
    machineId: apiData.machineId ?? '',
    technicienId: apiData.technicienId ?? '',
    type: apiData.type || 'Corrective',
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

  // Load machines and technicians when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors({});
    setApiError(null);
    setSaving(false);

    if (initialData) {
       
      setFormData(mapInterventionToForm(initialData));
    } else {
      setFormData({ ...emptyForm });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.defaut || formData.defaut.trim() === '') {
      newErrors.defaut = 'Ce champ est obligatoire.';
    }
    if (formData.downtime !== '' && (isNaN(parseFloat(formData.downtime)) || parseFloat(formData.downtime) < 0)) {
      newErrors.downtime = 'Valeur numérique positive requise.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      const payload = mapFormToPayload(formData);
      const result = await onSubmit(payload);

      if (result && !result.success) {
        setApiError(result.error || 'Une erreur est survenue.');
        setSaving(false);
      }
      // If success, parent will close the modal
    } catch (err) {
      setApiError(err.message || 'Une erreur est survenue.');
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  const selectClass = (field) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    } disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {isEditing ? <Wrench className="w-5 h-5 text-blue-600" /> : <ShieldCheck className="w-5 h-5 text-blue-600" />}
              {isEditing ? 'Modifier l\'intervention' : 'Nouvelle Intervention'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Veuillez remplir les informations concernant l&apos;intervention de maintenance.
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* API Error Banner */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {apiError}
            </div>
          )}

          {loadingRef ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement des données...
            </div>
          ) : (
            <form id="intervention-form" onSubmit={handleSubmit} className="space-y-8">
            
              {/* General Info Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Informations Générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Machine */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine / Équipement</label>
                    <select
                      name="machineId"
                      value={formData.machineId}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('machineId')}
                    >
                      <option value="">— Aucune —</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.code} — {m.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;intervention</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('type')}
                    >
                      {TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('priority')}
                    >
                      {PRIORITY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Code SAP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code SAP</label>
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

                  {/* Shift */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift / Poste</label>
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('shift')}
                    >
                      {SHIFT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('status')}
                    >
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Problem Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Description du Problème
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Panne / Constat <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="defaut"
                      value={formData.defaut}
                      onChange={handleChange}
                      required
                      disabled={saving}
                      rows={3}
                      placeholder="Décrivez la panne ou le constat initial..."
                      className={`${inputClass('defaut')} resize-none`}
                    ></textarea>
                    {errors.defaut && <p className="mt-1 text-xs text-red-500">{errors.defaut}</p>}
                  </div>
                </div>
              </section>

              {/* Repair Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Wrench className="w-4 h-4 text-emerald-500" /> Détails de l&apos;intervention
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Technicien */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technicien Assigné</label>
                    <select
                      name="technicienId"
                      value={formData.technicienId}
                      onChange={handleChange}
                      disabled={saving}
                      className={selectClass('technicienId')}
                    >
                      <option value="">— Non assigné —</option>
                      {techniciens.map(t => (
                        <option key={t.id} value={t.id}>{t.empNumber} — {t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Downtime */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temps d&apos;arrêt (minutes)</label>
                    <input
                      type="number"
                      name="downtime"
                      value={formData.downtime}
                      onChange={handleChange}
                      disabled={saving}
                      min="0"
                      step="0.25"
                      placeholder="Ex: 2.5"
                      className={inputClass('downtime')}
                    />
                    {errors.downtime && <p className="mt-1 text-xs text-red-500">{errors.downtime}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Réalisée</label>
                  <textarea
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    disabled={saving}
                    rows={3}
                    placeholder="Décrivez les actions correctives menées..."
                    className={`${inputClass('action')} resize-none`}
                  ></textarea>
                </div>
              </section>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            form="intervention-form"
            disabled={saving || loadingRef}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditing ? 'Enregistrement...' : 'Création en cours...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Enregistrer les modifications' : 'Créer l\'intervention'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
