export const USER_ENDPOINTS = { USERS: '/users', ROLES: '/users/roles', CREDITS: '/users/credits' } as const;
export const USER_ROLES = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_USER'] as const;
export const ALL_PERMISSIONS = ['ALL', 'users.manage', 'users.view', 'billing.manage', 'billing.topup', 'pools.manage', 'pools.view', 'models.manage', 'models.view', 'logs.view', 'logs.export', 'settings.manage', 'api.access'] as const;
