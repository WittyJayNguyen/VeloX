import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { useUIStore } from '../../states/uiStore';
import LangSwitcher from '../LangSwitcher/LangSwitcher';
import {
  HiOutlineChartBarSquare,
  HiOutlineServerStack,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineMoon,
} from 'react-icons/hi2';
import styles from '@assets/scss/admin/admin-layout.module.scss';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  key: string;
  end?: boolean;
  badge?: string;
}

interface NavSection {
  header: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    header: 'MENU',
    items: [
      { path: '/admin', icon: HiOutlineChartBarSquare, key: 'dashboard', end: true },
    ],
  },
  {
    header: 'QUẢN LÝ DỊCH VỤ & GATEWAY',
    items: [
      { path: '/admin/services', icon: HiOutlineServerStack, key: 'services', badge: '6' },
      { path: '/admin/models', icon: HiOutlineCpuChip, key: 'models', badge: '100+' },
    ],
  },
  {
    header: 'TÀI CHÍNH & NGƯỜI DÙNG',
    items: [
      { path: '/admin/billing', icon: HiOutlineCreditCard, key: 'billing' },
      { path: '/admin/users', icon: HiOutlineUsers, key: 'users' },
    ],
  },
  {
    header: 'GIÁM SÁT HỆ THỐNG',
    items: [
      { path: '/admin/logs', icon: HiOutlineDocumentText, key: 'logs' },
    ],
  },
];

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/admin') return t('admin.dashboard.title');
    if (p.includes('/services')) return t('admin.sidebar.services');
    if (p.includes('/models')) return t('admin.sidebar.models');
    if (p.includes('/billing')) return t('admin.sidebar.billing');
    if (p.includes('/users')) return t('admin.sidebar.users');
    if (p.includes('/logs')) return t('admin.sidebar.logs');
    return t('nav.dashboard');
  };

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <NavLink to="/admin" className={styles.logoWrap}>
            <div className={styles.logoBadge}>V</div>
            {!sidebarCollapsed && <span className={styles.brand}>VeloX Gateway</span>}
          </NavLink>
          <button className={styles.toggleBtn} onClick={toggleSidebar} type="button" title="Toggle Sidebar">
            <HiOutlineBars3 size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className={styles.menuHeader}>{sec.header}</div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.navIcon}>
                    <item.icon size={19} />
                  </span>
                  {!sidebarCollapsed && <span>{t(`admin.sidebar.${item.key}`)}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span className={styles.badgePill}>{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout} type="button">
            <HiOutlineArrowLeftOnRectangle size={19} />
            {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button className={styles.mobileToggle} onClick={toggleSidebar} type="button">
              <HiOutlineBars3 size={22} />
            </button>
            <div className={styles.searchWrap}>
              <HiOutlineMagnifyingGlass size={16} />
              <input type="text" placeholder={t('admin.search_placeholder') || 'Tìm kiếm nhanh...'} />
            </div>
          </div>

          <div className={styles.topRight}>
            <LangSwitcher />
            
            <button className={styles.iconBtn} type="button" title="Theme">
              <HiOutlineMoon size={18} />
            </button>

            <button className={styles.iconBtn} type="button" title="Notifications">
              <HiOutlineBell size={18} />
              <span className={styles.badgeCount}>3</span>
            </button>

            <div className={styles.userProfile} onClick={() => navigate('/admin')}>
              <div className={styles.avatar}>
                {user?.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Admin VeloX'}</span>
                <span className={styles.userRole}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
            <div className={styles.breadcrumb}>
              <span>VeloX</span>
              <span>/</span>
              <span>Admin</span>
              <span>/</span>
              <span className={styles.active}>{getPageTitle()}</span>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
