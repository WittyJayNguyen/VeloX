import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { HiOutlineCheck, HiOutlineSparkles, HiOutlineCreditCard } from 'react-icons/hi2';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from '@assets/scss/client/client-pages.module.scss';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  credits: string;
  features: string[];
  popular?: boolean;
  isCurrent?: boolean;
}

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [topupOpen, setTopupOpen] = useState(false);

  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '0 đ',
      period: '/mãi mãi',
      desc: 'Dành cho người mới bắt đầu trải nghiệm AI Gateway',
      credits: '1,000 credit/tháng',
      isCurrent: true,
      features: [
        'Truy cập GPT-4o-mini & Claude 3.5 Haiku',
        'Tốc độ xử lý tiêu chuẩn',
        '10 workflows cơ bản',
        'Hỗ trợ cộng đồng',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Creator',
      price: '199.000 đ',
      period: '/tháng',
      desc: 'Tối ưu cho cá nhân sáng tạo nội dung & nhà phát triển',
      credits: '15,000 credit/tháng',
      popular: true,
      features: [
        'Truy cập đầy đủ 100+ Model cao cấp (GPT-4o, Claude 3.5 Sonnet, Midjourney v6)',
        'Ưu tiên hàng đợi cao nhất, latency < 300ms',
        'Không giới hạn Workflows AI',
        'Tạo API Key cá nhân & kết nối MCP',
        'Hỗ trợ kỹ thuật 24/7',
      ],
    },
    {
      id: 'enterprise',
      name: 'Team & Business',
      price: '599.000 đ',
      period: '/tháng',
      desc: 'Giải pháp toàn diện cho đội nhóm & doanh nghiệp vừa',
      credits: '50,000 credit/tháng',
      features: [
        'Tất cả tính năng của gói Pro',
        'Workspace nhóm tối đa 20 thành viên',
        'Phân bổ hạn mức Credit độc lập cho từng nhân sự',
        'Custom Domain & Private Endpoint Gateway',
        'Cam kết SLA 99.9% Uptime',
      ],
    },
  ];

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
          <button type="button" className={styles.primaryBtn} onClick={() => setTopupOpen(true)}>
            <HiOutlineCreditCard /> {t('subscription.topup_btn', 'Nạp Credit Ngay')}
          </button>
        </div>
      </div>

      {/* Current plan banner */}
      <div className={styles.contentCard} style={{ background: 'linear-gradient(135deg, #131a29 0%, #1a2238 100%)', borderColor: '#2d3b58' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('subscription.current_plan', 'Gói Dịch Vụ Đang Dùng')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {user?.tier || 'Free Member'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
              Số dư tài khoản: <strong>💎 {(user?.credit_balance ?? 0).toLocaleString()} credit</strong>
            </div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => setTopupOpen(true)}>
            <HiOutlineSparkles /> Nâng Cấp Gói Ngay
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={styles.contentCard}
            style={{
              position: 'relative',
              borderColor: tier.popular ? '#ff6b35' : '#1e2638',
              boxShadow: tier.popular ? '0 10px 30px rgba(255, 107, 53, 0.15)' : undefined,
            }}
          >
            {tier.popular && (
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
                KHUYÊN DÙNG
              </span>
            )}

            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{tier.name}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.35rem 0 1rem' }}>{tier.desc}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{tier.price}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{tier.period}</span>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: '#0e131e', borderRadius: '8px', marginBottom: '1.25rem', color: '#2dd4bf', fontWeight: 600, fontSize: '0.88rem' }}>
              💎 {tier.credits}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {tier.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <HiOutlineCheck color="#10b981" size={16} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={tier.isCurrent ? styles.secondaryBtn : styles.primaryBtn}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setTopupOpen(true)}
            >
              {tier.isCurrent ? 'Gói Hiện Tại' : 'Chọn Gói Này'}
            </button>
          </div>
        ))}
      </div>

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default SubscriptionPage;
