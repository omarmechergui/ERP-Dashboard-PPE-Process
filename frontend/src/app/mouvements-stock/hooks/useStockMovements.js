import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";

export const useStockMovements = (filters) => {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit
      });

      if (filters.searchTerm) params.append("search", filters.searchTerm);
      if (filters.typeFilter && filters.typeFilter !== "all") params.append("type", filters.typeFilter);

      if (filters.dateRange && filters.dateRange !== "all") {
        const now = new Date();
        const dateFrom = new Date();
        if (filters.dateRange === "today") dateFrom.setHours(0, 0, 0, 0);
        else if (filters.dateRange === "week") dateFrom.setDate(now.getDate() - 7);
        else if (filters.dateRange === "month") dateFrom.setDate(now.getDate() - 30);
        params.append("dateFrom", dateFrom.toISOString());
      }

      const res = await API.get(`/stock/mouvements?${params.toString()}`);
      setMovements(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.searchTerm, filters.typeFilter, filters.dateRange]);

  useEffect(() => {
    // debounce search term changes slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const addEntree = async (payload) => {
    await API.post("/stock/entrees", payload);
    await fetchData();
  };

  const addSortieBulk = async (payload) => {
    await API.post("/stock/sorties/bulk", payload);
    await fetchData();
  };

  return { movements, pagination, loading, error, fetchData, addEntree, addSortieBulk };
};
