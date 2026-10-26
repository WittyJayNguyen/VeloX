import { useState, useEffect } from 'react';
import { poolService, type ServicePoolItem } from '../services/poolService';

export const usePools = () => {
  const [pools, setPools] = useState<ServicePoolItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    poolService
      .getPools()
      .then((data) => {
        if (mounted) setPools(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { pools, loading };
};

export default usePools;
