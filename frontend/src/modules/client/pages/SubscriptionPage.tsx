import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineCreditCard,
  HiOutlineBolt,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import { billingService, type CreditPackageDto } from '@modules/billing/services/billingService';
import styles from '@assets/scss/client/client-pages.module.scss';

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();
  const [packages, setPackages] = useState<CreditPackageDto[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTION' | 'TOPUP'>('SUBSCRIPTION');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    billingService
      .getPublicPackages()
      .then((data) => {
        if (isMounted && data) {
          setPackages(data);
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

  const handleAction = (pkgId?: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSelectedPackageId(pkgId);
    setTopupOpen(true);
  };

  const subscriptionPackages = packages.filter((p) => p.category !== 'TOPUP');
  const topupPackages = packages.filter((p) => p.category === 'TOPUP');
  const displayedPackages = activeTab === 'SUBSCRIPTION' ? subscriptionPackages : topupPackages;

  const getProductionCapability = (pkg: CreditPackageDto): string => {
    const cre = pkg.credits_given;
    if (cre <= 150) return '⚡ ~50 câu chat AI hoặc 4 ảnh chất lượng cao';
    if (cre <= 500) return '⚡ ~16 ảnh FLUX hoặc 5 video Kling 1080p';
    if (cre <= 1200) return '⚡ ~50 ảnh FLUX hoặc 600 câu chat thông minh';
    if (cre <= 2500) return '⚡ ~80 ảnh FLUX / 57 ảnh Midjourney 4K hoặc 26 video Kling';
    if (cre <= 4000) return '⚡ ~108 ảnh Midjourney 4K hoặc 50 video Full HD 1080p';
    if (cre <= 7000) return '⚡ ~150 ảnh 4K hoặc 73 video Full HD không chờ đợi';
    if (cre <= 15000) return '⚡ ~350 ảnh 4K hoặc 166 video thương mại điện ảnh';
    return '⚡ ~770 ảnh 4K hoặc 360 video AI băng thông riêng';
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>💳</span>
            {t('client_menu.subscription', 'Quản Lý Gói & Bảng Giá')}
          </h1>
          <p>{t('subscription.subtitle', 'Lựa chọn gói dịch vụ AI tối ưu nhất cho công việc và quy mô của bạn')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => handleAction()}>
            <HiOutlineCreditCard /> {isAuthenticated ? t('subscription.topup_btn', 'Nạp Credit Ngay') : 'Đăng Nhập Để Nạp'}
          </button>
        </div>
      </div>

      {/* Current plan banner */}
      <div className={styles.contentCard} style={{ background: 'linear-gradient(135deg, #131a29 0%, #1a2238 100%)', borderColor: '#2d3b58' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isAuthenticated ? t('subscription.current_plan', 'Gói Dịch Vụ Đang Dùng') : 'Ưu Đãi Trải Nghiệm Mới'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {isAuthenticated ? (user?.tier || 'Free Member') : 'Tặng Ngay 100 Credits Khi Đăng Ký'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
              {isAuthenticated ? (
                <>Số dư hiện tại: <strong style={{ color: '#38bdf8' }}>💎 {(user?.credit_balance ?? 0).toLocaleString()} Credits</strong></>
              ) : (
                'Khởi tạo tài khoản trải nghiệm ngay 115+ mô hình AI hàng đầu thế giới (Claude 3.5, Midjourney, Kling, FLUX).'
              )}
            </div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => handleAction()}>
            <HiOutlineSparkles /> {isAuthenticated ? 'Nâng Cấp Gói Ngay' : 'Đăng Ký / Đăng Nhập'}
          </button>
        </div>
      </div>

      {/* Tab Switcher: Gói Tháng vs Nạp Trực Tiếp */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            background: '#0e1422',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #1f293d',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('SUBSCRIPTION')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              background: activeTab === 'SUBSCRIPTION' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'SUBSCRIPTION' ? '#fff' : '#94a3b8',
              boxShadow: activeTab === 'SUBSCRIPTION' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
            }}
          >
            <HiOutlineCalendarDays size={18} />
            Gói Hội Viên Tháng (Tiết kiệm 40%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TOPUP')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              background: activeTab === 'TOPUP' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'TOPUP' ? '#fff' : '#94a3b8',
              boxShadow: activeTab === 'TOPUP' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            <HiOutlineBolt size={18} />
            Nạp Credit VietQR (Vĩnh viễn không hết hạn)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
          Đang tải thông tin bảng giá cập nhật từ hệ thống...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          {displayedPackages.map((tier) => {
            const isUserCurrent =
              isAuthenticated &&
              activeTab === 'SUBSCRIPTION' &&
              (user?.tier || 'Free Member').toLowerCase().includes(tier.name.toLowerCase());
            const discountPercent =
              tier.original_price_vnd && tier.original_price_vnd > tier.price_vnd
                ? Math.round(((tier.original_price_vnd - tier.price_vnd) / tier.original_price_vnd) * 100)
                : 0;

            return (
              <div
                key={tier.id}
                className={styles.contentCard}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: tier.is_popular ? '#ff6b35' : '#1e2638',
                  background: tier.is_popular
                    ? 'linear-gradient(180deg, rgba(255, 107, 53, 0.05) 0%, rgba(17, 24, 39, 1) 100%)'
                    : undefined,
                  boxShadow: tier.is_popular ? '0 12px 36px rgba(255, 107, 53, 0.18)' : undefined,
                }}
              >
                {/* Popular or Custom Badge */}
                {tier.is_popular && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {tier.tag_badge || 'KHUYÊN DÙNG'}
                  </span>
                )}

                {/* Non-popular badge */}
                {!tier.is_popular && tier.tag_badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: '#1e293b',
                      color: '#38bdf8',
                      border: '1px solid #334155',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    {tier.tag_badge}
                  </span>
                )}

                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{tier.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.35rem 0 1rem', minHeight: '38px' }}>
                  {tier.description || 'Gói dịch vụ AI Gateway VeloX'}
                </div>

                {/* Pricing Area */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>
                    {tier.price_vnd > 0 ? `${tier.price_vnd.toLocaleString()} đ` : '0 đ'}
                  </span>
                  {tier.original_price_vnd && tier.original_price_vnd > tier.price_vnd && (
                    <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                      {tier.original_price_vnd.toLocaleString()} đ
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      -{discountPercent}%
                    </span>
                  )}
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    {tier.category === 'TOPUP' ? '' : tier.price_vnd === 0 ? '/vĩnh viễn' : '/tháng'}
                  </span>
                </div>

                {/* Credit Quota & Production Capacity */}
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: '#090d16',
                    border: '1px solid #1a2234',
                    borderRadius: '8px',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ color: '#2dd4bf', fontWeight: 700, fontSize: '0.95rem' }}>
                    💎 {tier.credits_given.toLocaleString()} Credits {tier.category === 'TOPUP' ? 'vĩnh viễn' : '/tháng'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', fontWeight: 500 }}>
                    {getProductionCapability(tier)}
                  </div>
                </div>

                {/* Feature List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem', flex: 1 }}>
                  {(tier.features || []).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <HiOutlineCheck color="#10b981" size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA Button */}
                <button
                  type="button"
                  className={isUserCurrent ? styles.secondaryBtn : styles.primaryBtn}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: tier.is_popular ? 'linear-gradient(135deg, #ff6b35 0%, #e0531c 100%)' : undefined,
                  }}
                  onClick={() => handleAction(tier.id)}
                >
                  {isAuthenticated ? (isUserCurrent ? 'Gói Hiện Tại' : 'Chọn Gói Này') : 'Bắt Đầu Ngay'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} initialPackageId={selectedPackageId} />
    </div>
  );
};

export default SubscriptionPage;
