import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { useUIStore } from '../../states/uiStore';
import LangSwitcher from '../LangSwitcher/LangSwitcher';
import {
  HiOutlineChartBarSquare,
  HiOutlineServerStack,
  HiOutlineKey,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlineUsers,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineBuildingLibrary,
  HiOutlineWallet,
  HiOutlineShieldCheck,
  HiOutlineBellAlert,
  HiOutlineCog6Tooth,
  HiOutlineRocketLaunch,
  HiOutlineExclamationTriangle,
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
    header: 'TỔNG QUAN',
    items: [
      { path: '/admin', icon: HiOutlineChartBarSquare, key: 'dashboard', end: true },
      { path: '/admin/logs', icon: HiOutlineExclamationTriangle, key: 'logs' },
    ],
  },
  {
    header: 'GATEWAY',
    items: [
      { path: '/admin/services', icon: HiOutlineServerStack, key: 'services' },
      { path: '/admin/keys', icon: HiOutlineKey, key: 'keys' },
      { path: '/admin/models', icon: HiOutlineCpuChip, key: 'models', badge: '100+' },
      { path: '/admin/recaptcha', icon: HiOutlineShieldCheck, key: 'recaptcha', badge: 'Auto' },
    ],
  },
  {
    header: 'DỊCH VỤ',
    items: [
      { path: '/admin/packages', icon: HiOutlineCreditCard, key: 'packages' },
    ],
  },
  {
    header: 'THANH TOÁN',
    items: [
      { path: '/admin/wallet', icon: HiOutlineWallet, key: 'wallet' },
      { path: '/admin/banking', icon: HiOutlineBuildingLibrary, key: 'banking' },
    ],
  },
  {
    header: 'QUẢN LÝ NGƯỜI DÙNG',
    items: [
      { path: '/admin/users', icon: HiOutlineUsers, key: 'users' },
      { path: '/admin/roles', icon: HiOutlineShieldCheck, key: 'roles' },
    ],
  },
  {
    header: 'CÀI ĐẶT & TIỆN ÍCH',
    items: [
      { path: '/admin/notifications', icon: HiOutlineBellAlert, key: 'notifications' },
      { path: '/admin/settings', icon: HiOutlineCog6Tooth, key: 'settings' },
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
    // Extract last segment → look up in sidebar translations
    const seg = p.split('/').pop() || '';
    return t(`admin.sidebar.${seg}`, seg);
  };

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <NavLink to="/admin" className={styles.logoWrap}>
            <div className={styles.logoBadge}>V</div>
            {!sidebarCollapsed && (
              <div className={styles.brandWrap}>
                <span className={styles.brand}>VeloX</span>
                <span className={styles.brandSub}>BUSINESS SUITE</span>
              </div>
            )}
          </NavLink>
          <button className={styles.toggleBtn} onClick={toggleSidebar} type="button" title="Toggle Sidebar">
            <HiOutlineBars3 size={20} />
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className={styles.workspaceLabel}>KHÔNG GIAN LÀM VIỆC</div>
        )}

        <nav className={styles.sidebarNav}>
          {navSections.map((sec, idx) => (
            <div key={idx} className={styles.navGroup}>
              {!sidebarCollapsed && (
                <div className={styles.menuHeader}>{sec.header}</div>
              )}
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
                  {!sidebarCollapsed && <span className={styles.navLabel}>{t(`admin.sidebar.${item.key}`)}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span className={styles.badgePill}>{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Upgrade Card */}
        {!sidebarCollapsed && (
          <div className={styles.upgradeCard}>
            <div className={styles.upgradeIcon}>
              <HiOutlineRocketLaunch size={20} />
            </div>
            <div className={styles.upgradeTitle}>Nâng cấp Enterprise</div>
            <div className={styles.upgradeDesc}>Mở khóa báo cáo nâng cao và tự động hóa</div>
            <button className={styles.upgradeBtn} type="button">Tìm hiểu thêm</button>
          </div>
        )}

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
