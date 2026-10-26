import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common';
import styles from './AuthPage.module.scss';

const RegisterPage = () => {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      // Demo: User tự đăng ký luôn nhận ROLE_USER → KHÔNG vào được /admin
      login(
        {
          id: crypto.randomUUID(), email: form.email, full_name: form.full_name,
          is_active: true, roles: ['ROLE_USER'], created_at: new Date().toISOString(),
        },
        'demo-user-jwt-token'
      );
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>V</div>
          <h1>{t('auth.register_title')}</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>{t('auth.full_name')}</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>{t('auth.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label>{t('auth.confirm_password')}</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          <Button type="submit" fullWidth loading={loading}>
            {t('auth.register_btn')}
          </Button>
        </form>

        <p className={styles.switch}>
          {t('auth.has_account')} <Link to="/login">{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
