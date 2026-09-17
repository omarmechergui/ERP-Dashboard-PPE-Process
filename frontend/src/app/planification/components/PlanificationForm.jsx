"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, FileText, CheckCircle2, ChevronRight, ChevronLeft, Package, Clock, Loader2, Plus, Trash2, Settings, ClipboardList, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlanification } from "../hooks/usePlanification";
import { format } from "date-fns";

export default function PlanificationForm({ isOpen, onClose, onSubmit, initialData = null, boms = [], users = { gls: [], superviseurs: [] } }) {
  const { createPlanification, updatePlanification, searchPanneaux } = usePlanification();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    project: "",
    customer: "",
    description: "",
    priority: "NORMAL",
    date_debut: "",
    date_fin: "",
    bom_id: "",
    quantite: "",
    production_mode: "", // BOM, FIX, MANUEL, or empty
    matricule_gl: "",
    matricule_superviseur: "",
    panneaux: [],
    actions: [],
    progress: 0
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError("");
      setSearchQuery("");
      setSearchResults([]);
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          project: initialData.project || "",
          customer: initialData.customer || "",
          description: initialData.description || "",
          priority: initialData.priority || "NORMAL",
          date_debut: initialData.date_debut ? format(new Date(initialData.date_debut), 'yyyy-MM-dd') : "",
          date_fin: initialData.date_fin ? format(new Date(initialData.date_fin), 'yyyy-MM-dd') : "",
          bom_id: initialData.bom_id || "",
          quantite: initialData.quantite || "",
          production_mode: initialData.production_mode || "",
          matricule_gl: initialData.matricule_gl || "",
          matricule_superviseur: initialData.matricule_superviseur || "",
          panneaux: initialData.panneaux || [],
          actions: initialData.actions || [],
          progress: initialData.progress || 0
        });
      } else {
        setFormData({
          title: "",
          project: "",
          customer: "",
          description: "",
          priority: "NORMAL",
          date_debut: "",
          date_fin: "",
          bom_id: "",
          quantite: "",
          production_mode: "",
          matricule_gl: "",
          matricule_superviseur: "",
          panneaux: [],
          actions: [],
          progress: 0
        });
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && users) {
      setFormData(prev => ({
        ...prev,
        matricule_gl: prev.matricule_gl || users.gls?.[0]?.matricule || "",
        matricule_superviseur: prev.matricule_superviseur || users.superviseurs?.[0]?.matricule || ""
      }));
    }
  }, [isOpen, users]);

  useEffect(() => {
    if (formData.production_mode === "FIX") {
      const abortController = new AbortController();
      const fetchPanneaux = async () => {
        setIsSearching(true);
        try {
          const results = await searchPanneaux(searchQuery, abortController.signal);
          const selectedIds = formData.panneaux.map(p => p.id);
          setSearchResults((results || []).filter(p => !selectedIds.includes(p.id)));
        } catch (err) {
          // handled in hook
        } finally {
          setIsSearching(false);
        }
      };
      const timeoutId = setTimeout(fetchPanneaux, 300);
      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    }
  }, [searchQuery, formData.production_mode, formData.panneaux, searchPanneaux]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === "" ? "" : Number(value)) : value
    }));
    setError("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.date_debut || !formData.date_fin) {
        setError("Veuillez remplir le titre et les dates.");
        return;
      }
      if (new Date(formData.date_debut) > new Date(formData.date_fin)) {
        setError("La date de fin doit être après la date de début.");
        return;
      }
      if (!formData.matricule_gl || !formData.matricule_superviseur) {
        setError("Veuillez assigner un GL et un superviseur.");
        return;
      }
    }
    if (step === 2) {
      if (formData.production_mode === "BOM") {
        if (!formData.quantite || formData.quantite <= 0) {
          setError("La quantité à produire est requise pour le mode BOM.");
          return;
        }
      } else if (formData.production_mode === "FIX") {
        if (formData.panneaux.length === 0) {
          setError("Un Fix doit contenir au moins un panneau.");
          return;
        }
      } else if (formData.production_mode === "MANUEL") {
        if (formData.panneaux.length === 0) {
          setError("La production manuelle requiert au moins un panneau.");
          return;
        }
      }
      // If production_mode === "" (Aucun), it's valid as draft.
    }
    setStep(prev => prev + 1);
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...formData,
        date_debut: new Date(formData.date_debut).toISOString(),
        date_fin: new Date(formData.date_fin).toISOString(),
        quantite: formData.quantite === "" ? null : Number(formData.quantite),
        production_mode: formData.production_mode === "" ? "AUCUNE" : formData.production_mode,
        bom_id: formData.production_mode === "BOM" ? formData.bom_id : null,
        progress: formData.progress === "" ? 0 : Number(formData.progress)
      };
      
      if (initialData && initialData.id) {
        await updatePlanification(initialData.id, payload);
      } else {
        await createPlanification(payload);
      }
      
      onSubmit();
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Panneaux Management
  const addPanneau = () => {
    setFormData(prev => ({
      ...prev,
      panneaux: [...prev.panneaux, { title_panneau: `Panneau ${prev.panneaux.length + 1}` }]
    }));
  };
  const updatePanneau = (index, value) => {
    const newPanneaux = [...formData.panneaux];
    newPanneaux[index].title_panneau = value;
    setFormData(prev => ({ ...prev, panneaux: newPanneaux }));
  };
  const removePanneau = (index) => {
    const newPanneaux = formData.panneaux.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, panneaux: newPanneaux }));
  };

  // Actions Management
  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { nom: "", description: "", priorite: "NORMAL", obligatoire: false, checklists: [] }]
    }));
  };
  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index][field] = value;
    setFormData(prev => ({ ...prev, actions: newActions }));
  };
  const removeAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  // Checklist Management
  const addChecklistItem = (actionIndex) => {
    const newActions = [...formData.actions];
    newActions[actionIndex].checklists.push({ libelle: "", description: "", obligatoire: true });
    setFormData(prev => ({ ...prev, actions: newActions }));
  };
  const updateChecklistItem = (actionIndex, checklistIndex, field, value) => {
    const newActions = [...formData.actions];
    newActions[actionIndex].checklists[checklistIndex][field] = value;
    setFormData(prev => ({ ...prev, actions: newActions }));
  };
  const removeChecklistItem = (actionIndex, checklistIndex) => {
    const newActions = [...formData.actions];
    newActions[actionIndex].checklists = newActions[actionIndex].checklists.filter((_, i) => i !== checklistIndex);
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nouvelle Planification</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Configuration de la production (BOM, Fix, Actions)</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 bg-white border-b border-slate-100 flex justify-between relative flex-shrink-0">
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step > i ? 'bg-emerald-500 text-white' : step === i ? 'bg-blue-600 text-white ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
              <span className={`text-xs font-semibold ${step >= i ? 'text-slate-800' : 'text-slate-400'}`}>
                {i === 1 ? 'Infos' : i === 2 ? 'Production' : i === 3 ? 'Actions' : 'Validation'}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Metadata */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre de la planification <span className="text-rose-500">*</span></label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Prod Semaine 42 - F-150" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projet</label>
                    <input type="text" name="project" value={formData.project} onChange={handleChange} placeholder="Nom du projet" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client</label>
                    <input type="text" name="customer" value={formData.customer} onChange={handleChange} placeholder="Nom du client" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de début <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de fin <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="date" name="date_fin" value={formData.date_fin} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description (Optionnelle)</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} placeholder="Ajoutez des notes ou instructions spécifiques..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User className="w-4 h-4" /> Group Leader <span className="text-rose-500">*</span></label>
                    <select name="matricule_gl" value={formData.matricule_gl} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all">
                      <option value="">Sélectionner un GL</option>
                      {users.gls?.map(u => <option key={u.matricule} value={u.matricule}>{u.nom} — {u.matricule}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><User className="w-4 h-4" /> Superviseur <span className="text-rose-500">*</span></label>
                    <select name="matricule_superviseur" value={formData.matricule_superviseur} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 transition-all">
                      <option value="">Sélectionner un Superviseur</option>
                      {users.superviseurs?.map(u => <option key={u.matricule} value={u.matricule}>{u.nom} — {u.matricule}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Production Source */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source de production</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {[
                      { id: "BOM", label: "Production par BOM", icon: Package, desc: "Basée sur nomenclature" },
                      { id: "FIX", label: "Production Fix", icon: Settings, desc: "Réparation / Spécifique" },
                      { id: "MANUEL", label: "Production Manuelle", icon: FileText, desc: "Panneaux personnalisés" },
                      { id: "", label: "Aucune", icon: Clock, desc: "Brouillon initial" }
                    ].map(mode => (
                      <div 
                        key={mode.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, production_mode: mode.id === "AUCUNE" ? "" : mode.id }));
                          setError("");
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                          (formData.production_mode === mode.id) || (formData.production_mode === "AUCUNE" && mode.id === "")
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <mode.icon className="w-6 h-6" />
                        <div>
                          <p className="font-bold text-sm">{mode.label}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{mode.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields based on Mode */}
                <div className="mt-8">
                  {formData.production_mode === "BOM" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sélection du BOM <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                          {boms.map(bom => (
                            <div
                              key={bom.id}
                              onClick={() => setFormData(prev => ({ ...prev, bom_id: bom.id }))}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                formData.bom_id === bom.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                              }`}
                            >
                              <p className="font-bold text-slate-800 text-sm">{bom.nom_projet}</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">BOM: {bom.nom_bom} | Jig: {bom.jig}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantité à produire <span className="text-rose-500">*</span></label>
                        <input type="number" name="quantite" min="1" value={formData.quantite} onChange={handleChange} className="w-full px-4 py-3 text-lg font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" />
                      </div>
                    </div>
                  )}

                  {(formData.production_mode === "FIX" || formData.production_mode === "MANUEL") && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      {formData.production_mode === "FIX" && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantité globale du Fix (Optionnelle)</label>
                          <input type="number" name="quantite" min="1" value={formData.quantite} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ex: 50" />
                          <p className="text-xs text-slate-500">Définit la quantité totale si différente du nombre de panneaux.</p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            Panneaux Sélectionnés
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{formData.panneaux.length}</span>
                          </label>
                          {formData.production_mode === "MANUEL" && (
                            <button onClick={addPanneau} className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5" /> Ajouter un panneau
                            </button>
                          )}
                        </div>
                        
                        {formData.panneaux.length === 0 ? (
                          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-sm text-slate-500">Aucun panneau sélectionné.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {formData.panneaux.map((panneau, i) => (
                              <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
                                <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                {panneau.id ? (
                                  <div className="flex-1 px-2">
                                     <p className="text-sm font-bold text-slate-800">{panneau.title_panneau}</p>
                                     <p className="text-[10px] text-slate-400 font-mono mt-0.5">{panneau.id}</p>
                                  </div>
                                ) : (
                                  <input 
                                    type="text" 
                                    value={panneau.title_panneau} 
                                    onChange={(e) => updatePanneau(i, e.target.value)}
                                    className="flex-1 px-3 py-2 bg-transparent text-sm font-medium focus:outline-none"
                                    placeholder="Référence / Nom du panneau"
                                  />
                                )}
                                <button onClick={() => removePanneau(i)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.production_mode === "FIX" && (
                     <div className="mt-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Search className="w-4 h-4" /> Rechercher des panneaux existants
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par ID ou titre..."
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                          {isSearching && (
                             <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                          )}
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                          {searchResults.length > 0 ? (
                            searchResults.map(panneau => (
                              <div key={panneau.id} onClick={() => {
                                setFormData(prev => ({ ...prev, panneaux: [...prev.panneaux, panneau] }));
                              }} className="p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center transition-colors group">
                                <div>
                                  <p className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">{panneau.title_panneau}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{panneau.id}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                </div>
                              </div>
                            ))
                          ) : (
                            !isSearching && (
                              <div className="text-center py-6 text-slate-400">
                                <p className="text-sm font-medium">Aucun panneau trouvé</p>
                                <p className="text-xs mt-1">Modifiez votre recherche</p>
                              </div>
                            )
                          )}
                        </div>
                     </div>
                  )}

                  {(formData.production_mode === "" || formData.production_mode === "AUCUNE") && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                       <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                         
                         <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                           <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                           <div>
                             <h4 className="font-bold text-emerald-800 text-sm">Production sans BOM</h4>
                             <p className="text-xs text-emerald-600 mt-1">Cette planification ne nécessite aucune BOM ni composants spécifiques.</p>
                           </div>
                         </div>

                         <div className="space-y-3">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantité à produire (Optionnelle)</label>
                           <div className="flex items-center gap-3">
                             <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantite: Math.max(0, (prev.quantite || 0) - 1) }))} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold text-lg">
                               −
                             </button>
                             <input 
                               type="number" 
                               name="quantite" 
                               min="0" 
                               value={formData.quantite === "" ? 0 : formData.quantite} 
                               onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                  setFormData(prev => ({ ...prev, quantite: Math.max(0, val) }));
                               }}
                               className="w-24 text-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                             />
                             <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantite: (prev.quantite || 0) + 1 }))} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold text-lg">
                               +
                             </button>
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                           <div className="flex justify-between items-end">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description / Action <span className="text-rose-500">*</span></label>
                             <span className="text-[10px] text-slate-400 font-mono">{formData.description?.length || 0} / 500 caractères</span>
                           </div>
                           <textarea 
                             name="description" 
                             value={formData.description || ''} 
                             onChange={(e) => {
                               if (e.target.value.length <= 500) {
                                 handleChange(e);
                               }
                             }} 
                             rows={4} 
                             placeholder="Décrire l'action ou le travail à réaliser..." 
                             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all resize-none" 
                           />
                         </div>

                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progression initiale (%)</label>
                           <input 
                             type="number" 
                             name="progress" 
                             min="0" 
                             max="100" 
                             value={formData.progress === null ? 0 : formData.progress} 
                             onChange={handleChange} 
                             className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" 
                           />
                         </div>

                       </div>
                     </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* STEP 3: Actions Spécifiques */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Actions Spécifiques</h3>
                    <p className="text-sm text-slate-500">Définissez des actions de production personnalisées avec des checklists.</p>
                  </div>
                  <button onClick={addAction} className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Nouvelle Action
                  </button>
                </div>

                {formData.actions.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Aucune action spécifique définie</p>
                    <p className="text-sm text-slate-400 mt-1">Ces actions sont optionnelles et permettent d'ajouter des tâches hors nomenclature.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.actions.map((action, actionIdx) => (
                      <div key={actionIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <input 
                              type="text" 
                              value={action.nom} 
                              onChange={(e) => updateAction(actionIdx, 'nom', e.target.value)}
                              placeholder="Nom de l'action (ex: Préparation spéciale connecteur)"
                              className="w-full text-base font-bold bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none pb-1"
                            />
                            <div className="flex gap-4 items-center">
                              <select 
                                value={action.priorite} 
                                onChange={(e) => updateAction(actionIdx, 'priorite', e.target.value)}
                                className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 border-none focus:ring-0 cursor-pointer"
                              >
                                <option value="BASSE">Priorité: Basse</option>
                                <option value="NORMAL">Priorité: Normale</option>
                                <option value="HAUTE">Priorité: Haute</option>
                                <option value="CRITIQUE">Priorité: Critique</option>
                              </select>
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={action.obligatoire}
                                  onChange={(e) => updateAction(actionIdx, 'obligatoire', e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                Action Obligatoire
                              </label>
                            </div>
                            <input 
                              type="text" 
                              value={action.description} 
                              onChange={(e) => updateAction(actionIdx, 'description', e.target.value)}
                              placeholder="Description optionnelle..."
                              className="w-full text-sm text-slate-500 bg-transparent focus:outline-none"
                            />
                          </div>
                          <button onClick={() => removeAction(actionIdx)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checklist</h4>
                            <button onClick={() => addChecklistItem(actionIdx)} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Ajouter contrôle
                            </button>
                          </div>
                          <div className="space-y-2">
                            {action.checklists.map((chk, chkIdx) => (
                              <div key={chkIdx} className="flex gap-3 items-start group">
                                <input 
                                  type="checkbox" 
                                  checked={chk.obligatoire}
                                  onChange={(e) => updateChecklistItem(actionIdx, chkIdx, 'obligatoire', e.target.checked)}
                                  className="mt-1 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                  title="Contrôle obligatoire ?"
                                />
                                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center">
                                  <input 
                                    type="text" 
                                    value={chk.libelle} 
                                    onChange={(e) => updateChecklistItem(actionIdx, chkIdx, 'libelle', e.target.value)}
                                    placeholder="Libellé du contrôle (ex: Vérifier le sertissage)"
                                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                                  />
                                </div>
                                <button onClick={() => removeChecklistItem(actionIdx, chkIdx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {action.checklists.length === 0 && (
                              <p className="text-xs text-slate-400 italic">Aucun élément de checklist.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: Validation */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                    Résumé de la Planification
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-6 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Titre</p>
                      <p className="font-bold text-slate-800 text-base">{formData.title}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Période</p>
                      <p className="font-bold text-slate-800">
                        {formData.date_debut ? format(new Date(formData.date_debut), 'dd/MM/yyyy') : ''} → {formData.date_fin ? format(new Date(formData.date_fin), 'dd/MM/yyyy') : ''}
                      </p>
                    </div>
                    
                    <div className="col-span-2 border-t border-slate-100" />
                    
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Mode de Production</p>
                      <p className="font-bold text-blue-600 text-base">
                        {formData.production_mode === 'BOM' ? 'BOM' : 
                         formData.production_mode === 'FIX' ? 'Fix' : 
                         formData.production_mode === 'MANUEL' ? 'Manuelle' : 'AUCUNE'}
                      </p>
                    </div>
                    
                    {(formData.production_mode === "" || formData.production_mode === "AUCUNE") ? (
                      <>
                        <div className="col-span-1">
                          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Quantité à produire</p>
                          <p className="font-bold text-slate-800 text-base">{formData.quantite || 0}</p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Progression</p>
                          <p className="font-bold text-slate-800 text-base">{formData.progress || 0}%</p>
                        </div>
                        <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Description / Action</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{formData.description || "—"}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Quantité à produire</p>
                        <p className="font-bold text-slate-800 text-base">{formData.quantite || '—'}</p>
                      </div>
                    )}

                    {formData.production_mode !== "" && formData.production_mode !== "AUCUNE" && (
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <p className="text-xl font-black text-slate-700">{formData.production_mode === 'BOM' ? 'Auto' : formData.panneaux.length}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Panneaux</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                        <p className="text-xl font-black text-indigo-700">{formData.actions.length}</p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">Actions</p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xl font-black text-emerald-700">{formData.actions.reduce((acc, a) => acc + a.checklists.length, 0)}</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Checklists</p>
                      </div>
                    </div>
                    )}

                    <div className="col-span-2 border-t border-slate-100" />

                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Group Leader</p>
                      <p className="font-bold text-slate-800">{users.gls?.find(u => u.matricule === formData.matricule_gl)?.nom || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Superviseur</p>
                      <p className="font-bold text-slate-800">{users.superviseurs?.find(u => u.matricule === formData.matricule_superviseur)?.nom || '—'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0 z-20 relative shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="flex-1">
            {error && (
              <p className="text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-block animate-in fade-in">
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {step > 1 ? (
              <button onClick={() => setStep(prev => prev - 1)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2" disabled={loading}>
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>
            ) : (
              <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors" disabled={loading}>
                Annuler
              </button>
            )}

            {step < 4 ? (
              <button onClick={handleNext} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 shadow-blue-500/20">
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 shadow-emerald-500/20">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><CheckCircle2 className="w-4 h-4" /> Enregistrer la planification</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
