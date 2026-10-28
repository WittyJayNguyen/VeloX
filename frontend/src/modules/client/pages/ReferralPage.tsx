import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineGift,
  HiOutlineDocumentDuplicate,
  HiOutlineCheckCircle,
  HiOutlineShare,
  HiOutlineUserPlus,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import styles from '@assets/scss/client/client-pages.module.scss';

interface ReferralRecord {
  id: string;
  email: string;
  date: string;
  ordersCount: number;
  rewardEarned: number;
  status: 'Hoạt động' | 'Chờ nạp';
}

export const ReferralPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Invite by email test
  const [inviteEmail, setInviteEmail] = useState('');
  const [refList, setRefList] = useState<ReferralRecord[]>(() => {
    const saved = localStorage.getItem('velox_referral_list');
    return saved ? JSON.parse(saved) : [];
  });

  const refCode = (user as any)?.user_code || (user?.id ? `VLX${user.id.slice(-5).toUpperCase()}` : 'VLXPRO');
  const refLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${refCode}`
    : `https://velox.nexoratech.com.vn/register?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newRecord: ReferralRecord = {
      id: `ref_${Date.now()}`,
      email: inviteEmail.trim(),
      date: new Date().toISOString().split('T')[0],
      ordersCount: 0,
      rewardEarned: 0,
      status: 'Chờ nạp',
    };

    const updated = [newRecord, ...refList];
    setRefList(updated);
    localStorage.setItem('velox_referral_list', JSON.stringify(updated));

    setInviteEmail('');
    setToast(`Đã gửi lời mời tham gia VeloX tới ${newRecord.email}!`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleShareSocial = (platform: 'telegram' | 'facebook') => {
    const text = encodeURIComponent(
      t('referral.share_caption', 'Trải nghiệm VeloX AI Gateway - Nền tảng AI tốc độ cao đa mô hình. Đăng ký qua link và nạp gói đầu tiên để nhận ngay 100 Credit trải nghiệm:')
    );
    const url = encodeURIComponent(refLink);
    if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  const totalRewards = refList.reduce((acc, cur) => acc + cur.rewardEarned, 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>🎁</span>
            {t('client_menu.referral', 'Giới Thiệu Bạn Bè & Nhận Thưởng')}
          </h1>
          <p>{t('referral.subtitle', 'Mời bạn bè cùng trải nghiệm VeloX: nhận ngay 100 Credit khi nạp gói đầu tiên và bạn nhận ngay 20% hoa hồng Credit trọn đời cho mỗi lượt nạp')}</p>
        </div>
      </div>

      {copied && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{t('referral.copied_notice', 'Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!')}</span>
        </div>
      )}

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Bạn Bè Đã Mời</div>
            <div className={styles.statValue}>{refList.length} người</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Credit Thưởng Nhận Được</div>
            <div className={styles.statValue} style={{ color: '#2dd4bf' }}>
              +{totalRewards.toLocaleString()} cr
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🏷️</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tỷ Lệ Hoa Hồng</div>
            <div className={styles.statValue} style={{ color: '#ff6b35' }}>20%</div>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineGift /> Liên Kết & Mã Giới Thiệu Của Bạn
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#0e131e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1f283d' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mã Giới Thiệu Cá Nhân</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>{refCode}</div>
          </div>

          <div style={{ background: '#0e131e', padding: '1.25rem', borderRadius: '12px', border: '1px solid #1f283d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Đường Dẫn Đăng Ký Trực Tiếp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
              <input
                type="text"
                readOnly
                value={refLink}
                style={{ flex: 1, background: '#161d2d', border: '1px solid #243048', color: '#cbd5e1', padding: '8px 10px', borderRadius: '6px', fontSize: '0.84rem' }}
              />
              <button type="button" className={styles.primaryBtn} onClick={handleCopy} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                <HiOutlineDocumentDuplicate /> {copied ? 'Đã Chép' : 'Sao Chép'}
              </button>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HiOutlineShare /> Chia sẻ nhanh:
          </span>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleShareSocial('telegram')}
            style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#0088cc22', borderColor: '#0088cc', color: '#38bdf8' }}
          >
            Telegram
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleShareSocial('facebook')}
            style={{ padding: '6px 12px', fontSize: '0.82rem', background: '#1877f222', borderColor: '#1877f2', color: '#60a5fa' }}
          >
            Facebook
          </button>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255, 107, 53, 0.08)', borderRadius: '10px', border: '1px dashed #ff6b35', fontSize: '0.88rem', color: '#ffd7c2' }}>
          <strong>💡 {t('referral.reward_mechanism_title', 'Cơ chế trả thưởng:')}</strong>{' '}
          {t('referral.reward_mechanism_desc', 'Khi người dùng đăng ký qua link của bạn và hoàn tất nạp gói lần đầu tiên, họ nhận ngay 100 Credit trải nghiệm và bạn nhận 20% số credit mỗi lần họ nạp tiền thành công!')}
        </div>
      </div>

      {/* Invite Direct by Email */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineUserPlus /> Gửi Thư Mời Bạn Bè Trực Tiếp
        </h3>
        <form onSubmit={handleSendEmailInvite} style={{ display: 'flex', gap: '10px', maxWidth: '540px' }}>
          <input
            type="email"
            required
            placeholder="friend@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{
              flex: 1,
              background: '#090d16',
              border: '1px solid #334155',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          />
          <button type="submit" className={styles.primaryBtn}>
            <HiOutlineSparkles /> Gửi Lời Mời
          </button>
        </form>
      </div>

      {/* Referral List */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>Danh Sách Bạn Bè Đã Giới Thiệu</h3>
        {refList.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#0a0e17', borderRadius: '12px', border: '1px dashed #243048' }}>
            <HiOutlineGift size={40} style={{ color: '#475569', marginBottom: '0.75rem' }} />
            <h4 style={{ color: '#e2e8f0', margin: '0 0 0.5rem' }}>Chưa có bạn bè nào đăng ký</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
              {t('referral.empty_hint', 'Hãy chia sẻ mã giới thiệu {{refCode}} của bạn để bạn bè nhận 100 Credit khi nạp gói đầu tiên và bạn nhận ngay 20% hoa hồng trọn đời!', { refCode })}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Người Dùng</th>
                  <th>Ngày Đăng Ký</th>
                  <th>Tổng Số Đơn</th>
                  <th>Hoa Hồng Bạn Nhận</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {refList.map((ref) => (
                  <tr key={ref.id}>
                    <td><strong>{ref.email}</strong></td>
                    <td>{ref.date}</td>
                    <td>{ref.ordersCount} đơn</td>
                    <td>
                      <strong style={{ color: ref.rewardEarned > 0 ? '#2dd4bf' : '#94a3b8' }}>
                        +{ref.rewardEarned.toLocaleString()} 💎
                      </strong>
                    </td>
                    <td>
                      <span className={ref.status === 'Hoạt động' ? styles.badgeSuccess : styles.badgeWarning}>
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralPage;
