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

  // Modal for Telegram quick auth
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  // Modal if Google Client ID is missing
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);

  // Form states
  const [tgInput, setTgInput] = useState('');
  const [tgName, setTgName] = useState('');
  const [manualClientId, setManualClientId] = useState('');

  // 1. Fetch Social Configuration on mount
  useEffect(() => {
    authService.getSocialConfig().then((cfg) => {
      setSocialConfig(cfg);
      if (cfg.google_client_id) {
        initGoogleGIS(cfg.google_client_id);
      }
    });
  }, []);

  // 2. Handle Google OAuth redirect callback (e.g. /login?code=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setLoading(true);
      const redirectUri = window.location.origin + window.location.pathname;
      loginWithGoogle({ code, redirect_uri: redirectUri })
        .then((res) => {
          // Clean query params from URL bar
          window.history.replaceState({}, document.title, window.location.pathname);
          handlePostAuthRedirect(res);
        })
        .catch((err) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          const msg = err instanceof Error ? err.message : t('auth.social_auth_failed', 'Xác thực Google không thành công');
          if (onError) onError(msg);
        })
        .finally(() => setLoading(false));
    }
  }, [location.search]);

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
              setLoading(true);
              try {
                const res = await loginWithGoogle({ credential: response.credential });
                handlePostAuthRedirect(res);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : t('auth.social_auth_failed', 'Xác thực Google không thành công');
                if (onError) onError(msg);
              } finally {
                setLoading(false);
              }
            }
          },
        });
      }
    };
    document.body.appendChild(script);
  };

  // Direct redirection to Google OAuth Consent Page
  const redirectToGoogleOAuth = (clientId: string) => {
    const redirectUri = window.location.origin + window.location.pathname;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      'openid email profile'
    )}&access_type=offline&prompt=select_account`;

    // Navigate the browser directly to Google!
    window.location.href = googleAuthUrl;
  };

  const handleGoogleClick = () => {
    const clientId = socialConfig.google_client_id || manualClientId;
    if (clientId && clientId.trim()) {
      redirectToGoogleOAuth(clientId.trim());
      return;
    }
    // If Google Client ID is not yet configured, show setup modal
    setShowGoogleConfigModal(true);
  };

  const handleManualClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientId.trim()) return;
    setShowGoogleConfigModal(false);
    redirectToGoogleOAuth(manualClientId.trim());
  };

  const handleTelegramClick = () => {
    if (socialConfig.telegram_bot_username) {
      window.open(`https://t.me/${socialConfig.telegram_bot_username}?start=auth`, '_blank');
      return;
    }
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
          title="Chuyển sang đăng nhập tài khoản Google"
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
          title="Chuyển sang đăng nhập tài khoản Telegram"
        >
          <FaTelegram size={20} color="#229ED9" />
          <span>Telegram</span>
        </button>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
          {t('auth.social_auth_in_progress', 'Đang xác thực thông tin...')}
        </p>
      )}

      {/* Google Client ID Setup Modal (only shown if server has not set GOOGLE_CLIENT_ID yet) */}
      {showGoogleConfigModal && (
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
            maxWidth: 440,
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setShowGoogleConfigModal(false)}
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
                background: 'rgba(66, 133, 244, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <FcGoogle size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#f4f4f5', fontWeight: 700, margin: '0 0 6px' }}>
                Kết Nối Google OAuth 2.0
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                Hệ thống cần <strong>Google Client ID</strong> (từ Google Cloud Console) để chuyển thẳng sang trang đăng nhập chính thức của Google.
              </p>
            </div>

            <form onSubmit={handleManualClientSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', display: 'block', marginBottom: 6 }}>
                  Google Client ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={manualClientId}
                  onChange={(e) => setManualClientId(e.target.value)}
                  placeholder="xxxx-xxxx.apps.googleusercontent.com"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#09090b',
                    border: '1px solid #27272a',
                    color: '#fafafa',
                    fontSize: '0.88rem',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginTop: 4 }}>
                  Mẹo: Bạn có thể nhập mã này tại đây hoặc cài đặt vĩnh viễn trong Cài đặt hệ thống.
                </span>
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={!manualClientId.trim()}
              >
                Chuyển Sang Đăng Nhập Google
              </Button>
            </form>
          </div>
        </div>
      )}

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
    </>
  );
};

export default SocialAuthButtons;
