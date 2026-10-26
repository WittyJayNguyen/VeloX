import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common';
import styles from './AuthPage.module.scss';

const LoginPage = () => {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Demo: giả lập login — sẽ thay bằng API thật khi BE sẵn sàng
      // Tài khoản admin demo: admin@velox.ai / admin123
      if (form.email === 'admin@velox.ai' && form.password === 'admin123') {
        login(
          {
            id: '1', email: 'admin@velox.ai', full_name: 'VeloX Admin',
            is_active: true, roles: ['ROLE_SUPER_ADMIN'], created_at: new Date().toISOString(),
          },
          'demo-admin-jwt-token'
        );
        navigate('/admin');
      } else if (form.email && form.password) {
        login(
          {
            id: '2', email: form.email, full_name: form.email.split('@')[0],
            is_active: true, roles: ['ROLE_USER'], created_at: new Date().toISOString(),
          },
          'demo-user-jwt-token'
        );
        navigate('/');
      } else {
        setError('Vui lòng nhập email và mật khẩu');
      }
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@velox.ai"
            />
          </div>
          <div className={styles.field}>
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" fullWidth loading={loading}>
            {t('auth.login_btn')}
          </Button>
        </form>

        <p className={styles.switch}>
          {t('auth.no_account')} <Link to="/register">{t('nav.register')}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
