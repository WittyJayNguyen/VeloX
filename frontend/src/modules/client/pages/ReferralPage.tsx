import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineGift, HiOutlineDocumentDuplicate, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import styles from '@assets/scss/client/client-pages.module.scss';

export const ReferralPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const refCode = user?.id ? `VLX${user.id.slice(-4).toUpperCase()}` : 'VLXHAI';
  const refLink = `https://velox.nexoratech.com.vn?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>🎁</span>
            {t('client_menu.referral', 'Giới Thiệu Bạn Bè & Nhận Thưởng')}
          </h1>
          <p>{t('referral.subtitle', 'Mời bạn bè cùng trải nghiệm VeloX và nhận ngay 20% hoa hồng Credit trọn đời cho mỗi lượt nạp')}</p>
        </div>
      </div>

      {copied && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{t('referral.copied_notice', 'Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!')}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Bạn Bè Đã Mời</div>
            <div className={styles.statValue}>18 người</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Credit Thưởng Nhận Đực</div>
            <div className={styles.statValue}>+3,650 cr</div>
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

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineGift /> Liên Kết & Mã Giới Thiệu Của Bạn
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0e131e', padding: '1rem', borderRadius: '12px', border: '1px solid #1f283d' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mã Giới Thiệu Cá Nhân</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>{refCode}</div>
          </div>

          <div style={{ background: '#0e131e', padding: '1rem', borderRadius: '12px', border: '1px solid #1f283d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Đường Dẫn Đăng Ký Trực Tiếp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
              <input
                type="text"
                readOnly
                value={refLink}
                style={{ flex: 1, background: '#161d2d', border: '1px solid #243048', color: '#cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.84rem' }}
              />
              <button type="button" className={styles.primaryBtn} onClick={handleCopy} style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                <HiOutlineDocumentDuplicate /> {copied ? 'Đã Chép' : 'Sao Chép'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(255, 107, 53, 0.08)', borderRadius: '10px', border: '1px dashed #ff6b35', fontSize: '0.88rem', color: '#ffd7c2' }}>
          <strong>💡 Cơ chế trả thưởng:</strong> Khi người dùng đăng ký qua link của bạn, họ nhận ngay 100 Credit trải nghiệm và bạn nhận 20% số credit mỗi lần họ nạp tiền thành công!
        </div>
      </div>

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>Danh Sách Bạn Bè Đã Giới Thiệu</h3>
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
              <tr>
                <td><strong>nguyen.tuan***@gmail.com</strong></td>
                <td>2026-10-25</td>
                <td>2 đơn</td>
                <td><strong style={{ color: '#2dd4bf' }}>+700 💎</strong></td>
                <td><span className={styles.badgeSuccess}>Hoạt động</span></td>
              </tr>
              <tr>
                <td><strong>linh.fitness***@gmail.com</strong></td>
                <td>2026-10-22</td>
                <td>4 đơn</td>
                <td><strong style={{ color: '#2dd4bf' }}>+1,500 💎</strong></td>
                <td><span className={styles.badgeSuccess}>Hoạt động</span></td>
              </tr>
              <tr>
                <td><strong>duy.tran***@yahoo.com</strong></td>
                <td>2026-10-18</td>
                <td>1 đơn</td>
                <td><strong style={{ color: '#2dd4bf' }}>+200 💎</strong></td>
                <td><span className={styles.badgeSuccess}>Hoạt động</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
