"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, Search, User, AlertTriangle, CheckCircle2, X, ChevronRight, ChevronLeft, Package, ShieldCheck } from "lucide-react";
import API from "@/lib/api";

export default function ReservationForm({ onClose, onReservationCreated }) {
  const [step, setStep] = useState(1);

  // Data State
  const [client, setClient] = useState("");
  const [lignes, setLignes] = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Article selector
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchArticles() {
      try {
        setArticlesLoading(true);
        const res = await API.get("/stock/articles");
        setAllArticles(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setArticlesLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return allArticles;
    const q = articleSearch.toLowerCase();
    return allArticles.filter(a =>
      a.nom_article?.toLowerCase().includes(q) ||
      a.id?.toLowerCase().includes(q)
    );
  }, [allArticles, articleSearch]);

  const selectedArticle = useMemo(() => {
    return allArticles.find(a => a.id === selectedArticleId) || null;
  }, [allArticles, selectedArticleId]);

  const handleAddArticle = () => {
    if (!selectedArticle) return;
    const qty = Number(quantity);
    if (qty <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    const available = selectedArticle.quantite - (selectedArticle.reserved_qty || 0);
    if (qty > available) {
      setError(`Stock disponible insuffisant. Maximum: ${available}`);
      return;
    }

    setLignes(prev => {
      const existingIdx = prev.findIndex(l => l.article_id === selectedArticle.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantite: updated[existingIdx].quantite + qty };
        return updated;
      }
      return [...prev, {
        article_id: selectedArticle.id,
        nom_article: selectedArticle.nom_article,
        prix: selectedArticle.prix,
        quantite: qty,
        available,
        totalStock: selectedArticle.quantite,
        reserved_qty: selectedArticle.reserved_qty || 0,
      }];
    });
    setError("");
    setSelectedArticleId("");
    setQuantity(1);
  };

  const removeLigne = (idx) => {
    setLignes(prev => prev.filter((_, i) => i !== idx));
  };

  const total = useMemo(() => {
    return lignes.reduce((acc, l) => acc + l.prix * l.quantite, 0);
  }, [lignes]);

  // Stock readiness for step 3
  const stockReadiness = useMemo(() => {
    return lignes.map(l => {
      const missing = Math.max(0, l.quantite - l.available);
      let status = "READY";
      if (missing >= l.quantite) status = "BLOCKED";
      else if (missing > 0) status = "PARTIAL";
      return { ...l, missing, status };
    });
  }, [lignes]);

  const readySummary = useMemo(() => {
    const ready = stockReadiness.filter(s => s.status === "READY").length;
    const partial = stockReadiness.filter(s => s.status === "PARTIAL").length;
    const blocked = stockReadiness.filter(s => s.status === "BLOCKED").length;
    return { ready, partial, blocked };
  }, [stockReadiness]);

  const handleNext = () => {
    if (step === 1 && !client.trim()) {
      setError("Veuillez saisir le nom du client.");
      return;
    }
    if (step === 2 && lignes.length === 0) {
      setError("Veuillez ajouter au moins un article.");
      return;
    }
    setError("");
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        client,
        lignes: lignes.map(l => ({
          article_id: l.article_id,
          quantite: l.quantite,
        })),
      };
      await API.post("/reservations", payload);
      if (onReservationCreated) onReservationCreated();
    } catch (err) {
      setError(err?.error || err?.message || "Erreur lors de la création de la réservation.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Nouvelle Réservation</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-center">
            <div className="flex items-center w-full max-w-lg mx-auto">
              <StepIndicator num={1} label="Client" active={step >= 1} completed={step > 1} />
              <div className={`flex-1 h-1 mx-2 rounded ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <StepIndicator num={2} label="Articles" active={step >= 2} completed={step > 2} />
              <div className={`flex-1 h-1 mx-2 rounded ${step > 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <StepIndicator num={3} label="Stock" active={step >= 3} completed={step > 3} />
              <div className={`flex-1 h-1 mx-2 rounded ${step > 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <StepIndicator num={4} label="Confirmer" active={step >= 4} completed={step > 4} />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 bg-rose-50 text-rose-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-rose-100">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Client */}
            {step === 1 && (
              <div className="space-y-6 max-w-lg mx-auto py-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Informations Client</h3>
                  <p className="text-slate-500 text-sm mt-1">Pour quel client souhaitez-vous réserver du stock ?</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du client <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 transition-all shadow-sm"
                    placeholder="Nom de l'entreprise ou du client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Articles */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Ajouter des articles</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">Filtrer</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher par nom ou ID..."
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={articleSearch}
                          onChange={(e) => setArticleSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full">
                        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">Article</label>
                        <select
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={selectedArticleId}
                          onChange={(e) => { setSelectedArticleId(e.target.value); setError(""); }}
                        >
                          <option value="">— Sélectionner un article —</option>
                          {articlesLoading ? (
                            <option disabled>Chargement...</option>
                          ) : (
                            filteredArticles.map((a, i) => {
                              const avail = a.quantite - (a.reserved_qty || 0);
                              return (
                                <option key={`${a.id}-${i}`} value={a.id}>
                                  {a.nom_article} (Dispo: {avail} | {a.prix?.toFixed(2)} DT)
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          disabled={!selectedArticle}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddArticle}
                        disabled={!selectedArticle}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px]"
                      >
                        Ajouter
                      </button>
                    </div>
                    {selectedArticle && (
                      <div className="text-xs bg-blue-50 text-blue-700 border border-blue-100 p-3 rounded-lg flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock total: {selectedArticle.quantite} | Réservé: {selectedArticle.reserved_qty || 0} | Disponible: {selectedArticle.quantite - (selectedArticle.reserved_qty || 0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles List */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Articles sélectionnés ({lignes.length})</h3>
                  {lignes.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Aucun article ajouté</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Article</th>
                            <th className="py-3 px-4 font-semibold text-right">P.U.</th>
                            <th className="py-3 px-4 font-semibold text-center w-24">Qté</th>
                            <th className="py-3 px-4 font-semibold text-right">Total</th>
                            <th className="py-3 px-4 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lignes.map((l, idx) => (
                            <tr key={l.article_id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-800">
                                {l.nom_article}
                                <div className="text-xs text-slate-400 font-normal mt-0.5">Dispo: {l.available}</div>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500">{l.prix.toFixed(2)}</td>
                              <td className="py-3 px-4 text-center font-semibold">{l.quantite}</td>
                              <td className="py-3 px-4 text-right font-medium text-slate-800">{(l.prix * l.quantite).toFixed(2)}</td>
                              <td className="py-3 px-4 text-center">
                                <button onClick={() => removeLigne(idx)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan="3" className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-xs">Total:</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">{total.toFixed(2)} DT</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Stock Readiness */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Package className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Vérification du stock</h3>
                  <p className="text-slate-500 text-sm mt-1">Vérifiez la disponibilité avant de confirmer.</p>
                </div>

                <div className="flex justify-center gap-6 mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700">{readySummary.ready} disponibles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-slate-700">{readySummary.partial} partiels</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-slate-700">{readySummary.blocked} insuffisants</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {stockReadiness.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${
                      item.status === "READY" ? "bg-emerald-50 border-emerald-200" :
                      item.status === "PARTIAL" ? "bg-amber-50 border-amber-200" :
                      "bg-rose-50 border-rose-200"
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-800">{item.nom_article}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.status === "READY" ? "bg-emerald-100 text-emerald-700" :
                          item.status === "PARTIAL" ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>
                          {item.status === "READY" ? "✓ DISPONIBLE" : item.status === "PARTIAL" ? "⚠ PARTIEL" : "✕ INSUFFISANT"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                        <div>Demandé: <span className="font-bold text-slate-800">{item.quantite}</span></div>
                        <div>Disponible: <span className="font-bold text-slate-800">{item.available}</span></div>
                        <div>Manquant: <span className={`font-bold ${item.missing > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{item.missing}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Confirmation</h3>
                  <p className="text-slate-500 text-sm mt-1">Vérifiez les informations avant d&apos;enregistrer.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Client</h4>
                    <p className="font-semibold text-slate-800 text-lg">{client}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Récapitulatif</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-600 font-medium">{lignes.length} articles</span>
                      <span className="text-2xl font-bold text-slate-900">{total.toFixed(2)} DT</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Article</th>
                        <th className="py-2 px-4 font-semibold text-center">Qté</th>
                        <th className="py-2 px-4 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lignes.map(l => (
                        <tr key={l.article_id}>
                          <td className="py-2 px-4 font-medium text-slate-800">{l.nom_article}</td>
                          <td className="py-2 px-4 text-center text-slate-600">{l.quantite}</td>
                          <td className="py-2 px-4 text-right text-slate-600">{(l.prix * l.quantite).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                Enregistrer la réservation
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StepIndicator({ num, label, active, completed }) {
  return (
    <div className="flex flex-col items-center gap-1 w-16">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
        completed ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
      }`}>
        {completed ? <CheckCircle2 className="w-5 h-5" /> : num}
      </div>
      <span className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}
