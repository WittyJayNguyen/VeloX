import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@modules/core/design-system/Button';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPage.module.scss';

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || t('auth.login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>V</div>
          <h1>{t('auth.login_title')}</h1>
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
