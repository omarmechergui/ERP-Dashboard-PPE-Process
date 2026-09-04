import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API from '@/lib/api';

export function useDashboardData() {
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [projectProgress, setProjectProgress] = useState([]);
  const [projectProgressLoading, setProjectProgressLoading] = useState(true);
  const [projectProgressError, setProjectProgressError] = useState(null);

  const [stockStats, setStockStats] = useState([]);
  const [stockStatsLoading, setStockStatsLoading] = useState(true);
  const [stockStatsError, setStockStatsError] = useState(null);

  const [recentMovements, setRecentMovements] = useState([]);
  const [recentMovementsLoading, setRecentMovementsLoading] = useState(true);
  const [recentMovementsError, setRecentMovementsError] = useState(null);

  const [criticalStockItems, setCriticalStockItems] = useState([]);
  const [criticalStockItemsLoading, setCriticalStockItemsLoading] = useState(true);
  const [criticalStockItemsError, setCriticalStockItemsError] = useState(null);

  const [technicians, setTechnicians] = useState([]);
  const [techniciansLoading, setTechniciansLoading] = useState(true);
  const [techniciansError, setTechniciansError] = useState(null);

  const [syncTime, setSyncTime] = useState(null);

  const controllers = useRef({
    kpis: null,
    projectProgress: null,
    stockStats: null,
    recentMovements: null,
    criticalStockItems: null,
    technicians: null,
  });

  const abortRequest = (key) => {
    if (controllers.current[key]) {
      controllers.current[key].abort();
    }
    controllers.current[key] = new AbortController();
    return controllers.current[key].signal;
  };

  const fetchKpis = useCallback(async () => {
    const signal = abortRequest('kpis');
    setKpisLoading(true);
    setKpisError(null);
    try {
      const res = await API.get('/dashboard/kpis', { signal });
      setKpis(res.data);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setKpisError('Erreur chargement KPIs');
    } finally {
      setKpisLoading(false);
    }
  }, []);

  const fetchProjectProgress = useCallback(async () => {
    const signal = abortRequest('projectProgress');
    setProjectProgressLoading(true);
    setProjectProgressError(null);
    try {
      const res = await API.get('/dashboard/avancement-projets', { signal });
      setProjectProgress(res.data);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setProjectProgressError('Erreur projets');
    } finally {
      setProjectProgressLoading(false);
    }
  }, []);

  const fetchStockStats = useCallback(async () => {
    const signal = abortRequest('stockStats');
    setStockStatsLoading(true);
    setStockStatsError(null);
    try {
      const res = await API.get('/dashboard/mouvements-stock?days=7', { signal });
      setStockStats(res.data);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setStockStatsError('Erreur stats stock');
    } finally {
      setStockStatsLoading(false);
    }
  }, []);

  const fetchRecentMovements = useCallback(async () => {
    const signal = abortRequest('recentMovements');
    setRecentMovementsLoading(true);
    setRecentMovementsError(null);
    try {
      const res = await API.get('/stock/mouvements?limit=10', { signal });
      setRecentMovements(res.data.data || res.data);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setRecentMovementsError('Erreur mouvements');
    } finally {
      setRecentMovementsLoading(false);
    }
  }, []);

  const fetchCriticalStock = useCallback(async () => {
    const signal = abortRequest('criticalStockItems');
    setCriticalStockItemsLoading(true);
    setCriticalStockItemsError(null);
    try {
      const res = await API.get('/stock/articles?low_stock=true', { signal });
      setCriticalStockItems(res.data);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setCriticalStockItemsError('Erreur stock critique');
    } finally {
      setCriticalStockItemsLoading(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    const signal = abortRequest('technicians');
    setTechniciansLoading(true);
    setTechniciansError(null);
    try {
      const res = await API.get('/dashboard/techniciens', { signal });
      setTechnicians(res.data.techniciens || []);
    } catch (err) {
      if (!axios.isCancel(err) && err.name !== 'CanceledError') setTechniciansError('Erreur techniciens');
    } finally {
      setTechniciansLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    fetchKpis();
    fetchProjectProgress();
    fetchStockStats();
    fetchRecentMovements();
    fetchCriticalStock();
    fetchTechnicians();
    setSyncTime(new Date());
  }, [fetchKpis, fetchProjectProgress, fetchStockStats, fetchRecentMovements, fetchCriticalStock, fetchTechnicians]);

  useEffect(() => {
    refreshData();
    return () => {
      Object.values(controllers.current).forEach(ctrl => ctrl && ctrl.abort());
    };
  }, [refreshData]);

  return {
    kpis, kpisLoading, kpisError,
    projectProgress, projectProgressLoading, projectProgressError,
    stockStats, stockStatsLoading, stockStatsError,
    recentMovements, recentMovementsLoading, recentMovementsError,
    criticalStockItems, criticalStockItemsLoading, criticalStockItemsError,
    technicians, techniciansLoading, techniciansError,
    syncTime,
    refreshData
  };
}
