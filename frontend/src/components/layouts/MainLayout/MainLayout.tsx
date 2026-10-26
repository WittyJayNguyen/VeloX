import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import LangSwitcher from '../../common/LangSwitcher/LangSwitcher';
import { Button } from '../../common';
import styles from './MainLayout.module.scss';

const MainLayout = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
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
          <Link to="/#features" className={styles.navLink}>{t('nav.features')}</Link>
          <Link to="/#pricing" className={styles.navLink}>{t('nav.pricing')}</Link>
          <LangSwitcher />

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">{t('nav.dashboard')}</Button>
                </Link>
              )}
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
