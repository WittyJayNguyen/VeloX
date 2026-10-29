import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000,
  headers: { 'Content-Type': 'application/json' },
  adapter: typeof fetch !== 'undefined' ? 'fetch' : undefined,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('velox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = localStorage.getItem('velox_lang') || 'vi';
  config.headers['Accept-Language'] = lang;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    const detail = error.response?.data?.detail;
    const detailStr = typeof detail === 'string' ? detail : detail?.message || '';
    const isLocked = detailStr.includes('khóa') || detailStr.includes('vô hiệu') || detail?.code === 'account_locked';

    // Kick out user immediately if unauthorized or account is locked
    if ((status === 401 || (status === 403 && isLocked)) && !isAuthEndpoint) {
      localStorage.removeItem('velox_token');
      localStorage.removeItem('velox_user');
      localStorage.removeItem('velox_users_cache');
      localStorage.removeItem('velox_roles_cache');
      if (window.location.pathname !== '/login') {
        const queryParam = isLocked ? 'account_locked=1' : 'session_expired=1';
        window.location.href = `/login?${queryParam}&redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
