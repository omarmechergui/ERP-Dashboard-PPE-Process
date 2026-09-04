import { useState, useCallback, useEffect } from 'react';
import { organigrammeService } from '../services/organigrammeService';

export function useOrganigrammeWorkflow(user) {
  const [organigrammes, setOrganigrammes] = useState([]);
  const [activeOrganigramme, setActiveOrganigramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    brouillon: 0,
    en_validation: 0,
    valide: 0,
    rejete: 0,
    archive: 0
  });

  const fetchOrganigrammes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organigrammeService.getOrganigrammes();
      setOrganigrammes(data);
      
      const active = data.find(org => org.statut === 'VALIDE');
      setActiveOrganigramme(active || null);

      const newStats = { brouillon: 0, en_validation: 0, valide: 0, rejete: 0, archive: 0 };
      data.forEach(org => {
        const s = org.statut.toLowerCase();
        if (newStats[s] !== undefined) newStats[s]++;
      });
      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch organigrammes', err);
      setError('Erreur lors du chargement des organigrammes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrganigrammes();
  }, [fetchOrganigrammes]);

  const canSubmit = (org) => {
    if (!user || org.statut !== 'BROUILLON') return false;
    return ['ADMIN', 'GL', 'SUPERVISEUR'].includes(user.role);
  };

  const canValidate = (org) => {
    if (!user || org.statut !== 'EN_VALIDATION') return false;
    return ['ADMIN', 'GL'].includes(user.role);
  };

  const canReject = (org) => {
    if (!user || org.statut !== 'EN_VALIDATION') return false;
    return ['ADMIN', 'GL'].includes(user.role);
  };

  const canArchive = (org) => {
    if (!user || org.statut !== 'VALIDE') return false;
    return ['ADMIN'].includes(user.role);
  };

  const canResubmit = (org) => {
    if (!user || org.statut !== 'REJETE') return false;
    return ['ADMIN', 'GL', 'SUPERVISEUR'].includes(user.role);
  };
  
  const canEdit = (org) => {
    if (!user || org.statut !== 'BROUILLON') return false;
    return ['ADMIN', 'GL', 'SUPERVISEUR'].includes(user.role);
  };

  const canClone = (org) => {
    if (!user || org.statut !== 'VALIDE') return false;
    return ['ADMIN', 'GL', 'SUPERVISEUR'].includes(user.role);
  };

  const handleAction = async (actionFn, ...args) => {
    try {
      setActionInProgress(true);
      setError(null);
      const result = await actionFn(...args);
      await fetchOrganigrammes();
      return { success: true, data: result };
    } catch (err) {
      console.error(`Failed workflow action`, err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Une erreur est survenue";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    organigrammes,
    activeOrganigramme,
    loading,
    actionInProgress,
    error,
    stats,
    refreshWorkflow: fetchOrganigrammes,
    setError,
    
    // Permission checks
    canSubmit,
    canValidate,
    canReject,
    canArchive,
    canResubmit,
    canEdit,
    canClone,

    // Actions
    submit: (id, comment) => handleAction(organigrammeService.submitOrganigramme, id, comment),
    validate: (id, comment) => handleAction(organigrammeService.validateOrganigramme, id, comment),
    reject: (id, reason, comment) => handleAction(organigrammeService.rejectOrganigramme, id, reason, comment),
    archive: (id, comment) => handleAction(organigrammeService.archiveOrganigramme, id, comment),
    resubmit: (id, comment) => handleAction(organigrammeService.resubmitOrganigramme, id, comment),
    create: (data) => handleAction(organigrammeService.createOrganigramme, data),
    update: (id, data) => handleAction(organigrammeService.updateOrganigramme, id, data),
    clone: (id) => handleAction(organigrammeService.cloneOrganigramme, id),
    validateHierarchy: organigrammeService.validateHierarchy,
  };
}
