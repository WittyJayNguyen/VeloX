// ============================================
// Admin Module — Utility Helpers
// ============================================

/** Format Vietnamese currency */
export const formatVND = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

/** Format large numbers with K/M suffix */
export const formatCompact = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

/** Calculate uptime color class */
export const getUptimeColor = (percent: number): string => {
  if (percent >= 99.5) return '#10b981';
  if (percent >= 95) return '#f59e0b';
  return '#f43f5e';
};

/** Get status badge config */
export const getStatusBadge = (type: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Active' },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Warning' },
    danger: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Critical' },
    info: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', label: 'Info' },
  };
  return map[type] || map.info;
};
