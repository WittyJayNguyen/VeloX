import { create } from 'zustand';
import { ADMIN_ROLES } from '../utils/constants';
import type { User } from '../types/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,

  login: (user, token) => {
    localStorage.setItem('velox_token', token);
    localStorage.setItem('velox_user', JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.roles.some((r) => ADMIN_ROLES.includes(r)),
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
          isAdmin: user.roles.some((r) => ADMIN_ROLES.includes(r)),
        });
      } catch {
        localStorage.removeItem('velox_token');
        localStorage.removeItem('velox_user');
      }
    }
  },
}));
