"use client";
import React, { useState, useEffect } from 'react';
import API from '../../../lib/api';

export default function StockSelector({ onAdd }) {
  const [articles, setArticles] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await API.get('/stock/articles');
        if (!cancelled) setArticles(res.data.filter(a => a.quantite > 0));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Erreur lors du chargement du stock.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  const filteredArticles = articles.filter(article => 
    article.nom_article.toLowerCase().includes(searchTerm.toLowerCase()) || 
    article.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  const handleAdd = () => {
    if (!selectedArticle) return;

    const availableStock = selectedArticle.quantite - (selectedArticle.quantite_reservee || 0);

    if (quantity > availableStock) {
      setError(`Quantité maximale disponible : ${availableStock}`);
      return;
    }

    if (quantity <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    setError(null);
    onAdd({
      article_id: selectedArticle.id,
      nom_article: selectedArticle.nom_article,
      prix: selectedArticle.prix,
      quantite: Number(quantity),
    });

    // Reset selection
    setSelectedArticleId("");
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
        <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-blue-500"></div>
        <span>Chargement du stock...</span>
      </div>
    );
  }

  return (
    <div className="bg-white/40 p-4 border border-slate-200 rounded-xl shadow-inner mb-4 space-y-3">
      <h4 className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Ajouter un Article</h4>
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-2.5 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">Filtrer</label>
          <input 
            type="text" 
            placeholder="Rechercher par nom ou ID..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Article</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              value={selectedArticleId}
              onChange={(e) => {
                setSelectedArticleId(e.target.value);
                setError(null);
              }}
            >
              <option value="">-- Sélectionner un article --</option>
              {filteredArticles.map((article, index) => {
                const available = article.quantite - (article.quantite_reservee || 0);
                return (
                  <option key={`${article.id}-${index}`} value={article.id} className="bg-white text-slate-900">
                    {article.nom_article} (Dispo: {available} | {article.prix.toFixed(2)} DT)
                  </option>
                );
              })}
            </select>
          </div>

        <div className="w-full md:w-32 space-y-1">
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quantité</label>
          <input
            type="number"
            min="1"
            max={selectedArticle ? (selectedArticle.quantite - (selectedArticle.quantite_reservee || 0)) : ""}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={!selectedArticle}
          />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedArticle}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0 text-sm"
        >
          Ajouter
        </button>
      </div>
    </div>
  </div>
  );
}

