import { useState, useEffect, useCallback, useMemo } from 'react';
import { interventionService } from '../services/interventionService';

export function useInterventions(initialFilters = {}) {
  const [data, setData] = useState({ interventions: [], timeline: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInterventions = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await interventionService.getAll(currentFilters);
      setData(response?.data || { interventions: [], timeline: [] });
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des interventions.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await interventionService.getAll(filters);
        if (!cancelled) setData(response?.data || { interventions: [], timeline: [] });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Erreur lors du chargement des interventions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
  }, [initialFilters]);

  const createIntervention = useCallback(async (interventionData) => {
    setLoading(true);
    try {
      await interventionService.create(interventionData);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.error || err.message || "Échec de la création de l'intervention" };
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateIntervention = useCallback(async (id, interventionData) => {
    try {
      await interventionService.update(id, interventionData);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.error || err.message || "Échec de la mise à jour" };
    }
  }, [filters]);

  const deleteIntervention = useCallback(async (id) => {
    try {
      await interventionService.delete(id);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [filters]);

  const changeStatus = useCallback(async (id, newStatus) => {
    try {
      await interventionService.changeStatus(id, newStatus);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [filters]);

  const startIntervention = useCallback(async (id) => {
    try {
      await interventionService.start(id);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [filters]);

  const completeIntervention = useCallback(async (id, dataObj) => {
    try {
      await interventionService.complete(id, dataObj);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [filters]);

  const cancelIntervention = useCallback(async (id, reason) => {
    try {
      await interventionService.cancel(id, reason);
      const response = await interventionService.getAll(filters);
      setData(response?.data || { interventions: [], timeline: [] });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, [filters]);

  const addParts = useCallback(async (id, articleId, quantite) => {
    try {
      await interventionService.addParts(id, articleId, quantite);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }, []);

  // Compute Statistics locally based on filtered interventions
  const filteredInterventions = useMemo(() => {
    let result = data.interventions || [];
    
    // Apply text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(int => 
        int.code?.toLowerCase().includes(q) || 
        int.machine?.nom?.toLowerCase().includes(q) ||
        int.defaut?.toLowerCase().includes(q) ||
        int.technicien?.nom?.toLowerCase().includes(q)
      );
    }

    // Apply strict filters (shift, status, priority, type)
    if (filters.shift && filters.shift !== 'Tous') {
      result = result.filter(int => int.shift === filters.shift);
    }
    if (filters.status && filters.status !== 'Tous') {
      result = result.filter(int => int.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'Tous') {
      result = result.filter(int => int.priority === filters.priority);
    }
    if (filters.type && filters.type !== 'Tous') {
      result = result.filter(int => int.type === filters.type);
    }
    
    return result;
  }, [data.interventions, searchQuery, filters]);

  const stats = useMemo(() => {
    const total = filteredInterventions.length;
    const inProgress = filteredInterventions.filter(i => i.status === 'In Progress' || i.status?.toLowerCase() === 'en cours').length;
    const completed = filteredInterventions.filter(i => i.status === 'Completed' || i.status?.toLowerCase() === 'terminé' || i.status?.toLowerCase() === 'clôturée').length;
    const critical = filteredInterventions.filter(i => i.priority === 'Critical' || i.priority?.toLowerCase() === 'critique').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      inProgress,
      completed,
      critical,
      completionRate,
      mttr: 'N/A',
      avgResponse: 'N/A',
      availability: 'N/A',
      preventiveRatio: 'N/A'
    };
  }, [filteredInterventions]);

  return {
    interventions: filteredInterventions,
    timeline: data.timeline || [],
    stats,
    loading,
    error,
    filters,
    searchQuery,
    setSearchQuery,
    updateFilters,
    resetFilters,
    refreshData: () => fetchInterventions(filters),
    createIntervention,
    updateIntervention,
    deleteIntervention,
    changeStatus,
    startIntervention,
    completeIntervention,
    cancelIntervention,
    addParts
  };
}
