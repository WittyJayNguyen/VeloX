import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@modules/core/components/MainLayout/MainLayout';
import AdminLayout from '@modules/core/components/AdminLayout/AdminLayout';
import { AdminRoute } from './guards';

// Lazy-loaded pages — grouped by module
const HomePage = lazy(() => import('@modules/home/pages/HomePage'));
const LoginPage = lazy(() => import('@modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@modules/auth/pages/RegisterPage'));

// Admin
const DashboardPage = lazy(() => import('@modules/admin/pages/DashboardPage'));
const NotificationsPage = lazy(() => import('@modules/admin/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@modules/admin/pages/SettingsPage'));

// Vận Hành
const ModelsPage = lazy(() => import('@modules/models/pages/ModelsPage'));
const LogsPage = lazy(() => import('@modules/logs/pages/LogsPage'));

// Thanh Toán
const BillingPage = lazy(() => import('@modules/billing/pages/BillingPage'));
const BankingPage = lazy(() => import('@modules/billing/pages/BankingPage'));
const WalletPage = lazy(() => import('@modules/billing/pages/WalletPage'));
const PackagesPage = lazy(() => import('@modules/billing/pages/PackagesPage'));

// Dịch Vụ
const ServicePoolPage = lazy(() => import('@modules/pools/pages/ServicePoolPage'));
const ApiKeysPage = lazy(() => import('@modules/pools/pages/ApiKeysPage'));

// Người Dùng
const UsersPage = lazy(() => import('@modules/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@modules/users/pages/RolesPage'));

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
          { path: '/admin/pools', element: <ServicePoolPage /> },
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
