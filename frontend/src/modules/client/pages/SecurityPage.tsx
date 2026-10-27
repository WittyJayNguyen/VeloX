import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineShieldCheck, HiOutlineKey, HiOutlineDevicePhoneMobile, HiOutlineCheckCircle } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

export const SecurityPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setNotice(t('security.err_mismatch', 'Mật khẩu xác nhận không khớp!'));
      return;
    }
    if (newPass.length < 6) {
      setNotice(t('security.err_short', 'Mật khẩu phải từ 6 ký tự trở lên!'));
      return;
    }
    setNotice(t('security.success_pass', 'Đã đổi mật khẩu thành công!'));
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setNotice(null), 3000);
  };

  const toggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setNotice(
      !twoFactorEnabled
        ? t('security.2fa_enabled', 'Đã kích hoạt xác thực 2 lớp (2FA)!')
        : t('security.2fa_disabled', 'Đã tắt xác thực 2 lớp.')
    );
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>🛡️</span>
            {t('client_menu.security', 'Bảo Mật & 2FA')}
          </h1>
          <p>{t('security.subtitle', 'Tăng cường an toàn tài khoản với xác thực hai yếu tố và quản lý phiên đăng nhập')}</p>
        </div>
      </div>

      {notice && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{notice}</span>
        </div>
      )}

      {/* 2FA Section */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineDevicePhoneMobile /> {t('security.2fa_title', 'Xác Thực 2 Yếu Tố (2FA Authenticator)')}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          {t('security.2fa_desc', 'Bảo vệ tài khoản bằng ứng dụng Google Authenticator hoặc Authy khi đăng nhập.')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#0e131e', borderRadius: '12px', border: '1px solid #1f283d' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
              {twoFactorEnabled ? t('security.status_active', 'Trạng thái: Đang Bật') : t('security.status_inactive', 'Trạng thái: Đang Tắt')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {twoFactorEnabled ? 'TOTP code generator: Active' : 'TOTP code generator: Off'}
            </div>
          </div>
          <button
            type="button"
            className={twoFactorEnabled ? styles.secondaryBtn : styles.primaryBtn}
            onClick={toggle2FA}
          >
            {twoFactorEnabled ? t('security.turn_off', 'Tắt 2FA') : t('security.turn_on', 'Kích Hoạt 2FA')}
          </button>
        </div>

        {twoFactorEnabled && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '10px', border: '1px dashed #38bdf8' }}>
            <p style={{ fontSize: '0.85rem', color: '#bae6fd', margin: '0 0 0.5rem' }}>
              Quét mã QR trong ứng dụng Authenticator hoặc nhập khóa thủ công: <strong>VELOX-AUTH-SEC-2026</strong>
            </p>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineKey /> {t('security.change_pass_title', 'Đổi Mật Khẩu')}
        </h3>

        <form onSubmit={handlePasswordChange}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t('security.old_pass', 'Mật khẩu hiện tại')}</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('security.new_pass', 'Mật khẩu mới')}</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('security.confirm_pass', 'Xác nhận mật khẩu mới')}</label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.primaryBtn}>
              <HiOutlineShieldCheck /> {t('security.save_pass_btn', 'Cập Nhật Mật Khẩu')}
            </button>
          </div>
        </form>
      </div>

      {/* Active Sessions */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>{t('security.sessions_title', 'Phiên Đăng Nhập Hoạt Động')}</h3>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Thiết Bị & Trình Duyệt</th>
                <th>Địa Chỉ IP</th>
                <th>Vị Trí</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Chrome 122 (Windows 11)</strong></td>
                <td>221.121.1.3</td>
                <td>Hanoi, Vietnam</td>
                <td>Vừa xong</td>
                <td><span className={styles.badgeSuccess}>Phiên Hiện Tại</span></td>
              </tr>
              <tr>
                <td>Safari 17 (iPhone 15 Pro)</td>
                <td>118.70.14.88</td>
                <td>Ho Chi Minh, Vietnam</td>
                <td>2 giờ trước</td>
                <td><span className={styles.badgeWarning}>Hoạt động</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
