/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowDownRight, Package, CheckCircle2, Search } from "lucide-react";
import API from "@/lib/api";

export const EntryWizard = ({ isOpen, onClose, onSubmit, error }) => {
  const [step, setStep] = useState(1);
  const [articles, setArticles] = useState([]);
  const [planifications, setPlanifications] = useState([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    po_reference: "",
    planification_id: "",
    article_id: "",
    emplacement: "",
    quantite: 1,
    etat: true,
  });

  useEffect(() => {
    if (isOpen) {
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
      
      // Fetch planifications on open
      API.get("/planifications").then(res => {
        setPlanifications(res.data || []);
      }).catch(err => console.error(err));
      
      // Fetch initial articles
      fetchArticles("");
    }
  }, [isOpen]);

  // Debounced search for articles
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchArticles(articleSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [articleSearch, isOpen]);

  async function fetchArticles(query) {
    try {
      setLoading(true);
      const res = await API.get(`/stock/articles/search?q=${query}&limit=50`);
      setArticles(res.data || []);
      if (res.data && res.data.length > 0 && !formData.article_id && !query) {
        setFormData(prev => ({ ...prev, article_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);
  
  function handleSubmit(e) {
    e.preventDefault();
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
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-emerald-500" />
              Receive Stock Wizard
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex px-6 pt-6 pb-2">
            <div className={`flex-1 border-b-2 pb-2 text-sm font-semibold ${step === 1 ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
              Step 1: Document Details
            </div>
            <div className={`flex-1 border-b-2 pb-2 text-sm font-semibold pl-4 ${step === 2 ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
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
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Order Ref <span className="text-rose-500">*</span></label>
                    <input type="text" name="po_reference" required value={formData.po_reference} onChange={handleInputChange} placeholder="Ex: PO-2026-350"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning / Project (Optional)</label>
                    <select name="planification_id" value={formData.planification_id} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      <option value="">None</option>
                      {planifications.map((p) => (
                         <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Article <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search article by ID or name..."
                          value={articleSearch}
                          onChange={(e) => setArticleSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <select name="article_id" required value={formData.article_id} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      {articles.map((a) => (
                        <option key={a.id} value={a.id}>{a.id} - {a.nom_article}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location <span className="text-rose-500">*</span></label>
                      <input type="text" name="emplacement" required value={formData.emplacement} onChange={handleInputChange} placeholder="Ex: A-12"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity <span className="text-rose-500">*</span></label>
                      <input type="number" name="quantite" min="1" required value={formData.quantite} onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3 mt-4">
                    <div className="pt-0.5">
                      <input type="checkbox" name="etat" checked={formData.etat} onChange={handleInputChange} className="h-4 w-4 text-emerald-600 rounded border-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Physical Material Received & Verified</p>
                      <p className="text-xs text-emerald-600/80 mt-0.5">Checking this will increment the stock levels immediately.</p>
                    </div>
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
              <button type="button" onClick={handleNext} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition-all">Next Step</button>
            ) : (
              <button type="submit" form="entry-form" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Receive Material
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
