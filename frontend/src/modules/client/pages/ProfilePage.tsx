import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { HiOutlineUser, HiOutlineCheckCircle, HiOutlineSparkles } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || 'Hải源海');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>👤</span>
            {t('client_menu.profile', 'Hồ Sơ & Cài Đặt')}
          </h1>
          <p>{t('profile.subtitle', 'Quản lý thông tin tài khoản cá nhân và thông tin thành viên VeloX')}</p>
        </div>
      </div>

      {savedSuccess && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{t('profile.save_success', 'Cập nhật thông tin tài khoản thành công!')}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('profile.balance_label', 'Số Dư Credit')}</div>
            <div className={styles.statValue}>{(user?.credit_balance ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⭐</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('profile.tier_label', 'Gói Dịch Vụ')}</div>
            <div className={styles.statValue}>{user?.tier || 'Free Member'}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🛡️</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('profile.role_label', 'Quyền Hạn')}</div>
            <div className={styles.statValue}>{user?.roles?.[0] || 'ROLE_USER'}</div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineUser /> {t('profile.personal_info', 'Thông Tin Cá Nhân')}
        </h3>

        <form onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t('profile.full_name', 'Họ và tên')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('profile.email', 'Địa chỉ Email (Định danh)')}</label>
              <input
                type="email"
                value={user?.email || 'haiyuanhai9@gmail.com'}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('profile.avatar_url', 'Link Ảnh Đại Diện (Avatar URL)')}</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('profile.created_at', 'Ngày Tham Gia')}</label>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026-01-15'}
                disabled
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.primaryBtn}>
              <HiOutlineSparkles /> {t('profile.save_btn', 'Lưu Thay Đổi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
