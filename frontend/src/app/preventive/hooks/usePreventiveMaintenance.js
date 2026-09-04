/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from 'react';
import { preventiveService } from '../services/preventiveService';

export function usePreventiveMaintenance(initialFilters = {}) {
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'Tous',
    frequency: 'Tous',
    machineId: 'Tous',
    technicienId: 'Tous',
    ...initialFilters
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataRes, kpisRes] = await Promise.all([
        preventiveService.getAll(filters),
        preventiveService.getKpis()
      ]);
      setData(dataRes.data || []);
      setKpis(kpisRes.data || null);
    } catch (err) {
      console.error('Erreur chargement preventive:', err);
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'Tous',
      frequency: 'Tous',
      machineId: 'Tous',
      technicienId: 'Tous',
    });
    setSearchQuery('');
  };

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const code = item.code?.toLowerCase() || '';
    const machine = item.machine?.nom?.toLowerCase() || '';
    const tech = item.technicien?.nom?.toLowerCase() || '';
    
    return code.includes(query) || machine.includes(query) || tech.includes(query);
  });

  return {
    data: filteredData,
    kpis,
    loading,
    error,
    filters,
    searchQuery,
    setSearchQuery,
    onFilterChange: handleFilterChange,
    onResetFilters: handleResetFilters,
    refreshData: loadData
  };
}
