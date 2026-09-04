import { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useBomData() {
  const { user } = useAuth();
  
  // Data states
  const [boms, setBoms] = useState([]);
  const [selectedBom, setSelectedBom] = useState(null);
  
  // Pagination & Search states
  const [bomPage, setBomPage] = useState(1);
  const [bomLimit] = useState(15);
  const [bomTotal, setBomTotal] = useState(0);
  const [bomTotalPages, setBomTotalPages] = useState(1);
  const [bomSearch, setBomSearch] = useState('');
  
  // Granular loading states
  const [bomsLoading, setBomsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const isWriteAllowed = user && ['ADMIN', 'GL'].includes(user.role);

  // Cache & abort controllers
  const bomDetailsCache = useRef(new Map());
  const abortControllerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  }, []);

  const handleError = useCallback((err, defaultMsg) => {
    if (err?.name === 'CanceledError') return; // Ignore aborts
    console.error("BOM Action Error:", err);
    setError(err?.response?.data?.error || err?.error || err?.message || defaultMsg);
    setTimeout(() => setError(''), 5000);
  }, []);

  // Fetch BOMs list (Paginated & Searchable)
  const loadBoms = useCallback(async (page = 1, search = '') => {
    try {
      setBomsLoading(true);
      const res = await API.get(`/bom?page=${page}&limit=${bomLimit}&search=${search}`);
      setBoms(res.data.data);
      setBomTotal(res.data.pagination.total);
      setBomTotalPages(res.data.pagination.totalPages);
      setBomPage(page);
    } catch (err) {
      handleError(err, 'Impossible de charger les BOM.');
    } finally {
      setBomsLoading(false);
    }
  }, [bomLimit, handleError]);

  // Load single BOM details with caching and abort
  const loadBomDetails = useCallback(async (id, forceRefresh = false) => {
    if (!id) return;
    
    // Abort previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (!forceRefresh && bomDetailsCache.current.has(id)) {
        setSelectedBom(bomDetailsCache.current.get(id));
        return;
      }

      setDetailsLoading(true);
      const res = await API.get(`/bom/${id}`, {
        signal: abortControllerRef.current.signal
      });
      
      bomDetailsCache.current.set(id, res.data);
      setSelectedBom(res.data);
    } catch (err) {
      handleError(err, 'Impossible de charger le détail de la BOM.');
    } finally {
      setDetailsLoading(false);
    }
  }, [handleError]);

  // Initial load
  useEffect(() => {
    let ignore = false;
    const init = async () => {
      try {
        setBomsLoading(true);
        const res = await API.get(`/bom?page=1&limit=${bomLimit}&search=`);
        if (!ignore) {
          setBoms(res.data.data);
          setBomTotal(res.data.pagination.total);
          setBomTotalPages(res.data.pagination.totalPages);
          
          if (res.data.data.length > 0) {
            loadBomDetails(res.data.data[0].id);
          }
        }
      } catch (err) {
        if (!ignore) handleError(err, 'Impossible de charger les BOM.');
      } finally {
        if (!ignore) setBomsLoading(false);
      }
    };
    init();
    return () => { ignore = true; };
  }, [bomLimit, handleError, loadBomDetails]);

  // Search articles helper for AddComponentModal
  const searchArticles = async (query) => {
    try {
      const res = await API.get(`/stock/articles/search?q=${query}&limit=30`);
      return res.data;
    } catch (err) {
      handleError(err, 'Erreur lors de la recherche d\'articles');
      return [];
    }
  };

  // Actions
  const updateBom = async (id, data) => {
    try {
      const res = await API.put(`/bom/${id}`, data);
      setBoms(prev => prev.map(b => b.id === id ? { ...b, ...res.data } : b));
      
      // Update cache
      if (bomDetailsCache.current.has(id)) {
        const cached = bomDetailsCache.current.get(id);
        bomDetailsCache.current.set(id, { ...cached, ...res.data });
      }
      
      if (selectedBom?.id === id) {
        setSelectedBom(prev => ({ ...prev, ...res.data }));
      }
      showToast('BOM mise à jour avec succès');
      return res.data;
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour de la BOM');
      throw err;
    }
  };

  const createBom = async (data) => {
    try {
      const res = await API.post('/bom', data);
      setBoms(prev => [res.data, ...prev].slice(0, bomLimit));
      loadBomDetails(res.data.id, true);
      showToast('BOM créée avec succès');
      return res.data;
    } catch (err) {
      handleError(err, 'Erreur lors de la création de la BOM');
      throw err;
    }
  };

  const deleteBom = async (id) => {
    try {
      await API.delete(`/bom/${id}`);
      bomDetailsCache.current.delete(id);
      
      setBoms(prev => prev.filter(b => b.id !== id));
      if (selectedBom?.id === id) {
        setSelectedBom(null);
      }
      showToast('BOM supprimée avec succès');
    } catch (err) {
      handleError(err, 'Erreur lors de la suppression de la BOM.');
      throw err;
    }
  };

  const addLine = async (bomId, articleId, quantite, prix = 0) => {
    try {
      const payload = {
        article_id: articleId,
        quantite: parseFloat(quantite),
        prix: parseFloat(prix)
      };
      await API.post(`/bom/${bomId}/lignes`, payload);
      await loadBomDetails(bomId, true); // Force refresh
      showToast('Composant ajouté avec succès');
    } catch (err) {
      handleError(err, "Erreur lors de l'ajout du composant");
      throw err;
    }
  };

  const updateLine = async (bomId, lineId, articleId, quantite) => {
    try {
      const payload = {
        article_id: articleId,
        quantite: parseFloat(quantite),
      };
      await API.put(`/bom/${bomId}/lignes/${lineId}`, payload);
      await loadBomDetails(bomId, true); // Force refresh
      showToast('Composant mis à jour avec succès');
    } catch (err) {
      handleError(err, 'Erreur lors de la mise à jour du composant');
      throw err;
    }
  };

  const deleteLine = async (bomId, lineId) => {
    try {
      await API.delete(`/bom/${bomId}/lignes/${lineId}`);
      
      const newLignes = selectedBom.lignes.filter(l => l.id !== lineId);
      const updatedBom = { ...selectedBom, lignes: newLignes };
      
      setSelectedBom(updatedBom);
      bomDetailsCache.current.set(bomId, updatedBom);
      
      showToast('Composant supprimé avec succès');
    } catch (err) {
      handleError(err, 'Erreur lors de la suppression de la ligne.');
      throw err;
    }
  };

  const bulkImportLines = async (bomId, lines) => {
    try {
      setDetailsLoading(true);
      await API.post(`/bom/${bomId}/lignes/bulk`, { lines });
      await loadBomDetails(bomId, true);
      showToast('Composants importés avec succès');
    } catch (err) {
      handleError(err, "Erreur lors de l'importation");
      throw err;
    } finally {
      setDetailsLoading(false);
    }
  }

  return {
    user,
    isWriteAllowed,
    boms,
    selectedBom,
    bomPage,
    bomLimit,
    bomTotal,
    bomTotalPages,
    bomSearch,
    setBomSearch,
    bomsLoading,
    detailsLoading,
    error,
    toast,
    actions: {
      loadBoms,
      loadBomDetails,
      createBom,
      updateBom,
      deleteBom,
      addLine,
      updateLine,
      deleteLine,
      bulkImportLines,
      searchArticles,
      clearError: () => setError(''),
      clearToast: () => setToast({ message: '', type: '' })
    }
  };
}
