"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Search, Package, MapPin } from "lucide-react";
import API from "@/lib/api";

export default function ArticleSelector({ onAdd }) {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [quantity, setQuantity] = useState("");
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await API.get("/stock/articles");
        setArticles(res.data || []);
      } catch (error) {
        console.error("Erreur chargement articles:", error);
      }
    }
    fetchArticles();
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.nom_article?.toLowerCase().includes(query) ||
        a.address?.toLowerCase().includes(query) ||
        String(a.id).toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setSearchQuery(article.nom_article || "");
    setIsDropdownOpen(false);
  };

  const handleAdd = () => {
    if (!selectedArticle) {
      alert("Veuillez sélectionner un article.");
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      alert("Veuillez saisir une quantité valide (> 0).");
      return;
    }

    const item = {
      articleId: selectedArticle.id,
      articleName: selectedArticle.nom_article,
      quantity: qty,
      price: selectedArticle.prix || 0,
      address: selectedArticle.address,
      maxStock: selectedArticle.quantite
    };

    onAdd(item);
    
    // Reset
    setSelectedArticle(null);
    setSearchQuery("");
    setQuantity("");
  };

  const getStockColor = (qty) => {
    if (qty <= 0) return "text-rose-600 bg-rose-100 border-rose-200";
    if (qty <= 10) return "text-amber-600 bg-amber-100 border-amber-200";
    return "text-emerald-600 bg-emerald-100 border-emerald-200";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-end w-full">
      
      {/* Article Search Dropdown */}
      <div className="flex-1 w-full relative" ref={dropdownRef}>
        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">
          Rechercher un article
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow"
            placeholder="Nom, adresse, ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              if (selectedArticle && e.target.value !== selectedArticle.nom_article) {
                setSelectedArticle(null);
              }
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
        </div>

        {isDropdownOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {filteredArticles.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">Aucun article trouvé</div>
            ) : (
              filteredArticles.map((article, index) => (
                <div
                  key={`${article.id}-${index}`}
                  onClick={() => handleSelectArticle(article)}
                  className="p-3 border-b border-slate-50 last:border-0 cursor-pointer flex justify-between items-center transition-colors hover:bg-blue-50"
                >
                  <div>
                    <div className="font-medium text-slate-800 text-sm">{article.nom_article}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {article.address || "N/A"}
                      <span className="mx-1">•</span>
                      ID: {article.id}
                      <span className="mx-1">•</span>
                      Prix: {article.prix?.toFixed(2) || "0.00"} DT
                    </div>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStockColor(article.quantite)}`}>
                    Stock: {article.quantite}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quantity Input */}
      <div className="w-full sm:w-28">
        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 block">
          Quantité
        </label>
        <input
          type="number"
          min="1"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50"
          placeholder="Ex: 10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={!selectedArticle}
        />
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedArticle || !quantity || Number(quantity) <= 0}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[38px] shrink-0"
      >
        Ajouter
      </button>

    </div>
  );
}