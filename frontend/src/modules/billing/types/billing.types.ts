// ============================================
// Billing Module — TypeScript Types
// ============================================

export interface BillingPackage {
  id: string;
  name: string;
  credit_amount: number;
  price_vnd: number;
  bonus_percent: number;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  package_name: string;
  amount_vnd: number;
  credits_added: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
  is_default: boolean;
  qr_enabled: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'TOPUP' | 'CONSUME' | 'REFUND';
  amount: number;
  balance_after: number;
  description: string;
  date: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  models_included: string[];
  credit_limit: number;
  price_vnd: number;
  is_active: boolean;
}

export interface BillingStats {
  total_revenue: number;
  total_transactions: number;
  avg_order_value: number;
  refund_rate: number;
}
