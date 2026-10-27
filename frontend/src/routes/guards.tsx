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
 * Strictly verifies authenticated user has ROLE_SUPER_ADMIN.
 * If unauthenticated -> redirects to /login.
 * If authenticated but not super admin -> shows secure 403 Forbidden screen with redirect to homepage.
 */
export const AdminRoute = () => {
  const { isAuthenticated, isSuperAdmin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isSuperAdmin) {
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
            Khu Vực Dành Riêng Cho Super Admin
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Hệ thống Quản Trị Cấp Cao yêu cầu quyền hạn <strong>Super Admin</strong>.
            Tài khoản của bạn là thành viên tiêu chuẩn và chỉ có thể sử dụng các chức năng tại Trang Chủ & Không Gian Cá Nhân.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => window.location.href = '/'}>
              Quay Về Trang Chủ
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Đổi Tài Khoản
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
