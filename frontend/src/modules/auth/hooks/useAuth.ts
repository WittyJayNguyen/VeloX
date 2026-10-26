import { useAuthStore } from '../states/authStore';
import { authService } from '../services/authService';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export const useAuth = () => {
  const { user, token, isAuthenticated, isAdmin, login, logout } = useAuthStore();

  const handleLogin = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    login(res.user, res.access_token);
    return res;
  };

  const handleRegister = async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    login(res.user, res.access_token);
    return res;
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login: handleLogin,
    register: handleRegister,
    logout,
  };
};

export default useAuth;
