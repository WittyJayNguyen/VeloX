/**
 * VeloX AI Gateway — Accounting Data Types & Models
 */

export interface ExpenseItem {
  id: string;
  entry_code: string;
  category: 'ACCOUNT_PURCHASE' | 'PROVIDER_TOPUP' | 'CAPTCHA_SOLVER' | 'PROXY_NETWORK' | 'SERVER_INFRA' | 'OTHER';
  title: string;
  amount_vnd: number;
  amount_usd?: number;
  provider: string;
  account_count: number;
  tokens_capacity: number;
  depreciated_amount_vnd: number;
  remaining_value_vnd: number;
  status: string;
  invoice_code?: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseListResponse {
  items: ExpenseItem[];
  total: number;
  total_amount_vnd: number;
}

export interface AccountInventoryItem {
  provider: string;
  name: string;
  account_count: number;
  total_tokens: number;
  unit_cost_vnd: number;
  total_cost_vnd: number;
  used_cost_vnd: number;
  remaining_value_vnd: number;
}

export interface AccountingOverview {
  total_revenue_vnd: number;
  total_expense_vnd: number;
  cogs_depreciated_vnd: number;
  remaining_assets_vnd: number;
  gross_profit_vnd: number;
  net_profit_vnd: number;
  gross_margin_pct: number;
  roi_pct: number;
  customer_liabilities_vnd: number;
  account_inventory: AccountInventoryItem[];
  category_breakdown: Record<string, number>;
}

export interface CreateExpensePayload {
  category: string;
  title: string;
  amount_vnd: number;
  amount_usd?: number;
  provider: string;
  account_count?: number;
  tokens_capacity?: number;
  invoice_code?: string;
  notes?: string;
}

export interface CashFlowMovementItem {
  id: string;
  code: string;
  movement_type: 'INFLOW' | 'OUTFLOW';
  source: string;
  counterparty: string;
  amount_vnd: number;
  description: string;
  status: string;
  timestamp: string;
}

export interface CashFlowStatement {
  total_inflow_vnd: number;
  total_outflow_vnd: number;
  net_cashflow_vnd: number;
  customer_unearned_revenue_vnd: number;
  movements: CashFlowMovementItem[];
}
