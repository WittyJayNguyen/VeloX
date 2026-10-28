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
  config?: ModelConfig;
}

export interface ModelConfig {
  durations?: string[];
  resolutions?: string[];
  aspectRatios?: string[];
  qualities?: string[];
  voices?: string[];
  tones?: string[];
  defaultDuration?: string;
  defaultResolution?: string;
  defaultAspectRatio?: string;
  defaultQuality?: string;
  defaultVoice?: string;
  defaultTone?: string;
  [key: string]: any;
}

export interface PublicModelItem {
  id: string;
  name: string;
  model_code: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ' | string;
  provider: string;
  selling_credit_price: number;
  input_credit_price: number;
  output_credit_price: number;
  cache_read_credit_price: number;
  is_available: boolean;
  description?: string;
  created_at?: string;
  config?: ModelConfig;
}

export type ModelItem = ModelCatalogItem;

export const modelService = {
  getPublicModels: async (params?: { category?: string; provider?: string; search?: string }): Promise<PublicModelItem[]> => {
    try {
      const res = await apiClient.get<PublicModelItem[]>('/models/public', { params });
      return res.data || [];
    } catch (err) {
      console.warn('apiClient getPublicModels error, attempting native fetch fallback:', err);
      try {
        const query = params?.category ? `?category=${encodeURIComponent(params.category)}` : '';
        const fRes = await window.fetch(`/api/v1/models/public${query}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (fRes.ok) {
          const json = await fRes.json();
          return json || [];
        }
      } catch (fErr) {
        console.warn('Native fetch fallback failed:', fErr);
      }
      return [];
    }
  },

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

