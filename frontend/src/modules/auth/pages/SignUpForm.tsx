import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineUserPlus,
  HiOutlineExclamationCircle,
  HiOutlineCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import styles from '@assets/scss/auth/auth.module.scss';

export const SignUpForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [websiteHp, setWebsiteHp] = useState('');
  const [cooldown, setCooldown] = useState<number>(0);

  // Real-time password validation criteria
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>/?`~]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial;

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
    if (cooldown > 0) return;
    setError('');

    if (!isPasswordValid) {
      setError('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật bên dưới');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        website_hp: websiteHp,
      });

      const isAdmin = res.user.roles?.includes('ROLE_ADMIN') || res.user.roles?.includes('ROLE_SUPER_ADMIN');
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký tài khoản không thành công. Vui lòng thử lại.';
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
      <div className={styles.card} style={{ maxWidth: 460 }}>
        <div className={styles.cardHeader}>
          <div className={styles.logoBadge}>
            <HiOutlineUserPlus size={28} />
          </div>
          <h1>{t('auth.register_title', 'Tạo Tài Khoản')}</h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.88rem', textAlign: 'center' }}>
            Khởi tạo tài khoản VeloX để kết nối hệ thống AI Gateway
          </p>
        </div>

        {error && (
          <div style={{
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
          {/* Anti-Bot Honeypot Trap (invisible to humans, traps automated spam scripts) */}
          <div style={{ position: 'absolute', opacity: 0, zIndex: -1, pointerEvents: 'none', height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="website_hp">Security Check (do not fill)</label>
            <input
              id="website_hp"
              type="text"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHp}
              onChange={(e) => setWebsiteHp(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e4e4e7', marginBottom: 6, display: 'block' }}>
              {t('auth.full_name', 'Họ và Tên')}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              minLength={2}
              maxLength={128}
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
                placeholder="Tối thiểu 8 ký tự..."
                autoComplete="new-password"
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

          {/* Password policy requirements */}
          <div style={{
            marginTop: '0.6rem',
            padding: '8px 12px',
            background: '#121214',
            borderRadius: 6,
            border: '1px solid #1f1f23',
            fontSize: '0.74rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
          }}>
            <span style={{ color: hasMinLen ? '#10b981' : '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {hasMinLen ? <HiOutlineCheck size={12} /> : <HiOutlineXMark size={12} />} Từ 8 ký tự
            </span>
            <span style={{ color: hasUpper ? '#10b981' : '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {hasUpper ? <HiOutlineCheck size={12} /> : <HiOutlineXMark size={12} />} Chữ hoa (A-Z)
            </span>
            <span style={{ color: hasLower ? '#10b981' : '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {hasLower ? <HiOutlineCheck size={12} /> : <HiOutlineXMark size={12} />} Chữ thường (a-z)
            </span>
            <span style={{ color: (hasDigit && hasSpecial) ? '#10b981' : '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {(hasDigit && hasSpecial) ? <HiOutlineCheck size={12} /> : <HiOutlineXMark size={12} />} Số & Ký tự đặc biệt
            </span>
          </div>

          <div className={styles.field} style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e4e4e7', marginBottom: 6, display: 'block' }}>
              Xác nhận mật khẩu
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu..."
              autoComplete="new-password"
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

          <div style={{ marginTop: '1.75rem' }}>
            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading || cooldown > 0}
              size="lg"
            >
              {cooldown > 0 ? `Vui lòng chờ (${cooldown}s)` : t('auth.register_btn', 'Đăng Ký Tài Khoản')}
            </Button>
          </div>
        </form>

        <SocialAuthButtons onError={setError} />

        <p className={styles.switch} style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.84rem', color: '#71717a' }}>
          {t('auth.has_account', 'Đã có tài khoản?')}{' '}
          <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.login_link', 'Đăng nhập')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
