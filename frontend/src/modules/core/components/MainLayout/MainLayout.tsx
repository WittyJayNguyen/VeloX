import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import LangSwitcher from '../LangSwitcher/LangSwitcher';
import Button from '../../design-system/Button';
import styles from '@assets/scss/core/main-layout.module.scss';

const MainLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoBadge}>V</div>
          <span className={styles.brand}>{t('app_name')}</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>{t('nav.home')}</Link>
          <a href="/#workouts" className={styles.navLink}>{t('fitness.nav_workouts')}</a>
          <a href="/#trainers" className={styles.navLink}>{t('fitness.nav_trainers')}</a>
          <a href="/#pricing" className={styles.navLink}>{t('fitness.nav_pricing')}</a>
          <LangSwitcher />

          <Link to="/admin">
            <Button variant="primary" size="sm">
              ⚙️ {t('nav.dashboard')}
            </Button>
          </Link>

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user?.full_name}</span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">{t('nav.register')}</Button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>{t('footer.rights')}</p>
        <div className={styles.footerLinks}>
          <a href="#">{t('footer.terms')}</a>
          <a href="#">{t('footer.privacy')}</a>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
