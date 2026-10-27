// ============================================
// Auth Module — Lib (Config & Constants)
// ============================================

/** Token storage keys */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'velox_access_token',
  REFRESH_TOKEN: 'velox_refresh_token',
  USER_DATA: 'velox_user',
} as const;

/** Auth API endpoints */
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
} as const;

/** Password validation rules */
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
};
