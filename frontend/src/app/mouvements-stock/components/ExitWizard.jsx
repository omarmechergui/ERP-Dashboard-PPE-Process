/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpLeft, AlertCircle, CheckCircle2, Plus, Trash2, Search } from "lucide-react";
import API from "../../../lib/api";

// ── Location resolution helpers (single source of truth) ──────────────
const getAvailableLocations = (article) => {
  const locations = article?.stockLocations ?? [];
  const uniqueLocs = new Map();
  locations.forEach(loc => {
    if (Number(loc.quantite ?? 0) > 0) {
      uniqueLocs.set(loc.location, loc);
    }
  });
  return Array.from(uniqueLocs.values());
};

function getAutoLocation(article) {
  const locations = getAvailableLocations(article);
  return locations.length > 0 ? locations[0].location : "";
};

export const ExitWizard = ({ isOpen, onClose, onSubmit, userMatricule, error }) => {
  const [step, setStep] = useState(1);
  const [articleSearch, setArticleSearch] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    matricule: userMatricule || "",
    items: [],
  });

  const [currentItem, setCurrentItem] = useState({
    article_id: "",
    quantite: 1,
    emplacement: "",
  });

  // Ref to guard against stale async responses (requirement D)
  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // --- Reset State on Open ---
  useEffect(() => {
    if (isOpen) {
      // Cancel any in-flight request from previous session
      abortControllerRef.current?.abort();
      fetchIdRef.current += 1;
      setStep(1);
      setArticleSearch("");
      setArticles([]);
      setFormData({
        matricule: userMatricule || "",
        items: [],
      });
      setCurrentItem({
        article_id: "",
        quantite: 1,
        emplacement: "",
      });
    }
  }, [isOpen, userMatricule]);

  // --- Debounced article search ---
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchArticles(articleSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, isOpen]);

  const fetchArticles = useCallback(async (query) => {
    // Cancel the previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Stamp this request so stale responses are ignored
    const requestId = ++fetchIdRef.current;

    try {
      setLoading(true);
      const res = await API.get(
        `/stock/articles?grouped=true&search=${encodeURIComponent(query)}&page=1&limit=20`,
        { signal: controller.signal }
      );

      // Ignore if a newer request has been issued
      if (requestId !== fetchIdRef.current) return;

      const rawArticles = res.data.data || res.data || [];
      
      const groupedMap = new Map();
      rawArticles.forEach(item => {
        if (!groupedMap.has(item.id)) {
          groupedMap.set(item.id, {
            ...item,
            quantite: item.total_global ?? item.quantite,
            stockLocations: item.stockLocations ? [...item.stockLocations] : []
          });
        }
        
        if (!item.stockLocations && item.address && item.address !== 'N/A') {
          const article = groupedMap.get(item.id);
          const existingLoc = article.stockLocations.find(l => l.location === item.address);
          if (!existingLoc) {
            article.stockLocations.push({
              location: item.address,
              quantite: item.quantite
            });
          }
        }
      });
      
      const fetchedArticles = Array.from(groupedMap.values());
      setArticles(fetchedArticles);

      // Auto-select first article or sync state if current article left the list
      setCurrentItem((prev) => {
        if (fetchedArticles.length === 0) {
          return { ...prev, article_id: "", emplacement: "", quantite: 1 };
        }

        const stillExists =
          prev.article_id &&
          fetchedArticles.some(
            (article) => String(article.id) === String(prev.article_id)
          );

        if (!stillExists) {
          const newArticle = fetchedArticles[0];
          return {
            ...prev,
            article_id: newArticle.id,
            emplacement: getAutoLocation(newArticle),
            quantite: 1,
          };
        }

        return prev;
      });
    } catch (err) {
      // Silently ignore aborted requests
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      console.error(err);
    } finally {
      if (requestId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // --- Derived state ---
  const selectedArticle = useMemo(
    () => articles.find((a) => String(a.id) === String(currentItem.article_id)),
    [articles, currentItem.article_id]
  );

  const availableLocations = useMemo(
    () => getAvailableLocations(selectedArticle),
    [selectedArticle]
  );

  // --- Validate current location against available locations ---
  // If the article/search data changed and the current emplacement is no longer valid, fix it.
  // Preserves valid manual selections — only replaces when the current choice is stale.
  useEffect(() => {
    if (!currentItem.article_id) return;

    if (availableLocations.length === 0) {
      if (currentItem.emplacement !== "") {
        setCurrentItem((prev) => ({ ...prev, emplacement: "" }));
      }
      return;
    }

    const currentLocationIsValid = availableLocations.some(
      (loc) => loc.location === currentItem.emplacement
    );

    if (!currentLocationIsValid) {
      setCurrentItem((prev) => ({
        ...prev,
        emplacement: availableLocations[0].location,
      }));
    }
  }, [availableLocations, currentItem.article_id, currentItem.emplacement]);

  const selectedLocation = useMemo(
    () => availableLocations.find((l) => l.location === currentItem.emplacement),
    [availableLocations, currentItem.emplacement]
  );

  const currentStock = selectedLocation ? Number(selectedLocation.quantite) : 0;

  const newStock = currentStock - currentItem.quantite;
  const noLocations = availableLocations.length === 0;
  const isInsufficientStock = currentItem.quantite > currentStock;
  const isLowStock = !noLocations && currentStock > 0 && !isInsufficientStock && newStock >= 0 && newStock <= (selectedArticle?.min_stock ?? 10);

  // (G) Explicit validation — all conditions that must pass to add
  const canAddItem =
    currentItem.article_id !== "" &&
    currentItem.emplacement !== "" &&
    !noLocations &&
    currentStock > 0 &&
    Number.isInteger(currentItem.quantite) &&
    currentItem.quantite >= 1 &&
    currentItem.quantite <= currentStock;

  // (H) Duplicate protection — same article+location can only appear once
  const isDuplicate = formData.items.some(
    (i) => i.article_id === currentItem.article_id && i.emplacement === currentItem.emplacement
  );

  if (!isOpen) return null;

  // --- Handlers ---
  function handleItemChange(e) {
    const { name, value, type } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: type === "number" ? Math.max(0, Math.floor(Number(value) || 0)) : value,
    }));
  };

  // (B) Article change — always resets location via getAutoLocation
  function handleArticleChange(e) {
    const newArticleId = e.target.value;
    const newArticle = articles.find(
      (article) => String(article.id) === String(newArticleId)
    );

    setCurrentItem((prev) => ({
      ...prev,
      article_id: newArticleId,
      emplacement: getAutoLocation(newArticle),
      quantite: 1,
    }));
  };

  function handleMatriculeChange(e) {
    setFormData((prev) => ({
      ...prev,
      matricule: e.target.value,
    }));
  };

  function handleAddItem() {
    if (!canAddItem || isDuplicate) return;

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          article_id: currentItem.article_id,
          nom_article: selectedArticle.nom_article,
          quantite: currentItem.quantite,
          emplacement: currentItem.emplacement,
          remaining: newStock
        }
      ]
    }));

    // Reset selection logic
    setArticleSearch("");
    setCurrentItem((prev) => ({
      ...prev,
      quantite: 1,
    }));
  };

  function handleRemoveItem(index) {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  function handleSubmit(e) {
    e.preventDefault();
    if (formData.items.length === 0) return;
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpLeft className="h-5 w-5 text-rose-500" />
              Issue Stock Wizard
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex px-6 pt-6 pb-2">
            <div className={`flex-1 border-b-2 pb-2 text-sm font-semibold ${step === 1 ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-400'}`}>
              Step 1: Planning & Destination
            </div>
            <div className={`flex-1 border-b-2 pb-2 text-sm font-semibold pl-4 ${step === 2 ? 'border-rose-500 text-rose-600' : 'border-slate-200 text-slate-400'}`}>
              Step 2: Material Selection
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-start gap-3">
                <X className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form id="exit-form" onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operator Matricule <span className="text-rose-500">*</span></label>
                    <input type="text" name="matricule" required value={formData.matricule} onChange={handleMatriculeChange} placeholder="Ex: MAT-045"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 opacity-50 cursor-not-allowed">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination (Coming Soon)</label>
                    <input type="text" disabled placeholder="Production Line A" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm" />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">

                  {/* Add Article Section */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Add New Material</h3>
                    
                    {/* Article Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Article</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by code or name..."
                          value={articleSearch}
                          onChange={(e) => setArticleSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Article Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article <span className="text-rose-500">*</span></label>
                      <select
                        name="article_id"
                        value={currentItem.article_id}
                        onChange={handleArticleChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        {articles.length > 0 ? (
                          articles.map((a, index) => (
                            <option key={`${a.id}-${index}`} value={a.id}>
                              {a.id} - {a.nom_article} (Total Available: {a.quantite})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No articles found</option>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Location Select */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location <span className="text-rose-500">*</span></label>
                        {noLocations ? (
                          <p className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 italic">
                            No stock location available
                          </p>
                        ) : (
                          <select
                            name="emplacement"
                            value={currentItem.emplacement}
                            onChange={handleItemChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          >
                            {availableLocations.map((loc) => (
                              <option key={loc.location} value={loc.location}>
                                {loc.location} — Available: {loc.quantite}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          name="quantite"
                          min="1"
                          max={currentStock > 0 ? currentStock : 1}
                          disabled={noLocations}
                          value={currentItem.quantite}
                          onChange={handleItemChange}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Add Warnings/Preview */}
                    {noLocations ? (
                      <div className="p-3 rounded-lg flex items-start gap-2 bg-amber-50 border-amber-200 border">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800">No Stock Available</p>
                          <p className="text-[11px] text-amber-600 mt-0.5">This article has no stocked locations.</p>
                        </div>
                      </div>
                    ) : isDuplicate ? (
                      <div className="p-3 rounded-lg flex items-start gap-2 bg-rose-50 border-rose-200 border">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-rose-800">Duplicate Selection</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">This article is already added for this location.</p>
                        </div>
                      </div>
                    ) : isInsufficientStock ? (
                      <div className="p-3 rounded-lg flex items-start gap-2 bg-rose-50 border-rose-200 border">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-rose-800">Insufficient Stock</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            Requesting {currentItem.quantite} but only {currentStock} available.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg flex items-start gap-2 border ${isLowStock ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isLowStock ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <div>
                          <p className={`text-xs font-semibold ${isLowStock ? 'text-amber-800' : 'text-slate-800'}`}>Stock Preview</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Current: <span className="font-bold">{currentStock}</span>
                            {" → "}Remaining: <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>{newStock}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button 
                        type="button" 
                        onClick={handleAddItem}
                        disabled={!canAddItem || isDuplicate}
                        className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add Article
                      </button>
                    </div>
                  </div>

                  {/* Selected Materials List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      Selected Materials
                      <span className="bg-rose-100 text-rose-700 py-0.5 px-2 rounded-full text-xs font-bold">
                        {formData.items.length}
                      </span>
                    </h3>
                    
                    {formData.items.length === 0 ? (
                      <div className="p-8 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <p className="text-sm font-medium">No materials added yet.</p>
                        <p className="text-xs mt-1">Select an article and click Add Article.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Article</th>
                              <th className="px-4 py-3 font-semibold">Location</th>
                              <th className="px-4 py-3 font-semibold text-right">Qty</th>
                              <th className="px-4 py-3 font-semibold text-right">Rem.</th>
                              <th className="px-4 py-3 font-semibold text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {formData.items.map((item, index) => (
                              <motion.tr 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`${item.article_id}-${item.emplacement}`} 
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-800">{item.article_id}</p>
                                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{item.nom_article}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{item.emplacement}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-rose-600">{item.quantite}</td>
                                <td className="px-4 py-3 text-right font-semibold text-emerald-600">{item.remaining}</td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </motion.div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between">
            {step === 1 ? (
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            ) : (
              <button type="button" onClick={handleBack} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Back</button>
            )}

            {step === 1 ? (
              <button type="button" onClick={handleNext} disabled={!formData.matricule} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">Next Step</button>
            ) : (
              <button type="submit" form="exit-form" disabled={formData.items.length === 0} className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-500/20 transition-all flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Issue Materials
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
