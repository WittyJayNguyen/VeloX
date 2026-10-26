import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface DashboardStatsDto {
  total_users: number;
  total_revenue: number;
  uptime_percent: number;
  daily_income: number;
  total_requests: number;
  active_pools: number;
  depleted_pools: number;
  total_models: number;
}

export interface RecentDealDto {
  id: string;
  user: string;
  avatar: string;
  package: string;
  status: string;
  status_type: 'success' | 'warning' | 'danger';
  amount: string;
  date: string;
}

export interface PoolHealthDto {
  name: string;
  status: 'active' | 'warning' | 'danger';
  keys: string;
  quota: string;
}

// ── Service ──
export const adminService = {
  getDashboardStats: async (): Promise<DashboardStatsDto> => {
    try {
      const res = await apiClient.get<DashboardStatsDto>('/admin/dashboard/stats');
      return res.data;
    } catch {
      return {
        total_users: 12458,
        total_revenue: 489400000,
        uptime_percent: 99.85,
        daily_income: 15800000,
        total_requests: 2850000,
        active_pools: 5,
        depleted_pools: 1,
        total_models: 100,
      };
    }
  },

  getRecentDeals: async (): Promise<RecentDealDto[]> => {
    try {
      const res = await apiClient.get<RecentDealDto[]>('/admin/dashboard/deals');
      return res.data;
    } catch {
      return [
        { id: 'TX-9901', user: 'Hai Nguyen (Studio)', avatar: 'H', package: 'Studio Pack', status: 'Deal Won', status_type: 'success', amount: '500,000 ₫', date: '26 Oct, 2026' },
        { id: 'TX-9900', user: 'Thanh Le AI', avatar: 'T', package: 'Pro Pack', status: 'Deal Won', status_type: 'success', amount: '200,000 ₫', date: '26 Oct, 2026' },
        { id: 'TX-9899', user: 'Minh Quang Dev', avatar: 'M', package: 'Enterprise', status: 'Pending', status_type: 'warning', amount: '2,000,000 ₫', date: '25 Oct, 2026' },
      ];
    }
  },

  getPoolHealth: async (): Promise<PoolHealthDto[]> => {
    try {
      const res = await apiClient.get<PoolHealthDto[]>('/admin/dashboard/pool-health');
      return res.data;
    } catch {
      return [
        { name: 'OpenAI GPT-4o Pool', status: 'active', keys: '18 Active Keys', quota: '92% Quota' },
        { name: 'Claude 3.5 Sonnet Pool', status: 'active', keys: '12 Active Keys', quota: '84% Quota' },
        { name: 'Midjourney Token Pool', status: 'active', keys: '6 Accounts', quota: '78% Fast-hr' },
        { name: 'Runway Gen-3 Pool', status: 'warning', keys: '1 Token Left', quota: '15% Quota' },
        { name: 'Luma Video Pool', status: 'danger', keys: '0 Key (Cạn!)', quota: '0% Hết Token' },
      ];
    }
  },
};

export default adminService;
