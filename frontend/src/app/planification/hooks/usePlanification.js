import { useState, useCallback } from 'react';
import API from '../../../lib/api';

export function usePlanification() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [planifications, setPlanifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const [dashRes, planRes] = await Promise.all([
        API.get('/planifications/dashboard'),
        API.get('/planifications')
      ]);
      setDashboardStats(dashRes.data);
      setPlanifications(planRes.data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données de planification.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const createPlanification = async (data) => {
    try {
      await API.post('/planifications', data);
      await loadDashboard(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.error || 'Erreur de création' };
    }
  };

  const updatePlanification = async (id, data) => {
    try {
      await API.put(`/planifications/${id}`, data);
      await loadDashboard(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.error || 'Erreur de modification' };
    }
  };

  const updateStatus = async (id, status, notes) => {
    try {
      await API.patch(`/planifications/${id}/status`, { status, notes });
      await loadDashboard(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.error || 'Erreur de mise à jour du statut' };
    }
  };

  const deletePlanification = async (id) => {
    try {
      await API.delete(`/planifications/${id}`);
      await loadDashboard(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.error || 'Erreur de suppression' };
    }
  };

  const getHistory = async (id) => {
    try {
      const res = await API.get(`/planifications/${id}/history`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: 'Erreur lors du chargement de l\'historique' };
    }
  };

  return {
    dashboardStats,
    planifications,
    loading,
    error,
    loadDashboard,
    createPlanification,
    updatePlanification,
    updateStatus,
    deletePlanification,
    getHistory,
  };
}
