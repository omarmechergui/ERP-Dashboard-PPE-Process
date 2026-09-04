/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from 'react';
import API from '../../../lib/api';
import { useAuth } from '../../../lib/auth';

export function usePanneaux() {
  const { user } = useAuth();
  
  const [panneaux, setPanneaux] = useState([]);
  const [boms, setBoms] = useState([]);
  const [entrepots, setEntrepots] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [panRes, bomRes, entRes, userRes] = await Promise.all([
        API.get('/panneaux'),
        API.get('/bom'),
        API.get('/entrepots'),
        API.get('/users').catch(() => ({ data: [] }))
      ]);

      setPanneaux(panRes.data || []);
      setBoms(bomRes.data || []);
      setEntrepots(entRes.data || []);

      let sups = [];
      if (userRes.data && userRes.data.length > 0) {
        sups = userRes.data.filter(u => ['SUPERVISEUR', 'ADMIN'].includes(u.role));
      }
      
      // Fallback if users endpoint fails (non-admin)
      if (sups.length === 0) {
        sups = [
          { id: user?.id || 'curr', nom: user?.nom || 'Moi', role: user?.role || 'SUPERVISEUR', matricule: user?.matricule }
        ];
      }
      
      setSupervisors(sups);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updatePanneauStatus = async (id, statusData) => {
    try {
      const res = await API.patch(`/panneaux/${id}/etat`, statusData);
      // The API now returns { message, panneau, history }
      const updatedPanneau = res.data.panneau || res.data;
      setPanneaux(prev => prev.map(p => p.id === id ? { ...p, ...updatedPanneau } : p));
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const createPanneau = async (data) => {
    try {
      const res = await API.post('/panneaux', data);
      setPanneaux(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const updatePanneau = async (id, data) => {
    try {
      const res = await API.put(`/panneaux/${id}`, data);
      setPanneaux(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const deletePanneau = async (id) => {
    try {
      await API.delete(`/panneaux/${id}`);
      setPanneaux(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const getPanneauDetails = async (id) => {
    try {
      const res = await API.get(`/panneaux/${id}`);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return {
    panneaux,
    setPanneaux,
    boms,
    entrepots,
    supervisors,
    loading,
    error,
    fetchAll,
    updatePanneauStatus,
    createPanneau,
    updatePanneau,
    deletePanneau,
    getPanneauDetails
  };
}
