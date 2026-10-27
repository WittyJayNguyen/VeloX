import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface CreditPackageDto {
  id: string;
  name: string;
  price_vnd: number;
  credits: number;
  bonus_percent: number;
  is_popular?: boolean;
  is_active: boolean;
}

export interface TransactionDto {
  id: string;
  user_email: string;
  amount_vnd: number;
  credits_given: number;
  method: 'VietQR' | 'MoMo' | 'VCC_Card' | 'Bank_Transfer';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  created_at: string;
}

export type TransactionItem = TransactionDto;

export interface CreatePackagePayload {
  name: string;
  price_vnd: number;
  credits: number;
  bonus_percent: number;
}

// ── Offline fallback ──
const PKG_KEY = 'velox_billing_packages';
const TXN_KEY = 'velox_transactions';

const getLocalPkgs = (): CreditPackageDto[] => {
  try { return JSON.parse(localStorage.getItem(PKG_KEY) || '[]'); } catch { return []; }
};
const saveLocalPkgs = (d: CreditPackageDto[]) => localStorage.setItem(PKG_KEY, JSON.stringify(d));

const getLocalTxns = (): TransactionDto[] => {
  try { return JSON.parse(localStorage.getItem(TXN_KEY) || '[]'); } catch { return []; }
};
const saveLocalTxns = (d: TransactionDto[]) => localStorage.setItem(TXN_KEY, JSON.stringify(d));

// ── Service ──
export const billingService = {
  // ─── Packages CRUD ───
  getPackages: async (): Promise<CreditPackageDto[]> => {
    try {
      const res = await apiClient.get<CreditPackageDto[]>('/billing/packages');
      saveLocalPkgs(res.data);
      return res.data;
    } catch { return getLocalPkgs(); }
  },

  createPackage: async (payload: CreatePackagePayload): Promise<CreditPackageDto> => {
    const pkg: CreditPackageDto = { id: `pkg_${Date.now()}`, ...payload, is_active: true };
    try {
      const res = await apiClient.post<CreditPackageDto>('/billing/packages', payload);
      Object.assign(pkg, res.data);
    } catch { /* offline */ }
    const all = getLocalPkgs();
    all.push(pkg);
    saveLocalPkgs(all);
    return pkg;
  },

  updatePackage: async (id: string, payload: Partial<CreatePackagePayload>): Promise<CreditPackageDto> => {
    try {
      const res = await apiClient.put<CreditPackageDto>(`/billing/packages/${id}`, payload);
      const all = getLocalPkgs().map((p) => (p.id === id ? { ...p, ...res.data } : p));
      saveLocalPkgs(all);
      return res.data;
    } catch {
      const all = getLocalPkgs().map((p) => (p.id === id ? { ...p, ...payload } : p));
      saveLocalPkgs(all);
      return all.find((p) => p.id === id)!;
    }
  },

  removePackage: async (id: string): Promise<void> => {
    try { await apiClient.delete(`/billing/packages/${id}`); } catch { /* offline */ }
    saveLocalPkgs(getLocalPkgs().filter((p) => p.id !== id));
  },

  // ─── Transactions ───
  getTransactions: async (): Promise<TransactionDto[]> => {
    try {
      const res = await apiClient.get<TransactionDto[]>('/billing/transactions');
      saveLocalTxns(res.data);
      return res.data;
    } catch { return getLocalTxns(); }
  },

  refundTransaction: async (id: string): Promise<void> => {
    try { await apiClient.post(`/billing/transactions/${id}/refund`); } catch { /* offline */ }
    const all = getLocalTxns().map((t) => (t.id === id ? { ...t, status: 'REFUNDED' as const } : t));
    saveLocalTxns(all);
  },

  // ─── Stats ───
  getStats: async () => {
    try {
      const res = await apiClient.get('/billing/stats');
      return res.data;
    } catch {
      const txns = getLocalTxns();
      return {
        total_revenue: txns.filter((t) => t.status === 'SUCCESS').reduce((a, t) => a + t.amount_vnd, 0),
        total_transactions: txns.length,
        pending_count: txns.filter((t) => t.status === 'PENDING').length,
      };
    }
  },
};

export default billingService;
