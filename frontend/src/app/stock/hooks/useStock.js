/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";

export const useStock = (filters = {}) => {
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchArticles = useCallback(async (abortController) => {
    try {
      if (articles.length === 0) setLoading(true);
      setError("");
      
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 50,
      };

      if (filters.debouncedSearchTerm) {
        params.search = filters.debouncedSearchTerm;
      }
      if (filters.selectedSupplier) {
        params.fournisseur_id = filters.selectedSupplier;
      }
      if (filters.availabilityFilter && filters.availabilityFilter !== 'all') {
        params.availability = filters.availabilityFilter;
      }

      const res = await API.get("/stock/articles", { 
        params,
        signal: abortController?.signal 
      });
      
      if (res.data && res.data.pagination) {
        setArticles(res.data.data);
        setPagination(res.data.pagination);
        setStats(res.data.stats);
      } else {
        setArticles(res.data);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Request aborted, ignore
        return;
      }
      console.error(err);
      setError("Impossible de charger les stocks.");
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.debouncedSearchTerm, filters.selectedSupplier, filters.availabilityFilter]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchArticles(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchArticles]);

  const addArticle = async (data, supplierName) => {
    const res = await API.post("/stock/articles", data);
    await fetchArticles();
    return res.data;
  };

  const updateArticle = async (id, data, supplierName) => {
    const res = await API.put(`/stock/articles/${id}`, data);
    await fetchArticles();
    return res.data;
  };

  const deleteArticle = async (id) => {
    await API.delete(`/stock/articles/${id}`);
    await fetchArticles();
  };

  return {
    articles,
    pagination,
    stats,
    loading,
    error,
    fetchArticles,
    addArticle,
    updateArticle,
    deleteArticle,
  };
};
