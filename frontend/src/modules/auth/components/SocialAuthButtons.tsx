import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FcGoogle } from 'react-icons/fc';
import { FaTelegram } from 'react-icons/fa';
import { HiOutlineXMark } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import styles from '@assets/scss/auth/auth.module.scss';

interface SocialAuthButtonsProps {
  redirectUrl?: string | null;
  onError?: (msg: string) => void;
}

export const SocialAuthButtons = ({ redirectUrl, onError }: SocialAuthButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithTelegram } = useAuth();

  const [loading, setLoading] = useState(false);
  const [socialConfig, setSocialConfig] = useState<{ google_client_id: string; telegram_bot_username: string }>({
    google_client_id: '',
    telegram_bot_username: '',
  });

  // Modals for fallback or manual input
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Form states for modals
  const [tgInput, setTgInput] = useState('');
  const [tgName, setTgName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  useEffect(() => {
    authService.getSocialConfig().then((cfg) => {
      setSocialConfig(cfg);
      if (cfg.google_client_id) {
        initGoogleGIS(cfg.google_client_id);
      }
    });
  }, []);

  const handlePostAuthRedirect = (res: { user: { roles?: string[] } }) => {
    const params = new URLSearchParams(location.search);
    const target = redirectUrl || params.get('redirect');
    const isSuperAdmin = res.user.roles?.includes('ROLE_SUPER_ADMIN');

    if (target && !target.startsWith('/login') && !target.startsWith('/register')) {
      if (target.startsWith('/admin') && !isSuperAdmin) {
        navigate('/', { replace: true });
        return;
      }
      navigate(target, { replace: true });
      return;
    }

    if (isSuperAdmin) {
      navigate('/admin', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const initGoogleGIS = (clientId: string) => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-gis-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const google = (window as unknown as { google?: { accounts: { id: { initialize: (cfg: unknown) => void; prompt: () => void } } } }).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              await processGoogleAuth({ credential: response.credential });
            }
          },
        });
      }
    };
    document.body.appendChild(script);
  };

  const processGoogleAuth = async (payload: { credential?: string; email?: string; full_name?: string; google_id?: string }) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle(payload);
      setShowGoogleModal(false);
      handlePostAuthRedirect(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.social_auth_failed', 'Xác thực Google không thành công');
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const google = (window as unknown as { google?: { accounts: { id: { prompt: () => void } } } }).google;
    if (socialConfig.google_client_id && google?.accounts?.id) {
      try {
        google.accounts.id.prompt();
        return;
      } catch {
        // Fallback to modal
      }
    }
    // If client ID not yet configured or prompt not supported, open modal
    setShowGoogleModal(true);
  };

  const handleTelegramClick = () => {
    setShowTelegramModal(true);
  };

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTg = tgInput.trim().replace(/^@/, '');
    if (!cleanTg) return;

    setLoading(true);
    try {
      const isNumeric = /^\d+$/.test(cleanTg);
      const res = await loginWithTelegram({
        id: isNumeric ? cleanTg : cleanTg.toLowerCase(),
        username: !isNumeric ? cleanTg : undefined,
        first_name: tgName.trim() || cleanTg,
      });
      setShowTelegramModal(false);
      handlePostAuthRedirect(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.social_auth_failed', 'Xác thực Telegram không thành công');
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = googleEmail.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@')) return;

    await processGoogleAuth({
      email: cleanMail,
      full_name: googleName.trim() || cleanMail.split('@')[0],
      google_id: `g_${cleanMail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  return (
    <>
      <div className={styles.socialDivider}>
        <span>{t('auth.or_continue_with', 'Hoặc tiếp tục với')}</span>
      </div>

      <div className={styles.socialRow}>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.googleBtn}`}
          onClick={handleGoogleClick}
          disabled={loading}
          id="btn-auth-google"
        >
          <FcGoogle size={20} />
          <span>Google</span>
        </button>

        <button
          type="button"
          className={`${styles.socialBtn} ${styles.telegramBtn}`}
          onClick={handleTelegramClick}
          disabled={loading}
          id="btn-auth-telegram"
        >
          <FaTelegram size={20} color="#229ED9" />
          <span>Telegram</span>
        </button>
      </div>

      {/* Telegram Quick Auth Modal */}
      {showTelegramModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#121216',
            border: '1px solid #27272a',
            borderRadius: 12,
            width: '100%',
            maxWidth: 420,
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowTelegramModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
              }}
            >
              <HiOutlineXMark size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(34, 158, 217, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <FaTelegram size={28} color="#229ED9" />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: 700, margin: '0 0 6px' }}>
                {t('auth.telegram_modal_title', 'Xác thực qua Telegram')}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                {t('auth.telegram_modal_desc', 'Hệ thống tự động đăng nhập hoặc tạo tài khoản mới nếu chưa tồn tại.')}
              </p>
            </div>

            <form onSubmit={handleTelegramSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: 6 }}>
                  {t('auth.telegram_username_or_id', 'Telegram Username hoặc ID')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={tgInput}
                  onChange={(e) => setTgInput(e.target.value)}
                  placeholder="@username hoặc số ID..."
                  required
                  autoFocus
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: 6 }}>
                  {t('auth.telegram_name', 'Tên hiển thị (Tùy chọn)')}
                </label>
                <input
                  type="text"
                  value={tgName}
                  onChange={(e) => setTgName(e.target.value)}
                  placeholder="Nguyễn Văn A..."
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

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || !tgInput.trim()}
                style={{
                  background: '#229ED9',
                  borderColor: '#229ED9',
                }}
              >
                {t('auth.telegram_quick_btn', 'Đăng nhập / Đăng ký Telegram')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Google Fallback Modal */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#121216',
            border: '1px solid #27272a',
            borderRadius: 12,
            width: '100%',
            maxWidth: 420,
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
              }}
            >
              <HiOutlineXMark size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <FcGoogle size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: 700, margin: '0 0 6px' }}>
                {t('auth.google_enter_email_title', 'Đăng Nhập Bằng Google')}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                {t('auth.google_enter_email_desc', 'Tự động đăng ký nếu tài khoản chưa có, hoặc đăng nhập nếu đã có.')}
              </p>
            </div>

            <form onSubmit={handleGoogleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: 6 }}>
                  Email Google <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder={t('auth.google_email_placeholder', 'Nhập địa chỉ Gmail...')}
                  required
                  autoFocus
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: 6 }}>
                  {t('auth.google_name_placeholder', 'Họ và tên Google')}
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Nguyễn Văn A..."
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

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading || !googleEmail.trim()}
              >
                {t('auth.google_quick_btn', 'Xác nhận với Google')}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialAuthButtons;
