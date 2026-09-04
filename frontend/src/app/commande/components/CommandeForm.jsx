"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Trash2, Search, User, AlertTriangle, CheckCircle2, X, ChevronRight, ChevronLeft, Package, FileText } from "lucide-react";
import ArticleSelector from "./ArticleSelector";
import API from "@/lib/api";

export default function CommandeForm({ onClose, onOrderCreated }) {
  const [step, setStep] = useState(1);
  
  // Data State
  const [fournisseurs, setFournisseurs] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [searchFournisseur, setSearchFournisseur] = useState("");
  const [articles, setArticles] = useState([]);
  
  // UI State
  const [isFournisseurDropdownOpen, setIsFournisseurDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const fournisseurRef = useRef(null);

  useEffect(() => {
    async function fetchFournisseurs() {
      try {
        const res = await API.get("/fournisseurs");
        setFournisseurs(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchFournisseurs();
  }, []);

  // Click outside for fournisseur dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (fournisseurRef.current && !fournisseurRef.current.contains(event.target)) {
        setIsFournisseurDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFournisseurs = useMemo(() => {
    if (!searchFournisseur.trim()) return fournisseurs;
    const q = searchFournisseur.toLowerCase();
    return fournisseurs.filter(f => f.nom?.toLowerCase().includes(q));
  }, [fournisseurs, searchFournisseur]);

  const handleSelectFournisseur = (f) => {
    setSelectedFournisseur(f);
    setSearchFournisseur(f.nom);
    setIsFournisseurDropdownOpen(false);
    setError("");
  };

  const handleAddArticle = (item) => {
    setArticles(prev => {
      const existingIdx = prev.findIndex(a => a.articleId === item.articleId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + item.quantity };
        return updated;
      }
      return [...prev, item];
    });
    setError("");
  };

  const updateArticleQuantity = (index, newQty) => {
    const qty = Number(newQty);
    if (qty < 1) return;
    setArticles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  };

  const removeArticle = (index) => {
    setArticles(prev => prev.filter((_, i) => i !== index));
  };

  const totalHT = useMemo(() => {
    return articles.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [articles]);

  const handleNext = () => {
    if (step === 1 && !selectedFournisseur) {
      setError("Veuillez sélectionner un fournisseur.");
      return;
    }
    if (step === 2 && articles.length === 0) {
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
        fournisseur_id: String(selectedFournisseur.id),
        lignes: articles.map((a) => ({
          article_id: String(a.articleId),
          address: a.address,
          quantite: Number(a.quantity),
          prix: Number(a.price),
        })),
      };

      await API.post("/commandes", payload);
      
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Erreur lors de la création de la commande.");
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Nouvelle Commande</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-center">
            <div className="flex items-center w-full max-w-md mx-auto">
              <StepIndicator num={1} label="Fournisseur" active={step >= 1} completed={step > 1} />
              <div className={`flex-1 h-1 mx-2 rounded ${step > 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <StepIndicator num={2} label="Articles" active={step >= 2} completed={step > 2} />
              <div className={`flex-1 h-1 mx-2 rounded ${step > 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <StepIndicator num={3} label="Confirmation" active={step >= 3} completed={step > 3} />
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

            {step === 1 && (
              <div className="space-y-6 max-w-lg mx-auto py-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Sélection du fournisseur</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    À qui souhaitez-vous passer cette commande ?
                  </p>
                </div>

                <div className="relative" ref={fournisseurRef}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Fournisseur</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 transition-all shadow-sm"
                      placeholder="Rechercher..."
                      value={searchFournisseur}
                      onChange={(e) => {
                        setSearchFournisseur(e.target.value);
                        setIsFournisseurDropdownOpen(true);
                        if (selectedFournisseur && e.target.value !== selectedFournisseur.nom) {
                          setSelectedFournisseur(null);
                        }
                      }}
                      onFocus={() => setIsFournisseurDropdownOpen(true)}
                    />
                  </div>

                  {isFournisseurDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {filteredFournisseurs.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500 text-center">Aucun fournisseur trouvé</div>
                      ) : (
                        filteredFournisseurs.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => handleSelectFournisseur(f)}
                            className="p-4 border-b border-slate-50 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors text-slate-700 font-medium flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {f.nom.substring(0,2).toUpperCase()}
                            </div>
                            {f.nom}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Ajouter des articles</h3>
                  <ArticleSelector onAdd={handleAddArticle} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Contenu de la commande ({articles.length})</h3>
                  {articles.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Aucun article ajouté</p>
                      <p className="text-slate-400 text-sm mt-1">Utilisez la barre ci-dessus pour ajouter des articles.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Article</th>
                            <th className="py-3 px-4 font-semibold text-right">P.U.</th>
                            <th className="py-3 px-4 font-semibold text-center w-32">Quantité</th>
                            <th className="py-3 px-4 font-semibold text-right">Total</th>
                            <th className="py-3 px-4 text-center w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {articles.map((item, index) => (
                            <tr key={item.articleId} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-800">
                                {item.articleName}
                                <div className="text-xs text-slate-400 font-normal mt-0.5">Stock dispo: {item.maxStock}</div>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500">{item.price.toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateArticleQuantity(index, e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-center text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-800">
                                {(item.quantity * item.price).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => removeArticle(index)}
                                  className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan="3" className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-xs">Total:</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 text-base">{totalHT.toFixed(2)} DT</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Vérification finale</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Veuillez vérifier les informations avant de confirmer la commande.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fournisseur</h4>
                    <p className="font-semibold text-slate-800 text-lg">{selectedFournisseur?.nom}</p>
                    <p className="text-sm text-slate-500 mt-1">Contact: {selectedFournisseur?.contact || "N/A"}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Récapitulatif</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-slate-600 font-medium">{articles.length} articles</span>
                      <span className="text-2xl font-bold text-slate-900">{totalHT.toFixed(2)} DT</span>
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
                      {articles.map((item) => (
                        <tr key={item.articleId}>
                          <td className="py-2 px-4 font-medium text-slate-800">{item.articleName}</td>
                          <td className="py-2 px-4 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-2 px-4 text-right text-slate-600">{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
            ) : (
              <div /> // Placeholder for flex spacing
            )}

            {step < 3 ? (
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
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Confirmer la commande
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
    <div className="flex flex-col items-center gap-1 w-20">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
        completed ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
      }`}>
        {completed ? <CheckCircle2 className="w-5 h-5" /> : num}
      </div>
      <span className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}