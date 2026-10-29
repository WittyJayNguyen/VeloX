import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { useUIStore } from '../../states/uiStore';
import {
  HiOutlineChartBarSquare,
  HiOutlineServerStack,
  HiOutlineKey,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlineUsers,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineBuildingLibrary,
  HiOutlineWallet,
  HiOutlineShieldCheck,
  HiOutlineBellAlert,
  HiOutlineCog6Tooth,
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList,
  HiOutlineBanknotes,
  HiOutlineDocumentChartBar,
  HiOutlineCircleStack,
  HiOutlineReceiptRefund,
  HiOutlineScale,
  HiOutlineGlobeAlt,
  HiOutlineCommandLine,
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineLanguage,
} from 'react-icons/hi2';

import { RiOpenaiFill } from 'react-icons/ri';
import styles from '@assets/scss/admin/admin-layout.module.scss';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  key: string;
  end?: boolean;
  badge?: string;
  badgeKey?: string;
}

interface NavSection {
  headerKey: string;
  defaultHeader: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    headerKey: 'admin.nav_group.overview',
    defaultHeader: 'TỔNG QUAN',
    items: [
      { path: '/admin', icon: HiOutlineChartBarSquare, key: 'dashboard', end: true },
      { path: '/admin/logs', icon: HiOutlineExclamationTriangle, key: 'logs' },
    ],
  },
  {
    headerKey: 'admin.nav_group.creative',
    defaultHeader: 'SÁNG TẠO & KHO TÁC PHẨM',
    items: [
      { path: '/admin/playground', icon: HiOutlineCommandLine, key: 'playground', badge: 'Live' },
      { path: '/admin/library', icon: HiOutlinePhoto, key: 'library', badge: 'Kho Của Tôi', badgeKey: 'admin.badge.my_library' },
      { path: '/admin/creative-vault', icon: HiOutlineSparkles, key: 'creative_vault', badge: 'Toàn Bộ', badgeKey: 'admin.badge.all_prompts' },
    ],
  },
  {
    headerKey: 'admin.nav_group.gateway',
    defaultHeader: 'GATEWAY & DEVELOPER',
    items: [
      { path: '/admin/developer-keys', icon: RiOpenaiFill, key: 'developer_keys', badge: 'OpenAI API' },
      { path: '/admin/services', icon: HiOutlineServerStack, key: 'services' },
      { path: '/admin/keys', icon: HiOutlineKey, key: 'keys' },
      { path: '/admin/models', icon: HiOutlineCpuChip, key: 'models', badge: '100+' },
      { path: '/admin/model-pricing', icon: HiOutlineBanknotes, key: 'model_pricing', badge: 'Lợi Nhuận', badgeKey: 'admin.badge.profit' },
      { path: '/admin/recaptcha', icon: HiOutlineShieldCheck, key: 'recaptcha', badge: 'Auto' },
    ],
  },
  {
    headerKey: 'admin.nav_group.accounting',
    defaultHeader: 'KẾ TOÁN & KIỂM TOÁN TÀI SẢN',
    items: [
      { path: '/admin/accounting/pnl', icon: HiOutlineDocumentChartBar, key: 'accounting_pnl', badge: 'P&L' },
      { path: '/admin/accounting/assets', icon: HiOutlineCircleStack, key: 'accounting_assets', badge: 'Kiểm Kê', badgeKey: 'admin.badge.inventory' },
      { path: '/admin/accounting/procurement', icon: HiOutlineReceiptRefund, key: 'accounting_procurement', badge: 'Phiếu Chi', badgeKey: 'admin.badge.expense' },
      { path: '/admin/accounting/cashflow', icon: HiOutlineScale, key: 'accounting_cashflow', badge: 'Dòng Tiền', badgeKey: 'admin.badge.cashflow' },
    ],
  },
  {
    headerKey: 'admin.nav_group.billing',
    defaultHeader: 'VÍ & THANH TOÁN',
    items: [
      { path: '/admin/wallet', icon: HiOutlineWallet, key: 'wallet' },
      { path: '/admin/banking', icon: HiOutlineBuildingLibrary, key: 'banking' },
      { path: '/admin/packages', icon: HiOutlineCreditCard, key: 'packages' },
    ],
  },
  {
    headerKey: 'admin.nav_group.users',
    defaultHeader: 'NGƯỜI DÙNG & BẢO MẬT',
    items: [
      { path: '/admin/users', icon: HiOutlineUsers, key: 'users' },
      { path: '/admin/roles', icon: HiOutlineShieldCheck, key: 'roles' },
      { path: '/admin/user-audits', icon: HiOutlineClipboardDocumentList, key: 'user_audits', badge: 'IAM' },
      { path: '/admin/credit-audits', icon: HiOutlineBanknotes, key: 'credit_audits', badge: 'Ledger' },
      { path: '/admin/ip-abuse', icon: HiOutlineGlobeAlt, key: 'ip_abuse', badge: 'Shield' },
    ],
  },
  {
    headerKey: 'admin.nav_group.settings',
    defaultHeader: 'CÀI ĐẶT & TIỆN ÍCH',
    items: [
      { path: '/admin/notifications', icon: HiOutlineBellAlert, key: 'notifications' },
      { path: '/admin/translations', icon: HiOutlineLanguage, key: 'translations', badge: '5 Ngôn Ngữ', badgeKey: 'admin.badge.languages' },
      { path: '/admin/settings', icon: HiOutlineCog6Tooth, key: 'settings' },
    ],
  },

];

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    toggleMobileSidebar,
    closeMobileSidebar,
  } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically close mobile sidebar drawer on route navigation
  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/admin') return t('admin.dashboard.title', 'Bảng Điều Khiển Quản Trị CRM');
    if (p === '/admin/user-audits') return t('admin.audit.iam_title', 'Nhật Ký Kiểm Toán IAM & Bảo Mật');
    if (p === '/admin/credit-audits') return t('admin.audit.credit_ledger_title', 'Sổ Cái Biến Động Tín Dụng (Credit Ledger)');
    if (p === '/admin/ip-abuse') return t('admin.audit.ip_abuse_title', 'Giám Sát IP & Chống Bào Free');
    if (p === '/admin/notifications') return t('admin.sidebar.notifications', 'Thông Báo');
    if (p === '/admin/wallet') return t('admin.sidebar.wallet', 'Ví & Lịch Sử');
    if (p === '/admin/accounting') return t('admin.sidebar.accounting', 'Kế Toán & Kiểm Toán Tài Sản');
    // Extract last segment → look up in sidebar translations
    const seg = p.split('/').pop() || '';
    const underscoreSeg = seg.replace(/-/g, '_');
    const accKey = `accounting_${underscoreSeg}`;
    const directTitle = t(`admin.sidebar.${accKey}`);
    if (directTitle !== `admin.sidebar.${accKey}`) return directTitle;
    return t(`admin.sidebar.${seg}`, t(`admin.sidebar.${underscoreSeg}`, seg));
  };

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.mobileOpen : ''}`}>
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
          <div className={styles.sidebarTopActions}>
            <button className={styles.toggleBtn} onClick={toggleSidebar} type="button" title="Toggle Sidebar">
              <HiOutlineBars3 size={20} />
            </button>
            <button
              className={styles.mobileCloseBtn}
              onClick={closeMobileSidebar}
              type="button"
              title="Đóng menu"
              aria-label="Đóng menu"
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className={styles.workspaceLabel}>{t('admin.workspace_label', 'KHÔNG GIAN LÀM VIỆC')}</div>
        )}

        <nav className={styles.sidebarNav}>
          {navSections.map((sec, idx) => (
            <div key={idx} className={styles.navGroup}>
              {!sidebarCollapsed && (
                <div className={styles.menuHeader}>{t(sec.headerKey, sec.defaultHeader)}</div>
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
                  {!sidebarCollapsed && (item.badgeKey || item.badge) && (
                    <span className={styles.badgePill}>{item.badgeKey ? t(item.badgeKey, item.badge || '') : item.badge}</span>
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
            <button className={styles.mobileToggle} onClick={toggleMobileSidebar} type="button" aria-label="Mở menu">
              <HiOutlineBars3 size={22} />
            </button>
            <div className={styles.searchWrap}>
              <HiOutlineMagnifyingGlass size={16} />
              <input type="text" placeholder={t('admin.search_placeholder') || 'Tìm kiếm nhanh...'} />
            </div>
          </div>

          <div className={styles.topRight}>
            <button className={styles.iconBtn} type="button" title="Theme">
              <HiOutlineMoon size={18} />
            </button>

            <button
              className={styles.iconBtn}
              type="button"
              title={t('admin.sidebar.notifications', 'Thông Báo')}
              onClick={() => navigate('/admin/notifications')}
            >
              <HiOutlineBell size={18} />
              <span className={styles.badgeCount}>3</span>
            </button>

            <div className={styles.userProfile} onClick={() => navigate('/admin')}>
              <div className={styles.avatar}>
                {user?.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Admin VeloX'}</span>
                <span className={styles.userRole}>{t('admin.role_super_admin', 'Super Admin')}</span>
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
