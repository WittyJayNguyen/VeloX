import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDownTray, HiOutlineSparkles, HiOutlineCheckCircle } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

export const DownloadsPage: React.FC = () => {
  const { t } = useTranslation();

  const handleDownload = (platform: string) => {
    alert(`Đang khởi tạo tải xuống bản cài đặt VeloX Desktop cho ${platform}! (v2.4.0)`);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>💻</span>
            {t('client_menu.downloads', 'Tải Ứng Dụng VeloX Cho Máy Tính (PC & Mac)')}
          </h1>
          <p>{t('downloads.subtitle', 'Trải nghiệm sức mạnh AI Gateway trực tiếp trên màn hình máy tính với phím tắt tức thời')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Windows */}
        <div className={styles.contentCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🪟</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem' }}>Windows 10 / 11</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem' }}>Bản cài đặt 64-bit chính thức (.exe / .msi)</p>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>Phiên bản v2.4.0 • 85 MB</div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => handleDownload('Windows')} style={{ width: '100%', justifyContent: 'center' }}>
            <HiOutlineArrowDownTray /> Tải Cho Windows (.exe)
          </button>
        </div>

        {/* macOS */}
        <div className={styles.contentCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: '#38bdf8' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🍎</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem' }}>macOS (Apple Silicon & Intel)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem' }}>Hỗ trợ tối ưu cho chip M1/M2/M3/M4 & Intel</p>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>Phiên bản v2.4.0 Universal • 92 MB</div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => handleDownload('macOS')} style={{ width: '100%', justifyContent: 'center' }}>
            <HiOutlineArrowDownTray /> Tải Cho macOS (.dmg)
          </button>
        </div>

        {/* Linux */}
        <div className={styles.contentCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🐧</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.35rem' }}>Linux (Ubuntu / Fedora / Arch)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem' }}>Đóng gói AppImage & .deb độc lập</p>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1.25rem' }}>Phiên bản v2.4.0 • 78 MB</div>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={() => handleDownload('Linux')} style={{ width: '100%', justifyContent: 'center' }}>
            <HiOutlineArrowDownTray /> Tải Bản AppImage (.bin)
          </button>
        </div>
      </div>

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineSparkles /> Tính Năng Nổi Bật Của VeloX Desktop App
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <HiOutlineCheckCircle color="#10b981" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Phím Tắt Toàn Cục (Alt + Space)</strong>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '3px 0 0' }}>Bật hộp thoại AI Chat nhanh chóng tại bất kỳ cửa sổ làm việc nào.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <HiOutlineCheckCircle color="#10b981" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Chụp & Nhận Diện Ảnh OCR</strong>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '3px 0 0' }}>Kéo chọn vùng màn hình để dịch hoặc hỏi đáp dữ liệu tức thì.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <HiOutlineCheckCircle color="#10b981" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Tích Hợp Khay Hệ Thống (System Tray)</strong>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '3px 0 0' }}>Tiết kiệm RAM tối đa, chạy nền sẵn sàng phục vụ 24/7.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
