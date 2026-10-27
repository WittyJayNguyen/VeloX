// ============================================
// Billing Module — Utility Helpers
// ============================================

/** Format price in VND */
export const formatPrice = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

/** Calculate bonus credits */
export const calcBonus = (credits: number, bonusPercent: number): number =>
  Math.round(credits * (bonusPercent / 100));

/** Get payment status config */
export const getPaymentStatus = (status: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Thành công' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Chờ xử lý' },
    failed: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Thất bại' },
    refunded: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Đã hoàn' },
  };
  return map[status] || map.pending;
};

/** Format transaction type */
export const getTxTypeLabel = (type: string): { icon: string; label: string; color: string } => {
  const map: Record<string, { icon: string; label: string; color: string }> = {
    TOPUP: { icon: '↑', label: 'Nạp tiền', color: '#10b981' },
    CONSUME: { icon: '↓', label: 'Chi tiêu', color: '#f43f5e' },
    REFUND: { icon: '↩', label: 'Hoàn tiền', color: '#6366f1' },
  };
  return map[type] || map.CONSUME;
};
