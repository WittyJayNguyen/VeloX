import apiClient from '@modules/core/lib/apiClient';
import type { LoginPayload, RegisterPayload, TokenResponse, User, ChangePasswordPayload } from '../types/auth.types';

export const authService = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    try {
      const res = await apiClient.post('/auth/login', payload);
      const data = res.data?.data || res.data;
      if (!data?.access_token || !data?.user) {
        throw new Error('Dữ liệu phản hồi từ máy chủ không hợp lệ');
      }
      return data as TokenResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      const serverMsg = axiosErr?.response?.data?.detail || axiosErr?.response?.data?.message || axiosErr?.message;
      throw new Error(serverMsg || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    try {
      const res = await apiClient.post('/auth/register', payload);
      const data = res.data?.data || res.data;
      if (!data?.access_token || !data?.user) {
        throw new Error('Dữ liệu phản hồi đăng ký không hợp lệ');
      }
      return data as TokenResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      const serverMsg = axiosErr?.response?.data?.detail || axiosErr?.response?.data?.message || axiosErr?.message;
      throw new Error(serverMsg || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.');
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const res = await apiClient.get('/auth/me');
      const data = res.data?.data || res.data;
      return data as User;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải thông tin hồ sơ.');
    }
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<TokenResponse> => {
    try {
      const res = await apiClient.post('/auth/change-password', payload);
      const data = res.data?.data || res.data;
      return data as TokenResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Đổi mật khẩu thất bại.');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
  },
};

export default authService;
