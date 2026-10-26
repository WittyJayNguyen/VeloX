import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import LangSwitcher from '../../common/LangSwitcher/LangSwitcher';
import {
  HiOutlineChartBarSquare, HiOutlineServerStack,
  HiOutlineCpuChip, HiOutlineCreditCard,
  HiOutlineUsers, HiOutlineDocumentText,
  HiOutlineCog6Tooth, HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
} from 'react-icons/hi2';
import styles from './AdminLayout.module.scss';

const sidebarItems = [
  { path: '/admin', icon: HiOutlineChartBarSquare, key: 'dashboard', end: true },
  { path: '/admin/services', icon: HiOutlineServerStack, key: 'services' },
  { path: '/admin/models', icon: HiOutlineCpuChip, key: 'models' },
  { path: '/admin/billing', icon: HiOutlineCreditCard, key: 'billing' },
  { path: '/admin/users', icon: HiOutlineUsers, key: 'users' },
  { path: '/admin/logs', icon: HiOutlineDocumentText, key: 'logs' },
  { path: '/admin/settings', icon: HiOutlineCog6Tooth, key: 'settings' },
];

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoWrap}>
            <div className={styles.logoBadge}>V</div>
            {!sidebarCollapsed && <span className={styles.brand}>VeloX Admin</span>}
          </div>
          <button className={styles.toggleBtn} onClick={toggleSidebar}>
            <HiOutlineBars3 size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{t(`admin.sidebar.${item.key}`)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <HiOutlineArrowLeftOnRectangle size={20} />
            {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button className={styles.mobileToggle} onClick={toggleSidebar}>
              <HiOutlineBars3 size={22} />
            </button>
          </div>
          <div className={styles.topRight}>
            <LangSwitcher />
            <div className={styles.avatar}>
              {user?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
