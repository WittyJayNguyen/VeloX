import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface UserDto {
  id: string;
  full_name: string;
  email: string;
  role: 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_OPERATOR' | 'ROLE_USER';
  credit_balance: number;
  is_active: boolean;
  registered_date: string;
  vcc_topup_total: number;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  role: UserDto['role'];
  password?: string;
}

export interface CreditAdjustPayload {
  user_id: string;
  delta: number;
  reason?: string;
}

// ── Offline fallback ──
const STORAGE_KEY = 'velox_managed_users';
const getLocal = (): UserDto[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveLocal = (d: UserDto[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

// ── Service ──
export const userService = {
  getAll: async (): Promise<UserDto[]> => {
    try {
      const res = await apiClient.get<UserDto[]>('/users');
      saveLocal(res.data);
      return res.data;
    } catch { return getLocal(); }
  },

  getById: async (id: string): Promise<UserDto | undefined> => {
    try {
      const res = await apiClient.get<UserDto>(`/users/${id}`);
      return res.data;
    } catch { return getLocal().find((u) => u.id === id); }
  },

  create: async (payload: CreateUserPayload): Promise<UserDto> => {
    const newUser: UserDto = {
      id: `user_${Date.now()}`,
      ...payload,
      credit_balance: 0,
      is_active: true,
      registered_date: new Date().toISOString().split('T')[0],
      vcc_topup_total: 0,
    };
    try {
      const res = await apiClient.post<UserDto>('/users', payload);
      Object.assign(newUser, res.data);
    } catch { /* offline */ }
    const all = getLocal();
    all.push(newUser);
    saveLocal(all);
    return newUser;
  },

  update: async (id: string, payload: Partial<CreateUserPayload>): Promise<UserDto> => {
    try {
      const res = await apiClient.put<UserDto>(`/users/${id}`, payload);
      const all = getLocal().map((u) => (u.id === id ? { ...u, ...res.data } : u));
      saveLocal(all);
      return res.data;
    } catch {
      const all = getLocal().map((u) => (u.id === id ? { ...u, ...payload } : u));
      saveLocal(all);
      return all.find((u) => u.id === id)!;
    }
  },

  remove: async (id: string): Promise<void> => {
    try { await apiClient.delete(`/users/${id}`); } catch { /* offline */ }
    saveLocal(getLocal().filter((u) => u.id !== id));
  },

  toggleActive: async (id: string): Promise<void> => {
    const all = getLocal().map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u));
    saveLocal(all);
    try { await apiClient.patch(`/users/${id}/toggle`); } catch { /* offline */ }
  },

  adjustCredit: async (payload: CreditAdjustPayload): Promise<UserDto> => {
    try {
      const res = await apiClient.post<UserDto>(`/users/${payload.user_id}/credit`, payload);
      const all = getLocal().map((u) => (u.id === payload.user_id ? { ...u, ...res.data } : u));
      saveLocal(all);
      return res.data;
    } catch {
      const all = getLocal().map((u) =>
        u.id === payload.user_id ? { ...u, credit_balance: u.credit_balance + payload.delta } : u
      );
      saveLocal(all);
      return all.find((u) => u.id === payload.user_id)!;
    }
  },

  changeRole: async (id: string, newRole: UserDto['role']): Promise<void> => {
    const all = getLocal().map((u) => (u.id === id ? { ...u, role: newRole } : u));
    saveLocal(all);
    try { await apiClient.patch(`/users/${id}/role`, { role: newRole }); } catch { /* offline */ }
  },
};

export default userService;
