import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@modules/core/components/MainLayout/MainLayout';
import AdminLayout from '@modules/core/components/AdminLayout/AdminLayout';
import { AdminRoute } from './guards';

// Lazy-loaded pages — grouped by module
const HomePage = lazy(() => import('@modules/home/components/HomePage'));
const LoginPage = lazy(() => import('@modules/auth/components/LoginPage'));
const RegisterPage = lazy(() => import('@modules/auth/components/RegisterPage'));

// Admin
const DashboardPage = lazy(() => import('@modules/admin/components/DashboardPage'));
const NotificationsPage = lazy(() => import('@modules/admin/components/NotificationsPage'));
const SettingsPage = lazy(() => import('@modules/admin/components/SettingsPage'));

// Vận Hành
const ModelsPage = lazy(() => import('@modules/models/components/ModelsPage'));
const LogsPage = lazy(() => import('@modules/logs/components/LogsPage'));

// Thanh Toán
const BillingPage = lazy(() => import('@modules/billing/components/BillingPage'));
const BankingPage = lazy(() => import('@modules/billing/components/BankingPage'));
const WalletPage = lazy(() => import('@modules/billing/components/WalletPage'));
const PackagesPage = lazy(() => import('@modules/billing/components/PackagesPage'));

// Dịch Vụ
const ServicePoolPage = lazy(() => import('@modules/pools/components/ServicePoolPage'));
const ApiKeysPage = lazy(() => import('@modules/pools/components/ApiKeysPage'));

// Người Dùng
const UsersPage = lazy(() => import('@modules/users/components/UsersPage'));
const RolesPage = lazy(() => import('@modules/users/components/RolesPage'));

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          // Tổng Quan
          { path: '/admin', element: <DashboardPage /> },

          // Vận Hành
          { path: '/admin/models', element: <ModelsPage /> },
          { path: '/admin/logs', element: <LogsPage /> },

          // Thanh Toán
          { path: '/admin/billing', element: <BillingPage /> },
          { path: '/admin/banking', element: <BankingPage /> },
          { path: '/admin/wallet', element: <WalletPage /> },

          // Dịch Vụ
          { path: '/admin/services', element: <ServicePoolPage /> },
          { path: '/admin/keys', element: <ApiKeysPage /> },
          { path: '/admin/packages', element: <PackagesPage /> },

          // Quản Lý Người Dùng
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/roles', element: <RolesPage /> },

          // Cài Đặt & Tiện Ích
          { path: '/admin/notifications', element: <NotificationsPage /> },
          { path: '/admin/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default router;
