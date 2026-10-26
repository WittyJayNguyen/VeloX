// ============================================
// Core Global Constants
// ============================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const ROLES = {
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  OPERATOR: 'ROLE_OPERATOR',
  USER: 'ROLE_USER',
} as const;

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPERATOR];

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
] as const;

export const MODEL_CATEGORIES = {
  CHAT: 'CHAT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  DEV_REQ: 'DEV_REQ',
} as const;

export const POOL_ROUTING = {
  ROUND_ROBIN: 'ROUND_ROBIN',
  LEAST_USED: 'LEAST_USED',
  WEIGHTED: 'WEIGHTED',
} as const;

export const AUTH_TYPES = {
  API_KEY: 'API_KEY',
  TOKEN_ACCOUNT: 'TOKEN_ACCOUNT',
} as const;
