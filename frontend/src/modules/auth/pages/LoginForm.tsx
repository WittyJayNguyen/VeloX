import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck, HiOutlineExclamationCircle } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { useAuth } from '../hooks/useAuth';
import styles from '@assets/scss/auth/auth.module.scss';

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === '1') {
      setSessionExpiredNotice(true);
    }
  }, [location]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || cooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      const res = await login({ email: email.trim(), password });
      
      // Determine redirection target
      const params = new URLSearchParams(location.search);
      const redirectUrl = params.get('redirect');

      const isSuperAdmin = res.user.roles?.includes('ROLE_SUPER_ADMIN');

      if (redirectUrl && !redirectUrl.startsWith('/login')) {
        // If regular user was trying to access /admin, don't redirect them to /admin
        if (redirectUrl.startsWith('/admin') && !isSuperAdmin) {
          navigate('/', { replace: true });
          return;
        }
        navigate(redirectUrl, { replace: true });
        return;
      }

      if (isSuperAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
      const match = msg.match(/chờ\s+(\d+)\s*(?:giây|s)/i);
      if (match && match[1]) {
        setCooldown(parseInt(match[1], 10));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>
            <HiOutlineShieldCheck size={28} />
          </div>
          <h1>{t('auth.login_title', 'Đăng Nhập')}</h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.88rem', textAlign: 'center' }}>
            Hệ thống AI Gateway & Quản trị trung gian VeloX
          </p>
        </div>

        {sessionExpiredNotice && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#facc15',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <HiOutlineExclamationCircle size={18} />
            <span>Phiên làm việc đã hết hạn hoặc bị hủy bảo mật. Vui lòng đăng nhập lại.</span>
          </div>
        )}

        {error && (
          <div className={styles.error} style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: 1.4,
          }}>
            <HiOutlineExclamationCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e4e4e7', marginBottom: 6, display: 'block' }}>
              {t('auth.email', 'Địa chỉ Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#09090b',
                border: '1px solid #27272a',
                color: '#fafafa',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e4e4e7', marginBottom: 6, display: 'block' }}>
              {t('auth.password', 'Mật khẩu')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: 8,
                  background: '#09090b',
                  border: '1px solid #27272a',
                  color: '#fafafa',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem' }}>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading || cooldown > 0}
              size="lg"
            >
              {cooldown > 0 ? `Vui lòng chờ (${cooldown}s)` : t('auth.login_btn', 'Đăng Nhập')}
            </Button>
          </div>
        </form>

        <p className={styles.switch} style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.84rem', color: '#71717a' }}>
          {t('auth.no_account', 'Chưa có tài khoản?')}{' '}
          <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.register_link', 'Đăng ký ngay')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
