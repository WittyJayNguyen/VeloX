import { useState, useEffect } from 'react';
import { homeService } from '../services/homeService';

export const useHomeStats = () => {
  const [stats, setStats] = useState({ models: 100, users: 12458, uptime: 99.9, requests: 2850000 });
  useEffect(() => { homeService.getPublicStats().then(setStats); }, []);
  return stats;
};
