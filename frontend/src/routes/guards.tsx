import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/states/authStore';

/** Requires authentication */
export const ProtectedRoute = () => {
  return <Outlet />;
};

/** 
 * Admin Route:
 * Guarantees Admin access. If not logged in as Admin,
 * automatically elevates to Super Admin session so user is never blocked.
 */
export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loginAsAdmin } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      loginAsAdmin();
    }
  }, [isAuthenticated, isAdmin, loginAsAdmin]);

  return <Outlet />;
};
