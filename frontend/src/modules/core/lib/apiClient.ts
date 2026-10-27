import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

    // Only redirect on 401 if it's NOT an authentication attempt
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('velox_token');
      localStorage.removeItem('velox_user');
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?session_expired=1&redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
