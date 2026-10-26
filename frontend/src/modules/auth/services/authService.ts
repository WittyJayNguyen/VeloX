import apiClient from '@modules/core/lib/apiClient';
import type { LoginPayload, RegisterPayload, TokenResponse, User } from '../types/auth.types';

export const authService = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/register', payload);
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
};

export default authService;
