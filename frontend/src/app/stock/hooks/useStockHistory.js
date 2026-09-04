import { useState, useEffect } from 'react';
import API from '@/lib/api';

export const useStockHistory = (articleId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!articleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData([]);
      return;
    }

    const controller = new AbortController();
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get(`/stock/mouvements?article_id=${articleId}&limit=100`, {
          signal: controller.signal,
        });

        // Handle both paginated { data: [...] } and legacy flat array responses
        const rawData = res.data.data || res.data;

        // Format data for the UI
        const formattedData = (Array.isArray(rawData) ? rawData : []).map(mov => {
          let reason = "";
          if (mov.type === 'ENTREE') {
            reason = mov.po_reference ? `PO: ${mov.po_reference}` : 'Reception';
            if (mov.planification?.title) reason += ` - ${mov.planification.title}`;
          } else {
            reason = 'Consumption / Exit';
          }

          return {
            action: mov.type === 'ENTREE' ? 'Entry' : 'Exit',
            quantity: mov.quantite,
            reason: reason,
            user: mov.matricule || 'Admin/GL',
            id: mov.matricule || 'SYS',
            date: mov.createdAt,
          };
        });

        setData(formattedData);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          // Ignore cancellation errors
          return;
        }
        console.error('Failed to fetch stock history:', err);
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      controller.abort();
    };
  }, [articleId]);

  return { data, loading, error };
};
