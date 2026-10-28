import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { HiOutlineCheck, HiOutlineSparkles, HiOutlineCreditCard } from 'react-icons/hi2';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import { billingService, type CreditPackageDto } from '@modules/billing/services/billingService';
import styles from '@assets/scss/client/client-pages.module.scss';

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [topupOpen, setTopupOpen] = useState(false);
  const [packages, setPackages] = useState<CreditPackageDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    billingService
      .getPublicPackages()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const subs = data.filter((p) => p.category !== 'TOPUP');
          setPackages(subs.length > 0 ? subs : data);
        }
      })
      .catch((err) => {
        console.error('Failed to load packages from database:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setTopupOpen(true);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>💳</span>
            {t('client_menu.subscription', 'Quản Lý Gói & Bảng Giá')}
          </h1>
          <p>{t('subscription.subtitle', 'Lựa chọn gói dịch vụ AI phù hợp nhất với nhu cầu sử dụng của bạn')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={handleAction}>
            <HiOutlineCreditCard /> {isAuthenticated ? t('subscription.topup_btn', 'Nạp Credit Ngay') : 'Đăng Nhập Để Nạp'}
          </button>
        </div>
      </div>

      {/* Current plan banner */}
      <div className={styles.contentCard} style={{ background: 'linear-gradient(135deg, #131a29 0%, #1a2238 100%)', borderColor: '#2d3b58' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {isAuthenticated ? t('subscription.current_plan', 'Gói Dịch Vụ Đang Dùng') : 'Ưu Đãi Trải Nghiệm'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {isAuthenticated ? (user?.tier || 'Free Member') : 'Tặng Ngay 1,000 Credits Khi Đăng Ký'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
              {isAuthenticated ? (
                <>Số dư tài khoản: <strong>💎 {(user?.credit_balance ?? 0).toLocaleString()} credit</strong></>
              ) : (
                'Khởi tạo tài khoản miễn phí để thử nghiệm ngay 100+ mô hình AI hàng đầu thế giới.'
              )}
            </div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={handleAction}>
            <HiOutlineSparkles /> {isAuthenticated ? 'Nâng Cấp Gói Ngay' : 'Đăng Ký / Đăng Nhập'}
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Đang tải thông tin bảng giá từ máy chủ...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {packages.map((tier) => {
          const isUserCurrent = isAuthenticated && (user?.tier || 'Free Member').toLowerCase().includes(tier.name.toLowerCase());
          return (
            <div
              key={tier.id}
              className={styles.contentCard}
              style={{
                position: 'relative',
                borderColor: tier.is_popular ? '#ff6b35' : '#1e2638',
                boxShadow: tier.is_popular ? '0 10px 30px rgba(255, 107, 53, 0.15)' : undefined,
              }}
            >
              {tier.is_popular && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {tier.tag_badge || 'KHUYÊN DÙNG'}
                </span>
              )}

              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{tier.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.35rem 0 1rem' }}>
                {tier.description || 'Gói dịch vụ AI Gateway VeloX'}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>
                  {tier.price_vnd > 0 ? `${tier.price_vnd.toLocaleString()} đ` : '0 đ'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {tier.price_vnd === 0 ? '/mãi mãi' : '/tháng'}
                </span>
              </div>

              <div style={{ padding: '0.65rem 0.85rem', background: '#0e131e', borderRadius: '8px', marginBottom: '1.25rem', color: '#2dd4bf', fontWeight: 600, fontSize: '0.88rem' }}>
                💎 {tier.credits_given.toLocaleString()} credit/tháng
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {(tier.features || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <HiOutlineCheck color="#10b981" size={16} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={isUserCurrent ? styles.secondaryBtn : styles.primaryBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleAction}
              >
                {isAuthenticated ? (isUserCurrent ? 'Gói Hiện Tại' : 'Chọn Gói Này') : 'Bắt Đầu Ngay'}
              </button>
            </div>
          );
        })}
        </div>
      )}

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default SubscriptionPage;
