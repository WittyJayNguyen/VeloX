import apiClient from '@modules/core/lib/apiClient';

export interface TransactionItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
}

export const billingService = {
  getTransactions: async (): Promise<TransactionItem[]> => {
    const res = await apiClient.get<TransactionItem[]>('/billing/transactions');
    return res.data;
  },
};

export default billingService;
