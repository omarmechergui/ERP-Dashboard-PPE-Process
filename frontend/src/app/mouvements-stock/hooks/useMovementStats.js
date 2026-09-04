/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";

export const useMovementStats = () => {
  const [stats, setStats] = useState({
    totalMovements: 0,
    entriesToday: 0,
    exitsToday: 0,
    quantityIn: 0,
    quantityOut: 0,
    activeOperators: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/stock/mouvements/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch movement stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
};
