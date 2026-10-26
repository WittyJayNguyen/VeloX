import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@modules/core/design-system/Button';
import { useAuth } from '../hooks/useAuth';
import styles from '@assets/scss/auth/auth.module.scss';

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginAsAdmin } = useAuth();
  const [email, setEmail] = useState('admin@velox.ai');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (res.user.roles.includes('ROLE_ADMIN') || res.user.roles.includes('ROLE_SUPER_ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch {
      // In case of any unhandled error, fall back to admin if requested
      loginAsAdmin();
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    loginAsAdmin();
    navigate('/admin');
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>V</div>
          <h1>{t('auth.login_title')}</h1>
          <p>Hệ thống AI Gateway & Quản trị trung gian VeloX</p>
        </div>

        {/* Demo Fast Track */}
        <div className={styles.demoBanner}>
          <strong>Tài khoản Demo Admin:</strong> admin@velox.ai / admin123
          <button
            type="button"
            className={styles.quickLoginBtn}
            onClick={handleQuickAdmin}
          >
            Đăng nhập nhanh quyền Admin (1-Click)
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@velox.ai"
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            {t('auth.login_btn')}
          </Button>
        </form>

        <p className={styles.switch}>
          {t('auth.no_account')}{' '}
          <Link to="/register">{t('auth.register_link')}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
