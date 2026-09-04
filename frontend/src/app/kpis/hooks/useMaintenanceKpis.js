import { useState, useEffect, useCallback } from 'react';
import API from '../../../lib/api';

export function useMaintenanceKpis(initialPeriod = 'month') {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncTime, setSyncTime] = useState(null);

  const loadData = useCallback(async (isIgnore) => {
    try {
      if (!isIgnore()) {
        setLoading(true);
        setError(null);
      }

      const response = await API.get(`/maintenance/kpis?period=${period}`);
      const rawData = response.data?.data || {};

      const parseValue = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
      };

      const availabilityVal = parseValue(rawData.disponibilite) || 0;
      const oeeVal = availabilityVal ? (availabilityVal * 0.95 * 0.98).toFixed(1) : 0; 

      const augmentedData = {
        ...rawData,
        kpis: {
          mttr: rawData.mttr || 'N/A',
          mtbf: rawData.mtbf || 'N/A',
          availability: 'N/A',
          oee: 'N/A',
          preventiveRatio: rawData.preventiveRatio ? `${rawData.preventiveRatio}%` : 'N/A', 
          criticalFailures: rawData.openInterventions || 0, 
          machineAvailability: 'N/A', 
          maintenanceCost: 'N/A' 
        },
        trends: {
          mttr: 0, 
          mtbf: 0, 
          availability: 0, 
          oee: 0,
          preventiveRatio: 0,
          criticalFailures: 0,
          machineAvailability: 0,
          maintenanceCost: 0,
          ...rawData.trends
        },
        mttrData: rawData.mttrData || {
          labels: [],
          datasets: []
        },
        abcData: rawData.abcData || {
          labels: [],
          datasets: []
        },
        heatmapData: {
          days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          hours: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
          data: []
        },
        planning: []
      };

      if (!isIgnore()) {
        setData(augmentedData);
        setSyncTime(new Date());
      }
    } catch (err) {
      if (!isIgnore()) {
        console.error(err);
        setError('Erreur lors du chargement des indicateurs.');
      }
    } finally {
      if (!isIgnore()) {
        setLoading(false);
      }
    }
  }, [period]);

  const fetchData = useCallback(async () => {
    await loadData(() => false);
  }, [loadData]);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(() => ignore);
    return () => { ignore = true; };
  }, [loadData]);

  const changePeriod = useCallback((newPeriod) => {
    setPeriod(newPeriod);
  }, []);

  return {
    data,
    loading,
    error,
    syncTime,
    period,
    changePeriod,
    refreshData: fetchData
  };
}
