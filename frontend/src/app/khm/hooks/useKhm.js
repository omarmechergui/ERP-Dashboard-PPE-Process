/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../../lib/api';

export function useKhm() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadKhm = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const res = await API.get('/khm?all=true');
      setControls(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les contrôles KHM.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Backfill: create KhmControl entries for panels already in KHM stage (existing data)
  const syncKhm = useCallback(async () => {
    try {
      await API.post('/khm/sync');
      await loadKhm(false);
    } catch (err) {
      // Non-critical: sync only available to ADMIN, silently ignore for other roles
      console.warn('KHM sync skipped (may require ADMIN role):', err?.response?.data?.error || err.message);
    }
  }, [loadKhm]);

  useEffect(() => {
    loadKhm(true);
  }, [loadKhm]);

  const validateControl = useCallback(async (id) => {
    try {
      setError('');
      await API.patch(`/khm/${id}/valider`, {
        commentaire: 'Contrôle visuel et électrique OK, conforme.'
      });
      loadKhm(false);
      return { success: true };
    } catch (err) {
      const msg = err?.error || err?.response?.data?.error || err?.message || 'Erreur lors de la validation du contrôle.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [loadKhm]);

  const rejectControl = useCallback(async (id, comment, severity) => {
    try {
      setError('');
      // Even if severity is provided from UI, we preserve API compatibility
      // by just appending it to the comment or sending it if backend allows.
      const enrichedComment = `[Sévérité: ${severity}] ${comment}`;
      await API.patch(`/khm/${id}/rejeter`, {
        commentaire: enrichedComment
      });
      loadKhm(false);
      return { success: true };
    } catch (err) {
      const msg = err?.error || err?.response?.data?.error || err?.message || 'Erreur lors du rejet du contrôle.';
      return { success: false, error: msg };
    }
  }, [loadKhm]);

  const stats = useMemo(() => {
    const total = controls.length;
    const pending = controls.filter(c => c.etat === 'EN_ATTENTE').length;
    const conforme = controls.filter(c => c.etat === 'CONFORME').length;
    const nonConforme = controls.filter(c => c.etat === 'NON_CONFORME').length;
    
    // Quality rate = Conforme / (Conforme + Non Conforme) * 100
    const processed = conforme + nonConforme;
    const qualityRate = processed > 0 ? ((conforme / processed) * 100).toFixed(1) : 0;

    return { total, pending, conforme, nonConforme, qualityRate };
  }, [controls]);

  return {
    controls,
    loading,
    error,
    stats,
    loadKhm,
    syncKhm,
    validateControl,
    rejectControl,
    setError
  };
}
