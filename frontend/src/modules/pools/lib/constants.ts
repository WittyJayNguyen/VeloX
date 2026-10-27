export const POOL_ENDPOINTS = { POOLS: '/pools', KEYS: '/pools/keys', HEALTH: '/pools/health' } as const;
export const POOL_TYPES = ['api_key', 'account_token'] as const;
export const KEY_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive', RATE_LIMITED: 'rate_limited', EXPIRED: 'expired' } as const;
