import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface CreditPackageDto {
  id: string;
  name: string;
  category: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'DEV' | 'TOPUP';
  description?: string;
  price_vnd: number;
  original_price_vnd?: number;
  credits_given: number;
  bonus_percentage: number;
  is_popular?: boolean;
  is_active: boolean;
  tag_badge?: string;
  sort_order?: number;
  features?: string[];
  created_at?: string;
  updated_at?: string;
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
  category?: string;
  description?: string;
  price_vnd: number;
  original_price_vnd?: number;
  credits_given: number;
  bonus_percentage?: number;
  features?: string[];
  tag_badge?: string;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

// ── Service ──
export const billingService = {
  // ─── Public Packages for Clients ───
  getPublicPackages: async (category?: string): Promise<CreditPackageDto[]> => {
    const params = category && category !== 'ALL' ? { category } : undefined;
    const res = await apiClient.get('/billing/packages', { params });
    return res.data?.data || res.data || [];
  },

  // ─── Admin Packages Management ───
  getAdminPackages: async (): Promise<CreditPackageDto[]> => {
    const res = await apiClient.get('/billing/admin/packages');
    return res.data?.data || res.data || [];
  },

  createPackage: async (payload: CreatePackagePayload): Promise<CreditPackageDto> => {
    const res = await apiClient.post('/billing/admin/packages', payload);
    return res.data?.data || res.data;
  },

  updatePackage: async (id: string, payload: Partial<CreatePackagePayload>): Promise<CreditPackageDto> => {
    const res = await apiClient.put(`/billing/admin/packages/${id}`, payload);
    return res.data?.data || res.data;
  },

  removePackage: async (id: string): Promise<void> => {
    await apiClient.delete(`/billing/admin/packages/${id}`);
  },

  // ─── Legacy aliases for backward compatibility ───
  getPackages: async (): Promise<CreditPackageDto[]> => {
    return billingService.getPublicPackages();
  },

  // ─── Admin Wallet & Transactions ───
  getAdminTransactions: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<any>('/billing/admin/transactions');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      return [];
    }
  },

  getAdminCashFlow: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<any>('/billing/admin/cashflow');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      return [];
    }
  },

  manualTopUp: async (payload: {
    email: string;
    amount_vnd: number;
    credits: number;
    method: string;
    note?: string;
    tier?: string;
    duration_days?: number;
  }): Promise<any> => {
    const res = await apiClient.post<any>('/billing/admin/manual-topup', payload);
    return res.data?.data || res.data;
  },

  // ─── Legacy aliases for backward compatibility ───
  getTransactions: async (): Promise<TransactionDto[]> => {
    return billingService.getAdminTransactions();
  },

  refundTransaction: async (id: string): Promise<void> => {
    await apiClient.post(`/billing/transactions/${id}/refund`);
  },

  checkPaymentStatus: async (params?: { since?: string; expected_amount?: number }): Promise<{
    paid: boolean;
    transaction_code?: string;
    amount_vnd?: number;
    credits_credited?: number;
    created_at?: string;
    credit_balance?: number;
    tier?: string;
  }> => {
    const res = await apiClient.get('/billing/check-payment-status', { params });
    return res.data?.data || res.data || { paid: false };
  },
};

export default billingService;
