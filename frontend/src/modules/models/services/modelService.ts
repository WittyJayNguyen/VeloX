/**
 * VeloX AI Gateway — Models Catalog API Service
 */
import apiClient from '@modules/core/lib/apiClient';

export interface ModelCatalogItem {
  id: string;
  name: string;
  model_code: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ';
  provider: string;
  cost_per_req_or_1k_tok: number;
  selling_credit_price: number;
  input_cost_per_1m?: number;
  output_cost_per_1m?: number;
  cache_read_cost_per_1m?: number;
  input_credit_price?: number;
  output_credit_price?: number;
  cache_read_credit_price?: number;
  is_available: boolean;
  pool_id?: string;
  description?: string;
  created_at?: string;
  cost_price_vnd?: number;
  selling_price_vnd?: number;
  profit_vnd?: number;
  profit_margin_pct?: number;
}

export type ModelItem = ModelCatalogItem;

export const modelService = {
  getModels: async (params?: { category?: string; provider?: string; search?: string }): Promise<ModelCatalogItem[]> => {
    const res = await apiClient.get<ModelCatalogItem[]>('/models', { params });
    return res.data;
  },

  createModel: async (data: Partial<ModelCatalogItem>): Promise<ModelCatalogItem> => {
    const res = await apiClient.post<ModelCatalogItem>('/models', data);
    return res.data;
  },

  updateModel: async (id: string, data: Partial<ModelCatalogItem>): Promise<ModelCatalogItem> => {
    const res = await apiClient.put<ModelCatalogItem>(`/models/${id}`, data);
    return res.data;
  },

  updateModelPricing: async (id: string, data: {
    cost_per_req_or_1k_tok?: number;
    selling_credit_price?: number;
    input_cost_per_1m?: number;
    input_credit_price?: number;
    output_cost_per_1m?: number;
    output_credit_price?: number;
    cache_read_cost_per_1m?: number;
    cache_read_credit_price?: number;
  }): Promise<ModelCatalogItem> => {
    const res = await apiClient.put<ModelCatalogItem>(`/models/${id}/pricing`, data);
    return res.data;
  },

  bulkMarkup: async (data: {
    markup_percent?: number;
    markup_multiplier?: number;
    category?: string;
    provider?: string;
    model_ids?: string[];
  }): Promise<{ status: string; updated_count: number; markup_percent: number; message: string }> => {
    const res = await apiClient.post<{ status: string; updated_count: number; markup_percent: number; message: string }>(
      '/models/bulk-markup',
      data
    );
    return res.data;
  },

  deleteModel: async (id: string): Promise<void> => {
    await apiClient.delete(`/models/${id}`);
  },

  toggleModel: async (id: string): Promise<ModelCatalogItem> => {
    const res = await apiClient.post<ModelCatalogItem>(`/models/${id}/toggle`);
    return res.data;
  },

  syncFromKeys: async () => {
    const res = await apiClient.post<{
      status: string;
      synced_count: number;
      synced_models: string[];
      message: string;
    }>('/models/sync-from-keys');
    return res.data;
  },
};

