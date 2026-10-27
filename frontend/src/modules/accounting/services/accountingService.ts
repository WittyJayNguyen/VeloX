/**
 * VeloX AI Gateway — Accounting HTTP Client Service
 */
import apiClient from '@modules/core/lib/apiClient';
import type {
  AccountingOverview, ExpenseListResponse, ExpenseItem,
  CreateExpensePayload, CashFlowStatement
} from '../types';

export const accountingService = {
  /**
   * Fetch P&L Overview, Asset Inventory, and Depreciation summary
   */
  async getOverview(): Promise<AccountingOverview> {
    const res = await apiClient.get<AccountingOverview>('/accounting/overview');
    return res.data;
  },

  /**
   * Fetch Cash Flow Statement: Inflow vs Outflow, Net Cash Flow, and chronological movements
   */
  async getCashFlow(): Promise<CashFlowStatement> {
    const res = await apiClient.get<CashFlowStatement>('/accounting/cashflow');
    return res.data;
  },

  /**
   * Fetch paginated expense and account purchase records
   */
  async listExpenses(category?: string, page: number = 1, pageSize: number = 10): Promise<ExpenseListResponse> {
    const res = await apiClient.get<ExpenseListResponse>('/accounting/expenses', {
      params: {
        category: category === 'ALL' ? undefined : category,
        page,
        page_size: pageSize,
      },
    });
    return res.data;
  },

  /**
   * Record a new account purchase or provider deposit
   */
  async createExpense(payload: CreateExpensePayload): Promise<ExpenseItem> {
    const res = await apiClient.post<ExpenseItem>('/accounting/expenses', payload);
    return res.data;
  },

  /**
   * Delete an expense record
   */
  async deleteExpense(id: string): Promise<void> {
    await apiClient.delete(`/accounting/expenses/${id}`);
  },
};
