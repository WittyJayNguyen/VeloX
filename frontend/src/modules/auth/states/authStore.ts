import { create } from 'zustand';
import { ADMIN_ROLES } from '@modules/core/utils/constants';
import type { User } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (user: User, token: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  addCredits: (amount: number) => void;
  syncProfile: () => Promise<User | null>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const savedToken = localStorage.getItem('velox_token');
  const savedUserRaw = localStorage.getItem('velox_user');

  let initialUser: User | null = null;
  let initialToken: string | null = null;
  let initialAuth = false;
  let initialIsAdmin = false;
  let initialIsSuperAdmin = false;

  // Clean out legacy demo backdoor token if found
  if (savedToken === 'velox_admin_session_token' || savedToken?.startsWith('mock_jwt_token_')) {
    localStorage.removeItem('velox_token');
    localStorage.removeItem('velox_user');
  } else if (savedToken && savedUserRaw) {
    try {
      const parsed = JSON.parse(savedUserRaw) as User;
      if (parsed && parsed.id && parsed.email) {
        parsed.credit_balance = parsed.credit_balance ?? 0;
        initialUser = parsed;
        initialToken = savedToken;
        initialAuth = true;
        initialIsAdmin = Array.isArray(parsed.roles) && parsed.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
        initialIsSuperAdmin = Array.isArray(parsed.roles) && parsed.roles.includes('ROLE_SUPER_ADMIN');
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
    isSuperAdmin: initialIsSuperAdmin,

    login: (user, token) => {
      user.credit_balance = user.credit_balance ?? 0;
      localStorage.setItem('velox_token', token);
      localStorage.setItem('velox_user', JSON.stringify(user));
      const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
      const isSuperAdmin = Array.isArray(user.roles) && user.roles.includes('ROLE_SUPER_ADMIN');
      set({
        user,
        token,
        isAuthenticated: true,
        isAdmin,
        isSuperAdmin,
      });

      // Synchronize latest profile & accurate credits from database
      get().syncProfile().catch(() => {});
    },

    updateUser: (updatedFields) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...updatedFields };
        localStorage.setItem('velox_user', JSON.stringify(updated));
        const isAdmin = Array.isArray(updated.roles) && updated.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
        const isSuperAdmin = Array.isArray(updated.roles) && updated.roles.includes('ROLE_SUPER_ADMIN');
        return {
          user: updated,
          isAdmin,
          isSuperAdmin,
        };
      });
    },

    addCredits: (amount: number) => {
      set((state) => {
        if (!state.user) return state;
        const currentBalance = state.user.credit_balance ?? 0;
        const updated = { ...state.user, credit_balance: Math.max(0, currentBalance + amount) };
        localStorage.setItem('velox_user', JSON.stringify(updated));
        return { user: updated };
      });
    },

    syncProfile: async () => {
      const token = localStorage.getItem('velox_token');
      if (!token) return null;
      try {
        const freshUser = await authService.getProfile();
        if (freshUser && freshUser.id) {
          freshUser.credit_balance = freshUser.credit_balance ?? 0;
          localStorage.setItem('velox_user', JSON.stringify(freshUser));
          const isAdmin = Array.isArray(freshUser.roles) && freshUser.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
          const isSuperAdmin = Array.isArray(freshUser.roles) && freshUser.roles.includes('ROLE_SUPER_ADMIN');
          set({
            user: freshUser,
            isAuthenticated: true,
            isAdmin,
            isSuperAdmin,
          });
          return freshUser;
        }
      } catch {
        // Ignored if offline or unauthorized
      }
      return null;
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
        isSuperAdmin: false,
      });
    },

    hydrate: () => {
      const token = localStorage.getItem('velox_token');
      const raw = localStorage.getItem('velox_user');

      if (token === 'velox_admin_session_token' || token?.startsWith('mock_jwt_token_')) {
        localStorage.removeItem('velox_token');
        localStorage.removeItem('velox_user');
        set({ user: null, token: null, isAuthenticated: false, isAdmin: false, isSuperAdmin: false });
        return;
      }

      if (token && raw) {
        try {
          const user: User = JSON.parse(raw);
          if (user && user.id && user.email) {
            user.credit_balance = user.credit_balance ?? 0;
            const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));
            const isSuperAdmin = Array.isArray(user.roles) && user.roles.includes('ROLE_SUPER_ADMIN');
            set({
              user,
              token,
              isAuthenticated: true,
              isAdmin,
              isSuperAdmin,
            });

            // Async background refresh from database
            get().syncProfile().catch(() => {});
            return;
          }
        } catch {
          // parse failed
        }
      }

      set({ user: null, token: null, isAuthenticated: false, isAdmin: false, isSuperAdmin: false });
    },
  };
});

export default useAuthStore;
