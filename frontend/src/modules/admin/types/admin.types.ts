// ============================================
// Admin Module — TypeScript Types
// ============================================

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
  status_type: 'success' | 'warning' | 'danger' | 'info';
  amount: string;
  date: string;
}

export interface PoolHealthDto {
  name: string;
  status: 'active' | 'warning' | 'danger';
  keys: string;
  quota: string;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  is_read: boolean;
  date: string;
}

export interface SystemSettingsDto {
  site_name: string;
  site_desc: string;
  default_lang: string;
  maintenance_mode: boolean;
  auto_backup: boolean;
  email_notif: boolean;
  webhook_url: string;
}
