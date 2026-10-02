/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownRight, CheckCircle2, Search, AlertCircle, Loader2 } from "lucide-react";
import API from "@/lib/api";

export const EntryWizard = ({ isOpen, onClose, onSubmit, error }) => {
  const [step, setStep] = useState(1);
  const [articles, setArticles] = useState([]);
  const [planifications, setPlanifications] = useState([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);

  const [formData, setFormData] = useState({
    po_reference: "",
    planification_id: "",
    article_id: "",
    emplacement: "",
    quantite: 1,
    etat: true,
  });

  // Ref to guard against stale async responses (matches ExitWizard pattern)
  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // --- Reset State on Open ---
  useEffect(() => {
    if (isOpen) {
      // Cancel any in-flight request from previous session
      abortControllerRef.current?.abort();
      fetchIdRef.current += 1;
      setStep(1);
      setFormData({
        po_reference: "",
        planification_id: "",
        article_id: "",
        emplacement: "",
        quantite: 1,
        etat: true,
      });
      setArticleSearch("");
      setArticles([]);
      setPlanError(null);

      // Fetch planifications on open
      setPlanLoading(true);
      API.get("/planifications")
        .then((res) => {
          // API returns { data: [...], meta: {...} } — extract the array
          const raw = res.data?.data || res.data || [];
          setPlanifications(Array.isArray(raw) ? raw : []);
        })
        .catch((err) => {
          // Silently ignore aborted requests
          if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
          console.error(err);
          setPlanError("Impossible de charger les planifications.");
          setPlanifications([]);
        })
        .finally(() => setPlanLoading(false));

      // Fetch initial articles
      fetchArticles("");
    }
  }, [isOpen]);

  // --- Debounced article search (matches ExitWizard pattern) ---
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
      // Use grouped=true to fetch stockLocations exactly like ExitWizard
      const res = await API.get(
        `/stock/articles?grouped=true&search=${encodeURIComponent(query)}&page=1&limit=20`,
        { signal: controller.signal }
      );

      // Ignore if a newer request has been issued
      if (requestId !== fetchIdRef.current) return;

      const rawArticles = res.data?.data || res.data || [];
      
      const groupedMap = new Map();
      rawArticles.forEach(item => {
        if (!groupedMap.has(item.id)) {
          groupedMap.set(item.id, {
            ...item,
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

      // Auto-select first article if none selected
      setFormData((prev) => {
        if (fetchedArticles.length > 0 && !prev.article_id && !query) {
          return { ...prev, article_id: fetchedArticles[0].id };
        }
        // If current selection no longer exists in results, reset
        if (prev.article_id && !fetchedArticles.some((a) => a.id === prev.article_id)) {
          return {
            ...prev,
            article_id: fetchedArticles.length > 0 ? fetchedArticles[0].id : "",
            emplacement: "", // Also reset location since article is gone
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

  // --- Derived state for Locations ---
  const selectedArticle = articles.find((a) => String(a.id) === String(formData.article_id));
  
  const availableLocations = useMemo(() => {
    if (!selectedArticle) return [];
    const locs = selectedArticle.stockLocations || [];
    const unique = new Map();
    locs.forEach(l => {
      if (l.location) {
        unique.set(l.location, l);
      }
    });
    return Array.from(unique.values());
  }, [selectedArticle]);

  if (!isOpen) return null;

  // --- Handlers ---
  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const nextState = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Requirement 4: When Article changes -> Clear previous location
      if (name === "article_id" && prev.article_id !== value) {
        nextState.emplacement = "";
      }

      return nextState;
    });
  }

  // --- Step 1 validation ---
  const canProceed = formData.po_reference.trim() !== "";

  const handleNext = () => {
    if (canProceed) setStep(2);
  };
  const handleBack = () => setStep(1);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-emerald-500" />
              Receive Stock Wizard
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex px-6 pt-6 pb-2">
            <div
              className={`flex-1 border-b-2 pb-2 text-sm font-semibold ${
                step === 1
                  ? "border-emerald-500 text-emerald-600"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              Step 1: Document Details
            </div>
            <div
              className={`flex-1 border-b-2 pb-2 text-sm font-semibold pl-4 ${
                step === 2
                  ? "border-emerald-500 text-emerald-600"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              Step 2: Material Details
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-start gap-3">
                <X className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form id="entry-form" onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Purchase Order Ref{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="po_reference"
                      required
                      value={formData.po_reference}
                      onChange={handleInputChange}
                      placeholder="Ex: PO-2026-350"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Planning / Project (Optional)
                    </label>
                    {planLoading ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading planifications...
                      </div>
                    ) : planError ? (
                      <div className="p-3 rounded-xl flex items-start gap-2 bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700">{planError}</p>
                      </div>
                    ) : (
                      <select
                        name="planification_id"
                        value={formData.planification_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="">None</option>
                        {planifications.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.reference ? `${p.reference} — ` : ""}
                            {p.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Article <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search article by ID or name..."
                        value={articleSearch}
                        onChange={(e) => setArticleSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    {loading ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching articles...
                      </div>
                    ) : articles.length > 0 ? (
                      <select
                        name="article_id"
                        required
                        value={formData.article_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        {articles.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.id} - {a.nom_article}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-xl flex items-start gap-2 bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          No articles found. Try a different search.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Location <span className="text-rose-500">*</span>
                      </label>
                      
                      {!formData.article_id ? (
                        <input
                          type="text"
                          disabled
                          placeholder="Select an article first"
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm opacity-60 cursor-not-allowed"
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            name="emplacement"
                            required
                            list="locations-list"
                            value={formData.emplacement}
                            onChange={handleInputChange}
                            placeholder="Select or type new location..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                          <datalist id="locations-list">
                            {availableLocations.map((loc) => (
                              <option key={loc.location} value={loc.location} />
                            ))}
                          </datalist>
                          {availableLocations.length === 0 && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              No existing locations found. Enter a new one.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantite"
                        min="1"
                        required
                        value={formData.quantite}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3 mt-4">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        name="etat"
                        checked={formData.etat}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        Physical Material Received &amp; Verified
                      </p>
                      <p className="text-xs text-emerald-600/80 mt-0.5">
                        Checking this will increment the stock levels
                        immediately.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between">
            {step === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Back
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                form="entry-form"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Receive Material
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
