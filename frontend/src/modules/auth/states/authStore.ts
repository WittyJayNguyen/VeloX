import { create } from 'zustand';
import { ADMIN_ROLES } from '@modules/core/utils/constants';
import type { User } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User, token: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  const savedToken = localStorage.getItem('velox_token');
  const savedUserRaw = localStorage.getItem('velox_user');

  let initialUser: User | null = null;
  let initialToken: string | null = null;
  let initialAuth = false;
  let initialIsAdmin = false;

  // Clean out legacy demo backdoor token if found
  if (savedToken === 'velox_admin_session_token' || savedToken?.startsWith('mock_jwt_token_')) {
    localStorage.removeItem('velox_token');
    localStorage.removeItem('velox_user');
  } else if (savedToken && savedUserRaw) {
    try {
      const parsed = JSON.parse(savedUserRaw) as User;
      if (parsed && parsed.id && parsed.email) {
        initialUser = parsed;
        initialToken = savedToken;
        initialAuth = true;
        initialIsAdmin = Array.isArray(parsed.roles) && parsed.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
      }
    } catch {
      localStorage.removeItem('velox_token');
      localStorage.removeItem('velox_user');
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialAuth,
    isAdmin: initialIsAdmin,

    login: (user, token) => {
      localStorage.setItem('velox_token', token);
      localStorage.setItem('velox_user', JSON.stringify(user));
      const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin,
      });
    },

    updateUser: (updatedFields) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...updatedFields };
        localStorage.setItem('velox_user', JSON.stringify(updated));
        const isAdmin = Array.isArray(updated.roles) && updated.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
        return {
          user: updated,
          isAdmin,
        };
      });
    },

    logout: () => {
      localStorage.removeItem('velox_token');
      localStorage.removeItem('velox_user');
      localStorage.removeItem('velox_users_cache');
      localStorage.removeItem('velox_roles_cache');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    },

    hydrate: () => {
      const token = localStorage.getItem('velox_token');
      const raw = localStorage.getItem('velox_user');

      if (token === 'velox_admin_session_token' || token?.startsWith('mock_jwt_token_')) {
        localStorage.removeItem('velox_token');
        localStorage.removeItem('velox_user');
        set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
        return;
      }

      if (token && raw) {
        try {
          const user: User = JSON.parse(raw);
          if (user && user.id && user.email) {
            const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
            set({
              user,
              token,
              isAuthenticated: true,
              isAdmin,
            });
            return;
          }
        } catch {
          // parse failed
        }
      }

      set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
    },
  };
});

export default useAuthStore;
