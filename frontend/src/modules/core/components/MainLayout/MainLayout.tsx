import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import LangSwitcher from '../LangSwitcher/LangSwitcher';
import {
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineCodeBracket,
} from 'react-icons/hi2';
import { RiOpenaiFill, RiSparklingFill } from 'react-icons/ri';
import UserProfileDropdown from '../UserProfileDropdown/UserProfileDropdown';
import TopupModal from '../TopupModal/TopupModal';
import QuickSearchModal from '../QuickSearchModal/QuickSearchModal';
import StudioMegaMenu from '../StudioMegaMenu/StudioMegaMenu';
import styles from '@assets/scss/core/main-layout.module.scss';

const MainLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isSuperAdmin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K listener for quick search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close mobile menu on route or hash changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  // Lock body overflow on /chat so the viewport never scrolls
  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isChatRoute = location.pathname.startsWith('/chat');

  return (
    <div className={`${styles.layout} ${isChatRoute ? styles.chatLayoutMode : ''}`}>
      {/* ── FIXED TOP NAVIGATION ── */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          {/* VeloX Brand Logo */}
          <Link to="/" className={styles.brandLink} onClick={closeMobileMenu}>
            <div className={styles.logoSquare}>
              <svg
                className={styles.boltIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4.5L10.5 19.5H13.5L21 4.5H16.8L12 14.5L7.2 4.5H3Z"
                  fill="#ffffff"
                />
                <path
                  d="M16 12L20.8 20H17.2L13.8 14.2L15 12H16Z"
                  fill="#ffeedd"
                  opacity="0.95"
                />
              </svg>
            </div>
            <span className={styles.brandTitle}>
              Velo<span className={styles.brandAccent}>X</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.navCenter}>
            <Link
              to="/"
              className={`${styles.navItem} ${location.pathname === '/' ? styles.active : ''}`}
            >
              {t('nav.home', 'Trang Chủ')}
            </Link>

            <Link
              to="/chat"
              className={`${styles.navItem} ${location.pathname.startsWith('/chat') ? styles.active : ''}`}
            >
              <HiOutlineChatBubbleLeftRight size={17} style={{ marginRight: 6, verticalAlign: 'middle', color: '#10a37f' }} />
              {t('nav.chat', 'AI Chat')}
            </Link>

            {/* Studio Mega Menu with 2-column hover flyout */}
            <StudioMegaMenu onCloseMenu={closeMobileMenu} />

            <Link
              to="/pricing"
              className={`${styles.navItem} ${location.pathname.startsWith('/pricing') || location.pathname.startsWith('/subscription') ? styles.active : ''}`}
            >
              {t('nav.pricing', 'Bảng Giá')}
            </Link>

            <Link
              to="/models"
              className={`${styles.navItem} ${location.pathname.startsWith('/models') ? styles.active : ''}`}
            >
              {t('nav.models', 'Model')}
            </Link>

            <Link
              to="/docs"
              className={`${styles.navItem} ${location.pathname.startsWith('/docs') || location.pathname.startsWith('/apidocs') ? styles.active : ''}`}
            >
              {t('nav.docs', 'Tài Liệu API')}
            </Link>
          </nav>

          {/* Right Action Group */}
          <div className={styles.navRight}>
            {/* Desktop Auth Controls */}
            {isAuthenticated ? (
              <div className={styles.topbarAuthControls}>
                {/* Search Quick Ctrl K */}
                <button
                  type="button"
                  className={styles.quickSearchBtn}
                  onClick={() => setSearchOpen(true)}
                  title="Tìm nhanh (Ctrl + K)"
                >
                  <HiOutlineMagnifyingGlass size={16} />
                  <span>{t('header.quick_search', 'Tìm nhanh')}</span>
                  <kbd className={styles.searchShortcut}>Ctrl K</kbd>
                </button>

                {/* Pricing Link */}
                <Link to="/pricing" className={styles.navPricingLink}>
                  {t('header.pricing', 'Bảng giá')}
                </Link>

                {/* Credit Badge + Nạp */}
                <div className={styles.creditBadgeBox}>
                  <div className={styles.creditPill} onClick={() => setTopupOpen(true)} title="Số dư Credit">
                    <span className={styles.diamondIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <RiSparklingFill color="#2dd4bf" size={14} />
                    </span>
                    <span className={styles.creditValue}>{(user?.credit_balance ?? 0).toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.navTopupBtn}
                    onClick={() => setTopupOpen(true)}
                  >
                    {t('menu.topup_now', 'Nạp')}
                  </button>
                </div>

                {/* Notifications Bell */}
                <button
                  type="button"
                  className={styles.bellBtn}
                  title={t('header.notifications', 'Thông báo')}
                  onClick={() => alert('Không có thông báo mới.')}
                >
                  <HiOutlineBell size={20} />
                </button>

                {/* User Dropdown matching user mockup */}
                <UserProfileDropdown onOpenTopup={() => setTopupOpen(true)} />
              </div>
            ) : (
              <>
                <div className={styles.langWrapper}>
                  <LangSwitcher />
                </div>

                <div className={styles.authGroup}>
                  <Link to="/login" className={styles.loginBtn}>
                    {t('nav.login', 'Đăng Nhập')}
                  </Link>
                  <Link to="/register" className={styles.startTrialBtn}>
                    {t('nav.register', 'Đăng Ký')}
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className={styles.mobileToggleBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <HiOutlineXMark size={28} /> : <HiOutlineBars3 size={28} />}
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU DRAWER & BACKDROP ── */}
        {mobileMenuOpen && (
          <>
            <div className={styles.mobileBackdrop} onClick={closeMobileMenu} />
            <div className={styles.mobileDrawer}>
              <nav className={styles.mobileNavLinks}>
                <Link to="/" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  <HiOutlineHome size={18} /> {t('nav.home', 'Trang Chủ')}
                </Link>

                <Link to="/chat" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  <HiOutlineChatBubbleLeftRight size={18} color="#10a37f" /> {t('nav.chat', 'AI Chat')}
                </Link>

                <div className={styles.mobileSectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RiOpenaiFill size={16} color="#10a37f" /> STUDIO SÁNG TẠO
                </div>
                <Link to="/chat" className={styles.mobileSubItem} onClick={closeMobileMenu}>
                  <HiOutlineChatBubbleLeftRight size={16} color="#10a37f" /> Chat (GPT-4o, Claude 3.5, Gemini)
                </Link>
                <Link to="/studio?category=image" className={styles.mobileSubItem} onClick={closeMobileMenu}>
                  <HiOutlinePhoto size={16} color="#38bdf8" /> Hình Ảnh (Midjourney, FLUX.1, DALL-E)
                </Link>
                <Link to="/studio?category=video" className={styles.mobileSubItem} onClick={closeMobileMenu}>
                  <HiOutlineFilm size={16} color="#c084fc" /> Video (Runway Gen-3, Luma, Kling)
                </Link>

                <div style={{ height: '6px' }} />

                <Link to="/pricing" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  <HiOutlineCreditCard size={18} /> {t('nav.pricing', 'Bảng Giá')}
                </Link>
                <Link to="/models" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  <RiOpenaiFill size={18} color="#10a37f" /> {t('nav.models', 'Model')}
                </Link>
                <Link to="/docs" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  <HiOutlineCodeBracket size={18} color="#38bdf8" /> {t('nav.docs', 'Tài Liệu API')}
                </Link>
              </nav>

              <div className={styles.mobileDivider} />

              <div className={styles.mobileActions}>
                {isAuthenticated ? (
                  <div className={styles.mobileUserArea}>
                    <div className={styles.mobileUserGreeting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HiOutlineUser size={16} /> {user?.full_name || 'Hải源海'} • <RiSparklingFill size={13} color="#2dd4bf" /> {(user?.credit_balance ?? 0).toLocaleString()} cr
                    </div>
                    <button
                      type="button"
                      className={styles.mobileAdminBtn}
                      onClick={() => {
                        closeMobileMenu();
                        setTopupOpen(true);
                      }}
                      style={{ background: '#2dd4bf', color: '#032b28', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <RiSparklingFill size={15} /> {t('menu.topup_now', 'Nạp Credit')}
                    </button>
                    <Link to="/profile" className={styles.mobileAdminBtn} onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HiOutlineUser size={16} /> {t('client_menu.profile', 'Hồ sơ & Cài đặt')}
                    </Link>
                    <Link to="/pricing" className={styles.mobileAdminBtn} onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HiOutlineCreditCard size={16} /> {t('client_menu.subscription', 'Quản lý gói')}
                    </Link>
                    {isSuperAdmin && (
                      <Link to="/admin" className={styles.mobileAdminBtn} onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineCog6Tooth size={16} /> {t('menu.super_admin_panel', 'Bảng Quản Trị Super Admin')}
                      </Link>
                    )}
                    <button
                      type="button"
                      className={styles.mobileLogoutBtn}
                      onClick={handleLogout}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <div className={styles.mobileAuthArea}>
                    <Link to="/login" className={styles.mobileLoginBtn} onClick={closeMobileMenu}>
                      {t('nav.login', 'Đăng Nhập')}
                    </Link>
                    <Link
                      to="/register"
                      className={styles.mobileStartTrialBtn}
                      onClick={closeMobileMenu}
                    >
                      {t('nav.register', 'Đăng Ký')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content View */}
      <main className={`${styles.main} ${isChatRoute ? styles.chatMainLayout : ''}`}>
        <Outlet />
      </main>

      {/* ── FOOTER (Hidden on /studio and /chat workspace) ── */}
      {!location.pathname.startsWith('/studio') && !location.pathname.startsWith('/chat') && (
        <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTopRow}>
            {/* Brand column */}
            <div className={styles.footerBrandCol}>
              <Link to="/" className={styles.brandLink}>
                <div className={styles.logoSquare}>
                  <svg
                    className={styles.boltIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 4.5L10.5 19.5H13.5L21 4.5H16.8L12 14.5L7.2 4.5H3Z"
                      fill="#ffffff"
                    />
                    <path
                      d="M16 12L20.8 20H17.2L13.8 14.2L15 12H16Z"
                      fill="#ffeedd"
                      opacity="0.95"
                    />
                  </svg>
                </div>
                <span className={styles.brandTitle}>
                  Velo<span className={styles.brandAccent}>X</span>
                </span>
              </Link>
              <p className={styles.footerDesc}>
                {t('hero.subtitle', 'Trung tâm điều phối & Gateway AI thế hệ mới với hơn 100+ mô hình hàng đầu thế giới.')}
              </p>
            </div>

            {/* AI Studio links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>AI Studio</h4>
              <ul className={styles.footerList}>
                <li><Link to="/studio?category=chat">Chat (GPT-4o, Claude 3.5)</Link></li>
                <li><Link to="/studio?category=image">Hình Ảnh (FLUX.1, Midjourney)</Link></li>
                <li><Link to="/studio?category=video">Video (Runway Gen-3, Kling)</Link></li>
                <li><Link to="/models">Danh Mục Mô Hình AI</Link></li>
              </ul>
            </div>

            {/* Platform links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Nền Tảng</h4>
              <ul className={styles.footerList}>
                <li><Link to="/pricing">Bảng Giá Tín Dụng</Link></li>
                <li><Link to="/docs">Tài Liệu API & SDK</Link></li>
                <li><Link to="/docs#part-10">Tích Hợp Cursor / Cline</Link></li>
                <li><Link to="/models">Khám Phá Models</Link></li>
              </ul>
            </div>

            {/* Support links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Hỗ Trợ</h4>
              <ul className={styles.footerList}>
                <li><Link to="/docs#part-13">FAQ & Trợ Giúp</Link></li>
                <li><Link to="/docs">API Documentation</Link></li>
                <li><a href="#">Điều Khoản Dịch Vụ</a></li>
                <li><a href="#">Chính Sách Bảo Mật</a></li>
              </ul>
            </div>
          </div>

          {/* Footer bottom legal bar */}
          <div className={styles.footerBottomBar}>
            <p className={styles.copyrightText}>
              © 2026 VeloX AI Gateway & Studio. All rights reserved.
            </p>
            <div className={styles.legalLinks}>
              <a href="#">{t('footer.terms', 'Điều khoản')}</a>
              <a href="#">{t('footer.privacy', 'Bảo mật')}</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    )}

      {/* Quick Search Ctrl+K Modal */}
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Credit Topup VietQR Modal */}
      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default MainLayout;
