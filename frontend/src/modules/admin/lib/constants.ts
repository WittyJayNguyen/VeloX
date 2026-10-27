// ============================================
// Admin Module — Lib (Constants & Config)
// ============================================

/** Admin nav section keys */
export const ADMIN_SECTIONS = {
  OVERVIEW: 'TỔNG QUAN',
  OPERATIONS: 'VẬN HÀNH',
  PAYMENT: 'THANH TOÁN',
  SERVICES: 'DỊCH VỤ',
  USERS: 'QUẢN LÝ NGƯỜI DÙNG',
  SETTINGS: 'CÀI ĐẶT & TIỆN ÍCH',
} as const;

/** Dashboard chart colors palette */
export const CHART_COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#f43f5e',
  cyan: '#06b6d4',
  grid: 'rgba(255,255,255,0.05)',
  tooltip_bg: '#18181b',
};

/** Admin route paths */
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  MODELS: '/admin/models',
  LOGS: '/admin/logs',
  BILLING: '/admin/billing',
  BANKING: '/admin/banking',
  WALLET: '/admin/wallet',
  SERVICES: '/admin/services',
  KEYS: '/admin/keys',
  PACKAGES: '/admin/packages',
  USERS: '/admin/users',
  ROLES: '/admin/roles',
  NOTIFICATIONS: '/admin/notifications',
  SETTINGS: '/admin/settings',
} as const;
