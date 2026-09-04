import { useState, useEffect } from 'react';
import API from '@/lib/api';

export const useStockConsumption = (articleId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d'); // 7d, 30d, 180d

  useEffect(() => {
    if (!articleId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData([]);
      return;
    }

    const controller = new AbortController();

    const fetchConsumption = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await API.get(`/stock/articles/${articleId}/consumption?period=${period}`, {
          signal: controller.signal,
        });

        setData(res.data);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Failed to fetch stock consumption:', err);
        setError('Failed to load consumption data.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsumption();

    return () => {
      controller.abort();
    };
  }, [articleId, period]);

  return { data, loading, error, period, setPeriod };
};
