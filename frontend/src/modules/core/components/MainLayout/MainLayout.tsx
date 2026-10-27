import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import LangSwitcher from '../LangSwitcher/LangSwitcher';
import { HiOutlineBars3, HiOutlineXMark, HiOutlineMagnifyingGlass, HiOutlineBell } from 'react-icons/hi2';
import UserProfileDropdown from '../UserProfileDropdown/UserProfileDropdown';
import TopupModal from '../TopupModal/TopupModal';
import QuickSearchModal from '../QuickSearchModal/QuickSearchModal';
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* ── FIXED TOP NAVIGATION ── */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          {/* Logo */}
          <Link to="/" className={styles.brandLink} onClick={closeMobileMenu}>
            <div className={styles.logoSquare}>
              <svg
                className={styles.boltIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className={styles.brandTitle}>
              PULSE<span className={styles.brandAccent}>FIT</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.navCenter}>
            <a href="/#workouts" className={styles.navItem}>
              {t('fitness.nav_workouts')}
            </a>
            <a href="/#trainers" className={styles.navItem}>
              {t('fitness.nav_trainers')}
            </a>
            <a href="/#pricing" className={styles.navItem}>
              {t('fitness.nav_pricing')}
            </a>
            <a href="/#features" className={styles.navItem}>
              {t('fitness.nav_community')}
            </a>
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
                <Link to="/subscription" className={styles.navPricingLink}>
                  {t('header.pricing', 'Bảng giá')}
                </Link>

                {/* Credit Badge + Nạp */}
                <div className={styles.creditBadgeBox}>
                  <div className={styles.creditPill} onClick={() => setTopupOpen(true)} title="Số dư Credit">
                    <span className={styles.diamondIcon}>💎</span>
                    <span className={styles.creditValue}>{user?.credit_balance ?? 991}</span>
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
                    {t('fitness.log_in')}
                  </Link>
                  <Link to="/register" className={styles.startTrialBtn}>
                    {t('fitness.start_trial')}
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
                <a href="/#workouts" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  {t('fitness.nav_workouts')}
                </a>
                <a href="/#trainers" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  {t('fitness.nav_trainers')}
                </a>
                <a href="/#pricing" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  {t('fitness.nav_pricing')}
                </a>
                <a href="/#features" className={styles.mobileNavItem} onClick={closeMobileMenu}>
                  {t('fitness.nav_community')}
                </a>
              </nav>

              <div className={styles.mobileDivider} />

              <div className={styles.mobileActions}>
                {isAuthenticated ? (
                  <div className={styles.mobileUserArea}>
                    <div className={styles.mobileUserGreeting}>
                      👤 {user?.full_name || 'Hải源海'} • 💎 {user?.credit_balance ?? 991} cr
                    </div>
                    <button
                      type="button"
                      className={styles.mobileAdminBtn}
                      onClick={() => {
                        closeMobileMenu();
                        setTopupOpen(true);
                      }}
                      style={{ background: '#2dd4bf', color: '#032b28', fontWeight: 700 }}
                    >
                      💎 {t('menu.topup_now', 'Nạp Credit')}
                    </button>
                    <Link to="/profile" className={styles.mobileAdminBtn} onClick={closeMobileMenu}>
                      👤 {t('client_menu.profile', 'Hồ sơ & Cài đặt')}
                    </Link>
                    <Link to="/subscription" className={styles.mobileAdminBtn} onClick={closeMobileMenu}>
                      💳 {t('client_menu.subscription', 'Quản lý gói')}
                    </Link>
                    {isSuperAdmin && (
                      <Link to="/admin" className={styles.mobileAdminBtn} onClick={closeMobileMenu}>
                        ⚙️ {t('menu.super_admin_panel', 'Bảng Quản Trị Super Admin')}
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
                      {t('fitness.log_in')}
                    </Link>
                    <Link
                      to="/register"
                      className={styles.mobileStartTrialBtn}
                      onClick={closeMobileMenu}
                    >
                      {t('fitness.start_trial')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content View */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTopRow}>
            {/* Brand column */}
            <div className={styles.footerBrandCol}>
              <Link to="/" className={styles.brandLink}>
                <div className={styles.logoSquare}>
                  <svg
                    className={styles.boltIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className={styles.brandTitle}>
                  PULSE<span className={styles.brandAccent}>FIT</span>
                </span>
              </Link>
              <p className={styles.footerDesc}>
                {t('fitness.hero_subtitle')}
              </p>
            </div>

            {/* Workouts links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>{t('fitness.nav_workouts')}</h4>
              <ul className={styles.footerList}>
                <li><a href="/#workouts">{t('fitness.workout_hiit')}</a></li>
                <li><a href="/#workouts">{t('fitness.workout_strength')}</a></li>
                <li><a href="/#workouts">{t('fitness.workout_yoga')}</a></li>
                <li><a href="/#workouts">{t('fitness.workout_boxing')}</a></li>
              </ul>
            </div>

            {/* Company links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Company</h4>
              <ul className={styles.footerList}>
                <li><a href="/#features">About Us</a></li>
                <li><a href="/#trainers">{t('fitness.trainers_title_hl')}</a></li>
                <li><a href="/#pricing">{t('fitness.nav_pricing')}</a></li>
                <li><a href="/#features">{t('fitness.nav_community')}</a></li>
              </ul>
            </div>

            {/* Support links */}
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Support</h4>
              <ul className={styles.footerList}>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Terms & Privacy</a></li>
                <li><a href="#">Security Audit</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Footer bottom legal bar */}
          <div className={styles.footerBottomBar}>
            <p className={styles.copyrightText}>
              © 2026 PulseFit / VeloX. All rights reserved.
            </p>
            <div className={styles.legalLinks}>
              <a href="#">{t('footer.terms')}</a>
              <a href="#">{t('footer.privacy')}</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Quick Search Ctrl+K Modal */}
      <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Credit Topup VietQR Modal */}
      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default MainLayout;
