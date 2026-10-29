import { useAuthStore } from '../states/authStore';
import { authService } from '../services/authService';
import type { LoginPayload, RegisterPayload, ChangePasswordPayload } from '../types/auth.types';

export const useAuth = () => {
  const { user, token, isAuthenticated, isAdmin, login, logout, updateUser } = useAuthStore();

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

  const handleChangePassword = async (payload: ChangePasswordPayload) => {
    const res = await authService.changePassword(payload);
    login(res.user, res.access_token);
    return res;
  };

  const handleGoogleAuth = async (payload: import('../types/auth.types').GoogleAuthPayload) => {
    const res = await authService.loginWithGoogle(payload);
    login(res.user, res.access_token);
    return res;
  };

  const handleTelegramAuth = async (payload: import('../types/auth.types').TelegramAuthPayload) => {
    const res = await authService.loginWithTelegram(payload);
    login(res.user, res.access_token);
    return res;
  };

  const handleLogout = async () => {
    await authService.logout();
    logout();
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login: handleLogin,
    register: handleRegister,
    loginWithGoogle: handleGoogleAuth,
    loginWithTelegram: handleTelegramAuth,
    changePassword: handleChangePassword,
    logout: handleLogout,
    updateUser,
  };
};

export default useAuth;
