import { create } from 'zustand';
import { ADMIN_ROLES } from '@modules/core/utils/constants';
import type { User } from '../types/auth.types';

export const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin_001',
  email: 'admin@velox.ai',
  full_name: 'Admin VeloX',
  is_active: true,
  roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'],
  created_at: new Date().toISOString(),
};

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User, token: string) => void;
  loginAsAdmin: () => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Initialize with admin by default so user can access /admin immediately
  const savedToken = localStorage.getItem('velox_token');
  const savedUserRaw = localStorage.getItem('velox_user');
  
  let initialUser: User = DEFAULT_ADMIN_USER;
  let initialToken: string = 'velox_admin_session_token';
  let initialAuth = true;
  let initialIsAdmin = true;

  if (savedToken && savedUserRaw) {
    try {
      const parsed = JSON.parse(savedUserRaw) as User;
      initialUser = parsed;
      initialToken = savedToken;
      initialAuth = true;
      initialIsAdmin = parsed.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
    } catch {
      // Keep defaults
    }
  } else {
    // Save default admin so it's always accessible
    localStorage.setItem('velox_token', initialToken);
    localStorage.setItem('velox_user', JSON.stringify(initialUser));
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialAuth,
    isAdmin: initialIsAdmin,

    login: (user, token) => {
      localStorage.setItem('velox_token', token);
      localStorage.setItem('velox_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin: user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r)),
      });
    },

    loginAsAdmin: () => {
      localStorage.setItem('velox_token', 'velox_admin_session_token');
      localStorage.setItem('velox_user', JSON.stringify(DEFAULT_ADMIN_USER));
      set({
        user: DEFAULT_ADMIN_USER,
        token: 'velox_admin_session_token',
        isAuthenticated: true,
        isAdmin: true,
      });
    },

    logout: () => {
      localStorage.removeItem('velox_token');
      localStorage.removeItem('velox_user');
      set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
    },

    hydrate: () => {
      const token = localStorage.getItem('velox_token');
      const raw = localStorage.getItem('velox_user');
      if (token && raw) {
        try {
          const user: User = JSON.parse(raw);
          set({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r)),
          });
          return;
        } catch {
          // ignore
        }
      }
      // If nothing saved, keep default admin
      localStorage.setItem('velox_token', 'velox_admin_session_token');
      localStorage.setItem('velox_user', JSON.stringify(DEFAULT_ADMIN_USER));
      set({
        user: DEFAULT_ADMIN_USER,
        token: 'velox_admin_session_token',
        isAuthenticated: true,
        isAdmin: true,
      });
    },
  };
});

export default useAuthStore;
