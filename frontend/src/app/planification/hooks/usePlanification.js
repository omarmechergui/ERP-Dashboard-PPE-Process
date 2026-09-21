import { useState, useCallback } from 'react';
import API from '../../../lib/api';

export function usePlanification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Read
  const loadPlanifications = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      const res = await API.get(`/planifications?${params.toString()}`);
      // Assuming the backend returns { data, meta }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur de chargement des planifications");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlanificationById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/planifications/${id}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur de chargement de la planification");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardStats = useCallback(async () => {
    try {
      const res = await API.get('/planifications/dashboard');
      return res.data;
    } catch (err) {
      console.error('Erreur chargement stats dashboard', err);
      return null;
    }
  }, []);

  const getHistory = useCallback(async (id) => {
    try {
      const res = await API.get(`/planifications/${id}/history`);
      return res.data;
    } catch (err) {
      console.error('Erreur chargement historique', err);
      return [];
    }
  }, []);

  // Write
  const createPlanification = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/planifications', data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur de création");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlanification = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/planifications/${id}`, data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur de mise à jour");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Transitions
  const planifier = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post(`/planifications/${id}/planifier`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de la planification");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startProduction = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post(`/planifications/${id}/start`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors du lancement de la production");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelPlanification = useCallback(async (id, reason) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post(`/planifications/${id}/cancel`, { reason });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'annulation");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completePlanification = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post(`/planifications/${id}/complete`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de la clôture de la production");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (id, progress) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch(`/planifications/${id}/progress`, { progress });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur lors de la mise à jour du progrès");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlanification = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await API.delete(`/planifications/${id}`);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Erreur de suppression");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Options fetching
  const loadBoms = useCallback(async () => {
    try {
      const res = await API.get('/bom');
      return res.data;
    } catch (err) {
      console.error('Erreur chargement BOMs', err);
      return [];
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await API.get('/users/team');
      const allUsers = res.data || [];
      return {
        gls: allUsers.filter(u => u.role === 'GL'),
        superviseurs: allUsers.filter(u => u.role === 'SUPERVISEUR')
      };
    } catch (err) {
      console.error('Erreur chargement utilisateurs', err);
      return { gls: [], superviseurs: [] };
    }
  }, []);

  const searchPanneaux = useCallback(async (query, signal) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      // Depending on the backend logic we can filter by status 'READY' 
      // though the `/panneaux` backend endpoint might not support `search` yet.
      // We will handle search properly.
      const res = await API.get(`/panneaux?${params.toString()}`, { signal });
      
      // Filter out panneaux that already have a planification linked if needed, or backend should do it
      // Let's return all and let the component handle filtering.
      return res.data;
    } catch (err) {
      if (err.name === 'CanceledError') return []; // Ignore abort errors
      console.error('Erreur recherche panneaux', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    loadPlanifications,
    getPlanificationById,
    loadDashboardStats,
    getHistory,
    createPlanification,
    updatePlanification,
    planifier,
    startProduction,
    completePlanification,
    updateProgress,
    cancelPlanification,
    deletePlanification,
    loadBoms,
    loadUsers,
    searchPanneaux
  };
}
