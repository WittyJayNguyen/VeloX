import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface ModelCatalogDto {
  id: string;
  name: string;
  model_code: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ';
  provider: string;
  cost_per_req_or_1k_tok: number;
  selling_credit_price: number;
  is_active: boolean;
  pool_id: string;
  created_at?: string;
}

export interface CreateModelPayload {
  name: string;
  model_code: string;
  category: ModelCatalogDto['category'];
  provider: string;
  cost_per_req_or_1k_tok: number;
  selling_credit_price: number;
  pool_id: string;
}

export type ModelItem = ModelCatalogDto;

// ── Offline fallback ──
const STORAGE_KEY = 'velox_models';
const getLocal = (): ModelCatalogDto[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveLocal = (data: ModelCatalogDto[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// ── Service ──
export const modelService = {
  getModels: async (): Promise<ModelCatalogDto[]> => {
    return modelService.getAll();
  },

  getAll: async (): Promise<ModelCatalogDto[]> => {
    try {
      const res = await apiClient.get<ModelCatalogDto[]>('/models');
      saveLocal(res.data);
      return res.data;
    } catch { return getLocal(); }
  },

  getById: async (id: string): Promise<ModelCatalogDto | undefined> => {
    try {
      const res = await apiClient.get<ModelCatalogDto>(`/models/${id}`);
      return res.data;
    } catch { return getLocal().find((m) => m.id === id); }
  },

  create: async (payload: CreateModelPayload): Promise<ModelCatalogDto> => {
    const newModel: ModelCatalogDto = { id: `model_${Date.now()}`, ...payload, is_active: true, created_at: new Date().toISOString() };
    try {
      const res = await apiClient.post<ModelCatalogDto>('/models', payload);
      Object.assign(newModel, res.data);
    } catch { /* offline */ }
    const all = getLocal();
    all.push(newModel);
    saveLocal(all);
    return newModel;
  },

  update: async (id: string, payload: Partial<CreateModelPayload>): Promise<ModelCatalogDto> => {
    try {
      const res = await apiClient.put<ModelCatalogDto>(`/models/${id}`, payload);
      const all = getLocal().map((m) => (m.id === id ? { ...m, ...res.data } : m));
      saveLocal(all);
      return res.data;
    } catch {
      const all = getLocal().map((m) => (m.id === id ? { ...m, ...payload } : m));
      saveLocal(all);
      return all.find((m) => m.id === id)!;
    }
  },

  remove: async (id: string): Promise<void> => {
    try { await apiClient.delete(`/models/${id}`); } catch { /* offline */ }
    saveLocal(getLocal().filter((m) => m.id !== id));
  },

  toggleActive: async (id: string): Promise<void> => {
    const all = getLocal().map((m) => (m.id === id ? { ...m, is_active: !m.is_active } : m));
    saveLocal(all);
    try { await apiClient.patch(`/models/${id}/toggle`); } catch { /* offline */ }
  },

  calculateMargin: (costCents: number, sellingCredits: number): number => {
    const costVnd = costCents * 250;
    if (costVnd === 0) return 100;
    return Math.round(((sellingCredits - costVnd) / sellingCredits) * 100);
  },
};

export default modelService;
