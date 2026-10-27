export const LOG_ENDPOINTS = { LOGS: '/logs', EXPORT: '/logs/export', CLEANUP: '/logs/cleanup', STATS: '/logs/stats' } as const;
export const LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const;
export const LOG_STATUS_CODES = [200, 201, 400, 401, 403, 404, 429, 500, 502, 503] as const;
