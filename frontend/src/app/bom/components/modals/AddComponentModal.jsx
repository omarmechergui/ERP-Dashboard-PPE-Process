import React, { useState, useEffect, useCallback } from 'react';
import { X, PlusCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddComponentModal({ isOpen, onClose, initialData, searchArticles, onSubmit }) {
  const [articleId, setArticleId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen || initialData) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      const res = await searchArticles(search);
      setResults(res || []);
      if (res && res.length > 0 && !articleId) {
        setArticleId(res[0].id);
      }
      setLoadingSearch(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, isOpen, initialData, searchArticles, articleId]);

  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    if (initialData) {
      setArticleId(initialData.article_id);
      setQuantite(initialData.quantite);
      setResults([{ id: initialData.article_id, nom_article: "Chargement...", prix: 0 }]); // Placeholder for edit
    } else {
      setArticleId('');
      setQuantite(1);
    }
    setSearch('');
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                <PlusCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {initialData ? "Modifier le composant" : "Ajouter un composant"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSubmit({ article_id: articleId, quantite }); }} className="p-6 space-y-5">
            {!initialData && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                  Rechercher Article
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par code ou nom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {loadingSearch && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Article Sélectionné <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={articleId}
                onChange={(e) => setArticleId(e.target.value)}
                disabled={!!initialData} // Disallow changing article when editing line
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
              >
                {!initialData && <option value="" disabled>Sélectionner un article...</option>}
                {results.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.nom_article} ({a.prix ? a.prix.toFixed(2) : '0.00'} TND)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">
                Quantité Requise <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!articleId}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initialData ? "Mettre à jour" : "Lier Composant"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
