import apiClient from '@modules/core/lib/apiClient';

export interface AdminStats {
  total_users: number;
  total_revenue: number;
  total_credits_used: number;
  pool_health: number;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>('/admin/stats');
    return res.data;
  },
};

export default adminService;
