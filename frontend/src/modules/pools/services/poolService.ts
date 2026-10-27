/**
 * VeloX AI Gateway — Service Pools, Keys & Captcha Solvers API Service
 */
import apiClient from '@modules/core/lib/apiClient';

export type KeyAuthType = 'API_KEY' | 'SESSION_TOKEN';
export type KeyStatus = 'ACTIVE' | 'PAUSED' | 'QUOTA_EXCEEDED' | 'ERROR';
export type PlanTier = 'Free' | 'Plus' | 'Pro' | 'Team' | 'Enterprise';
export type ProviderType = 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek' | 'Midjourney' | 'Runway' | 'OpenRouter' | 'Custom';
export type RoutingStrategy = 'ROUND_ROBIN' | 'PRIORITY' | 'LEAST_USED' | 'WEIGHTED';

export interface PoolKeyItem {
  id: string;
  pool_id: string;
  name: string;
  auth_type: KeyAuthType;
  key_val: string;
  recap_token?: string;
  cookies?: string;
  metadata_json?: string;
  quota_daily: number;
  quota_daily_used: number;
  quota_monthly: number;
  quota_monthly_used: number;
  points: number;
  priority: number;
  plan_badge: PlanTier;
  status: KeyStatus;
  requests_count: number;
  detected_models: string[];
  last_checked_at?: string;
  quota_remaining_usd?: number;
  notes?: string;
  created_at?: string;
}

export interface PoolItem {
  id: string;
  name: string;
  provider: ProviderType;
  base_url: string;
  auth_type: 'API_KEY' | 'TOKEN_ACCOUNT' | 'HYBRID';
  routing_strategy: RoutingStrategy;
  keys: PoolKeyItem[];
  is_active: boolean;
  rate_limit_per_min: number;
  max_tokens_per_min?: number;
  timeout_ms?: number;
  description?: string;
  created_at?: string;
}

export type ServicePoolItem = PoolItem;

export interface RecaptchaSolverItem {
  id: string;
  name: string;
  provider: '2Captcha' | 'CapSolver' | 'Anti-Captcha' | 'EzCaptcha' | 'CustomNode';
  api_key: string;
  supported_types: string[];
  balance_usd: number;
  avg_solve_time_sec: number;
  solved_count: number;
  success_rate_pct: number;
  timeout_sec: number;
  assigned_accounts_count: number;
  is_active: boolean;
  created_at?: string;
}

export const poolService = {
  // ── Pools ──
  getPools: async (): Promise<PoolItem[]> => {
    const res = await apiClient.get<PoolItem[]>('/pools');
    return res.data;
  },

  createPool: async (data: Partial<PoolItem>): Promise<PoolItem> => {
    const res = await apiClient.post<PoolItem>('/pools', data);
    return res.data;
  },

  updatePool: async (id: string, data: Partial<PoolItem>): Promise<PoolItem> => {
    const res = await apiClient.put<PoolItem>(`/pools/${id}`, data);
    return res.data;
  },

  deletePool: async (id: string): Promise<void> => {
    await apiClient.delete(`/pools/${id}`);
  },

  togglePool: async (id: string): Promise<PoolItem> => {
    const res = await apiClient.post<PoolItem>(`/pools/${id}/toggle`);
    return res.data;
  },

  // ── Keys ──
  getPoolKeys: async (params?: { pool_id?: string; status?: string; plan?: string; search?: string }): Promise<PoolKeyItem[]> => {
    const res = await apiClient.get<PoolKeyItem[]>('/pool-keys', { params });
    return res.data;
  },

  createPoolKey: async (data: Partial<PoolKeyItem>): Promise<PoolKeyItem> => {
    const res = await apiClient.post<PoolKeyItem>('/pool-keys', data);
    return res.data;
  },

  updatePoolKey: async (id: string, data: Partial<PoolKeyItem>): Promise<PoolKeyItem> => {
    const res = await apiClient.put<PoolKeyItem>(`/pool-keys/${id}`, data);
    return res.data;
  },

  deletePoolKey: async (id: string): Promise<void> => {
    await apiClient.delete(`/pool-keys/${id}`);
  },

  togglePoolKey: async (id: string): Promise<PoolKeyItem> => {
    const res = await apiClient.post<PoolKeyItem>(`/pool-keys/${id}/toggle`);
    return res.data;
  },

  detectKeyModels: async (
    keyVal: string,
    provider: string,
    poolId?: string,
    baseUrl?: string,
    authType?: string,
    cookies?: string
  ) => {
    const res = await apiClient.post<{
      status: string;
      provider: string;
      plan: PlanTier;
      quota_remaining_usd: number;
      detected_models: string[];
      detailed_models?: Array<{
        code: string;
        input_cost_per_1m: number;
        output_cost_per_1m: number;
        cache_read_cost_per_1m: number;
        input_credit_price: number;
        output_credit_price: number;
        cache_read_credit_price: number;
      }>;
      total_models: number;
      message: string;
    }>('/pool-keys/detect', {
      key_val: keyVal,
      provider,
      pool_id: poolId,
      base_url: baseUrl,
      auth_type: authType,
      cookies,
    });
    return res.data;
  },

  // ── Recaptcha Solvers ──
  getRecaptchaSolvers: async (): Promise<RecaptchaSolverItem[]> => {
    const res = await apiClient.get<RecaptchaSolverItem[]>('/recaptcha-solvers');
    return res.data;
  },

  createRecaptchaSolver: async (data: Partial<RecaptchaSolverItem>): Promise<RecaptchaSolverItem> => {
    const res = await apiClient.post<RecaptchaSolverItem>('/recaptcha-solvers', data);
    return res.data;
  },

  updateRecaptchaSolver: async (id: string, data: Partial<RecaptchaSolverItem>): Promise<RecaptchaSolverItem> => {
    const res = await apiClient.put<RecaptchaSolverItem>(`/recaptcha-solvers/${id}`, data);
    return res.data;
  },

  deleteRecaptchaSolver: async (id: string): Promise<void> => {
    await apiClient.delete(`/recaptcha-solvers/${id}`);
  },

  toggleRecaptchaSolver: async (id: string): Promise<RecaptchaSolverItem> => {
    const res = await apiClient.post<RecaptchaSolverItem>(`/recaptcha-solvers/${id}/toggle`);
    return res.data;
  },

  testRecaptchaSolver: async (id: string) => {
    const res = await apiClient.post<{
      status: string;
      solver_name: string;
      provider: string;
      balance_usd: number;
      ping_ms: number;
      message: string;
    }>(`/recaptcha-solvers/${id}/test`);
    return res.data;
  },
};
