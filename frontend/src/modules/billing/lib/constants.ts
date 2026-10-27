// ============================================
// Billing Module — Lib (Constants & Config)
// ============================================

/** Billing API endpoints */
export const BILLING_ENDPOINTS = {
  PACKAGES: '/billing/packages',
  TRANSACTIONS: '/billing/transactions',
  REFUND: '/billing/refund',
  STATS: '/billing/stats',
  BANKS: '/billing/banks',
  WALLET: '/billing/wallet',
} as const;

/** Payment methods */
export const PAYMENT_METHODS = [
  { value: 'vietqr', label: 'VietQR' },
  { value: 'momo', label: 'MoMo' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'crypto', label: 'Crypto (USDT)' },
] as const;

/** Default bank list */
export const BANK_LIST = [
  'Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'VietinBank',
  'ACB', 'Sacombank', 'TPBank', 'VPBank', 'HDBank',
] as const;
