import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '@modules/core/components/MainLayout/MainLayout';
import AdminLayout from '@modules/core/components/AdminLayout/AdminLayout';
import { AdminRoute } from './guards';

// Lazy-loaded pages directly from their feature modules
const HomePage = lazy(() => import('@modules/home/components/HomePage'));
const LoginPage = lazy(() => import('@modules/auth/components/LoginPage'));
const RegisterPage = lazy(() => import('@modules/auth/components/RegisterPage'));
const DashboardPage = lazy(() => import('@modules/admin/components/DashboardPage'));
const ServicePoolPage = lazy(() => import('@modules/pools/components/ServicePoolPage'));
const ModelsPage = lazy(() => import('@modules/models/components/ModelsPage'));
const BillingPage = lazy(() => import('@modules/billing/components/BillingPage'));
const UsersPage = lazy(() => import('@modules/users/components/UsersPage'));
const LogsPage = lazy(() => import('@modules/logs/components/LogsPage'));

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
          { path: '/admin', element: <DashboardPage /> },
          { path: '/admin/services', element: <ServicePoolPage /> },
          { path: '/admin/models', element: <ModelsPage /> },
          { path: '/admin/billing', element: <BillingPage /> },
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/logs', element: <LogsPage /> },
        ],
      },
    ],
  },
]);

export default router;
