import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Requires authentication — redirects to /login */
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

/** Requires ADMIN role — blocks self-registered users completely */
export const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
};
