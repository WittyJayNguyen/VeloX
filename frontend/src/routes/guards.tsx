import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/states/authStore';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';

/** Requires authentication for general members */
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

/** 
 * Admin Route:
 * Strictly verifies authenticated user has ROLE_ADMIN or ROLE_SUPER_ADMIN.
 * If unauthenticated -> redirects to /login.
 * If authenticated but non-admin -> shows secure 403 Forbidden screen.
 */
export const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        color: '#fafafa',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: 480,
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: 16,
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#ef4444',
          }}>
            <HiOutlineShieldExclamation size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
            Truy Cập Bị Từ Chối (403)
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Tài khoản của bạn không có vai trò Quản Trị Viên (Admin) để truy cập phân hệ này.
            Vui lòng đăng nhập với tài khoản được cấp quyền hoặc quay về trang chủ.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Về Trang Chủ
            </Button>
            <Button variant="primary" onClick={() => window.location.href = '/login'}>
              Đổi Tài Khoản
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
