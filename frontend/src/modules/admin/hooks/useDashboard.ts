import { useState, useEffect } from 'react';
import { adminService, type AdminStats } from '../services/adminService';

export const useDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminService
      .getStats()
      .then((data: AdminStats) => {
        if (mounted) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading };
};

export default useDashboard;
