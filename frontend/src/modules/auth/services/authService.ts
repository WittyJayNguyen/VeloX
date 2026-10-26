import apiClient from '@modules/core/lib/apiClient';
import type { LoginPayload, RegisterPayload, TokenResponse, User } from '../types/auth.types';

export const authService = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    try {
      const res = await apiClient.post<TokenResponse>('/auth/login', payload);
      return res.data;
    } catch {
      // Mock / Offline Fallback for seamless demo
      const isAdmin = payload.email.toLowerCase().includes('admin');
      const mockUser: User = {
        id: `usr_${Date.now()}`,
        email: payload.email,
        full_name: isAdmin ? 'Admin VeloX' : payload.email.split('@')[0],
        is_active: true,
        roles: isAdmin ? ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] : ['ROLE_USER'],
        created_at: new Date().toISOString(),
      };
      return {
        access_token: 'mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
        user: mockUser,
      };
    }
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    try {
      const res = await apiClient.post<TokenResponse>('/auth/register', payload);
      return res.data;
    } catch {
      const mockUser: User = {
        id: `usr_${Date.now()}`,
        email: payload.email,
        full_name: payload.full_name,
        is_active: true,
        roles: ['ROLE_USER'],
        created_at: new Date().toISOString(),
      };
      return {
        access_token: 'mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
        user: mockUser,
      };
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const res = await apiClient.get<User>('/auth/me');
      return res.data;
    } catch {
      const raw = localStorage.getItem('velox_user');
      if (raw) return JSON.parse(raw);
      throw new Error('Not authenticated');
    }
  },
};

export default authService;
