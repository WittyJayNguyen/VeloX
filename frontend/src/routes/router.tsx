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

// Vận Hành & Sáng Tạo
const ModelsPage = lazy(() => import('@modules/models/pages/ModelsPage'));
const ModelPricingPage = lazy(() => import('@modules/models/pages/ModelPricingPage'));
const PlaygroundPage = lazy(() => import('@modules/playground/pages/PlaygroundPage'));
const MediaLibraryPage = lazy(() => import('@modules/library/pages/MediaLibraryPage'));
const DeveloperKeysPage = lazy(() => import('@modules/developer/pages/DeveloperKeysPage'));
const LogsPage = lazy(() => import('@modules/logs/pages/LogsPage'));

// Thanh Toán & Ví
const BillingPage = lazy(() => import('@modules/billing/pages/BillingPage'));
const BankingPage = lazy(() => import('@modules/billing/pages/BankingPage'));
const WalletPage = lazy(() => import('@modules/billing/pages/WalletPage'));
const PackagesPage = lazy(() => import('@modules/billing/pages/PackagesPage'));

// Kế Toán & Kiểm Toán Tài Sản VeloX
const AccountingOverviewPage = lazy(() => import('@modules/accounting/pages/AccountingOverviewPage').then(m => ({ default: m.AccountingOverviewPage })));
const AccountingAssetsPage = lazy(() => import('@modules/accounting/pages/AccountingAssetsPage').then(m => ({ default: m.AccountingAssetsPage })));
const AccountingProcurementPage = lazy(() => import('@modules/accounting/pages/AccountingProcurementPage').then(m => ({ default: m.AccountingProcurementPage })));
const AccountingCashFlowPage = lazy(() => import('@modules/accounting/pages/AccountingCashFlowPage').then(m => ({ default: m.AccountingCashFlowPage })));

// Gateway & Pools
const ServicePoolPage = lazy(() => import('@modules/pools/pages/ServicePoolPage'));
const ApiKeysPage = lazy(() => import('@modules/pools/pages/ApiKeysPage'));
const RecaptchaPage = lazy(() => import('@modules/pools/pages/RecaptchaPage'));

// Người Dùng & Kiểm Toán IAM & Chống Bào Free
const UsersPage = lazy(() => import('@modules/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@modules/users/pages/RolesPage'));
const UserAuditsPage = lazy(() => import('@modules/users/pages/UserAuditsPage'));
const CreditAuditsPage = lazy(() => import('@modules/users/pages/CreditAuditsPage'));
const IpAbusePage = lazy(() => import('@modules/users/pages/IpAbusePage'));

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

          // Vận Hành & Models
          { path: '/admin/models', element: <ModelsPage /> },
          { path: '/admin/model-pricing', element: <ModelPricingPage /> },
          { path: '/admin/models/pricing', element: <ModelPricingPage /> },
          { path: '/admin/logs', element: <LogsPage /> },

          // Kế Toán & Kiểm Toán Tài Sản VeloX
          { path: '/admin/accounting', element: <AccountingOverviewPage /> },
          { path: '/admin/accounting/pnl', element: <AccountingOverviewPage /> },
          { path: '/admin/accounting/assets', element: <AccountingAssetsPage /> },
          { path: '/admin/accounting/procurement', element: <AccountingProcurementPage /> },
          { path: '/admin/accounting/cashflow', element: <AccountingCashFlowPage /> },

          // Thanh Toán & Ví
          { path: '/admin/billing', element: <BillingPage /> },
          { path: '/admin/banking', element: <BankingPage /> },
          { path: '/admin/wallet', element: <WalletPage /> },

          // Gateway AI & Sáng Tạo
          { path: '/admin/playground', element: <PlaygroundPage /> },
          { path: '/admin/library', element: <MediaLibraryPage /> },
          { path: '/admin/developer-keys', element: <DeveloperKeysPage /> },
          { path: '/admin/services', element: <ServicePoolPage /> },
          { path: '/admin/pools', element: <ServicePoolPage /> },
          { path: '/admin/keys', element: <ApiKeysPage /> },
          { path: '/admin/recaptcha', element: <RecaptchaPage /> },

          // Dịch Vụ
          { path: '/admin/packages', element: <PackagesPage /> },

          // Quản Lý Người Dùng & Kiểm Toán IAM & Chống Bào Free
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/roles', element: <RolesPage /> },
          { path: '/admin/user-audits', element: <UserAuditsPage /> },
          { path: '/admin/credit-audits', element: <CreditAuditsPage /> },
          { path: '/admin/ip-abuse', element: <IpAbusePage /> },

          // Cài Đặt & Tiện Ích
          { path: '/admin/notifications', element: <NotificationsPage /> },
          { path: '/admin/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default router;
