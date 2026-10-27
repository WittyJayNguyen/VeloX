import apiClient from '@modules/core/lib/apiClient';

export const homeService = {
  getPublicStats: async () => {
    try {
      const res = await apiClient.get('/public/stats');
      return res.data;
    } catch {
      return { models: 100, users: 12458, uptime: 99.9, requests: 2850000 };
    }
  },
};
