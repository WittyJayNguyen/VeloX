import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout/MainLayout';
import AdminLayout from '../components/layouts/AdminLayout/AdminLayout';
import { ProtectedRoute, AdminRoute } from './guards';

// Lazy-loaded pages
import { lazy } from 'react';
const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const ServicePoolPage = lazy(() => import('../pages/admin/ServicePoolPage'));
const ModelsPage = lazy(() => import('../pages/admin/ModelsPage'));
const BillingPage = lazy(() => import('../pages/admin/BillingPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const LogsPage = lazy(() => import('../pages/admin/LogsPage'));

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
