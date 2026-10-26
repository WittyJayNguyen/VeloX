import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface PoolKeyDto {
  id: string;
  name: string;
  key_value: string;
  recap_token?: string;
  is_active: boolean;
  requests_count: number;
  detected_models: string[];
}

export interface ServicePoolDto {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Midjourney' | 'Runway' | 'DeepSeek' | 'Google';
  auth_type: 'API_KEY' | 'TOKEN_ACCOUNT';
  routing_strategy: 'ROUND_ROBIN' | 'LEAST_USED' | 'WEIGHTED';
  is_active: boolean;
  rate_limit_per_min: number;
  keys: PoolKeyDto[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePoolPayload {
  name: string;
  provider: ServicePoolDto['provider'];
  auth_type: ServicePoolDto['auth_type'];
  routing_strategy: ServicePoolDto['routing_strategy'];
  rate_limit_per_min: number;
}

export interface AddKeyPayload {
  pool_id: string;
  name: string;
  key_value: string;
  recap_token?: string;
}

// ── Offline fallback using localStorage ──
const STORAGE_KEY = 'velox_pools';

const getLocal = (): ServicePoolDto[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const saveLocal = (data: ServicePoolDto[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// ── Service (tries API first, falls back to localStorage) ──
export const poolService = {
  // ─── Pool CRUD ───
  getAll: async (): Promise<ServicePoolDto[]> => {
    try {
      const res = await apiClient.get<ServicePoolDto[]>('/pools');
      saveLocal(res.data);
      return res.data;
    } catch {
      return getLocal();
    }
  },

  getById: async (id: string): Promise<ServicePoolDto | undefined> => {
    try {
      const res = await apiClient.get<ServicePoolDto>(`/pools/${id}`);
      return res.data;
    } catch {
      return getLocal().find((p) => p.id === id);
    }
  },

  create: async (payload: CreatePoolPayload): Promise<ServicePoolDto> => {
    try {
      const res = await apiClient.post<ServicePoolDto>('/pools', payload);
      const all = getLocal();
      all.push(res.data);
      saveLocal(all);
      return res.data;
    } catch {
      const newPool: ServicePoolDto = {
        id: `pool_${Date.now()}`,
        ...payload,
        is_active: true,
        keys: [],
        created_at: new Date().toISOString(),
      };
      const all = getLocal();
      all.push(newPool);
      saveLocal(all);
      return newPool;
    }
  },

  update: async (id: string, payload: Partial<CreatePoolPayload>): Promise<ServicePoolDto> => {
    try {
      const res = await apiClient.put<ServicePoolDto>(`/pools/${id}`, payload);
      const all = getLocal().map((p) => (p.id === id ? { ...p, ...res.data } : p));
      saveLocal(all);
      return res.data;
    } catch {
      const all = getLocal().map((p) => (p.id === id ? { ...p, ...payload, updated_at: new Date().toISOString() } : p));
      saveLocal(all);
      return all.find((p) => p.id === id)!;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/pools/${id}`);
    } catch { /* offline */ }
    saveLocal(getLocal().filter((p) => p.id !== id));
  },

  toggleActive: async (id: string): Promise<ServicePoolDto> => {
    const all = getLocal();
    const pool = all.find((p) => p.id === id);
    if (!pool) throw new Error('Pool not found');
    pool.is_active = !pool.is_active;
    saveLocal(all);
    try { await apiClient.patch(`/pools/${id}/toggle`); } catch { /* offline */ }
    return pool;
  },

  // ─── Key CRUD ───
  addKey: async (payload: AddKeyPayload): Promise<PoolKeyDto> => {
    const newKey: PoolKeyDto = {
      id: `key_${Date.now()}`,
      name: payload.name,
      key_value: payload.key_value,
      recap_token: payload.recap_token,
      is_active: true,
      requests_count: 0,
      detected_models: [],
    };
    try {
      const res = await apiClient.post<PoolKeyDto>(`/pools/${payload.pool_id}/keys`, payload);
      Object.assign(newKey, res.data);
    } catch { /* offline */ }
    const all = getLocal().map((p) =>
      p.id === payload.pool_id ? { ...p, keys: [...p.keys, newKey] } : p
    );
    saveLocal(all);
    return newKey;
  },

  removeKey: async (poolId: string, keyId: string): Promise<void> => {
    try { await apiClient.delete(`/pools/${poolId}/keys/${keyId}`); } catch { /* offline */ }
    const all = getLocal().map((p) =>
      p.id === poolId ? { ...p, keys: p.keys.filter((k) => k.id !== keyId) } : p
    );
    saveLocal(all);
  },

  toggleKey: async (poolId: string, keyId: string): Promise<void> => {
    const all = getLocal().map((p) =>
      p.id === poolId
        ? { ...p, keys: p.keys.map((k) => (k.id === keyId ? { ...k, is_active: !k.is_active } : k)) }
        : p
    );
    saveLocal(all);
    try { await apiClient.patch(`/pools/${poolId}/keys/${keyId}/toggle`); } catch { /* offline */ }
  },

  autoDetectModels: async (poolId: string, keyId: string): Promise<string[]> => {
    try {
      const res = await apiClient.post<{ models: string[] }>(`/pools/${poolId}/keys/${keyId}/detect`);
      return res.data.models;
    } catch {
      return ['gpt-4o', 'gpt-4o-mini', 'dall-e-3']; // mock
    }
  },
};

export default poolService;
