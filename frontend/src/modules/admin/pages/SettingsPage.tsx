import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineCog6Tooth,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlinePhoto,
  HiOutlineTrash,
  HiOutlineArrowUpTray,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Card } from '@modules/core/design-system/Card';
import { Toggle } from '@modules/core/design-system/Components';
import { useSystemStore } from '@modules/core/states/systemStore';
import apiClient from '@modules/core/lib/apiClient';
import styles from './SettingsPage.module.scss';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

const SettingsPage = () => {
  const {
    siteName: storeSiteName,
    siteDesc: storeSiteDesc,
    brandLogoUrl: storeLogoUrl,
    maintenanceMode: storeMaintenance,
    maintenanceMessage: storeMaintenanceMsg,
    updateSettings,
    uploadLogo,
    resetLogo,
  } = useSystemStore();

  const [siteName, setSiteName] = useState(storeSiteName || 'VeloX AI Gateway');
  const [siteTitle, setSiteTitle] = useState('VeloX — AI Studio & Gateway');
  const [siteDesc, setSiteDesc] = useState(storeSiteDesc || 'Nền tảng trung gian AI Gateway thế hệ mới');
  const [logoPreview, setLogoPreview] = useState<string | null>(storeLogoUrl || null);
  const [defaultLang, setDefaultLang] = useState('vi');
  const [maintenanceMode, setMaintenanceMode] = useState(storeMaintenance || false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    storeMaintenanceMsg || 'Hệ thống đang trong thời gian bảo trì nâng cấp. Mọi tiến trình AI và API tạm dừng. Vui lòng quay lại sau!'
  );
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load latest settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiClient.get<any>('/system/settings');
        if (res && res.data) {
          const d = res.data;
          setSiteName(d.site_name || 'VeloX AI Gateway');
          setSiteTitle(d.site_title || 'VeloX — AI Studio & Gateway');
          setSiteDesc(d.site_desc || '');
          setLogoPreview(d.brand_logo_url || null);
          setDefaultLang(d.default_lang || 'vi');
          setMaintenanceMode(Boolean(d.maintenance_mode));
          setMaintenanceMessage(d.maintenance_message || '');
          setAutoBackup(Boolean(d.auto_backup));
          setEmailNotif(Boolean(d.email_notif));
          setWebhookUrl(d.webhook_url || '');
        }
      } catch {
        // Fallback to store
      }
    };
    loadSettings();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const newUrl = await uploadLogo(file);
      setLogoPreview(newUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Lỗi khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetLogo = async () => {
    try {
      setIsUploading(true);
      await resetLogo();
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg('Không thể xoá logo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      await updateSettings({
        site_name: siteName,
        site_title: siteTitle,
        site_desc: siteDesc,
        brand_logo_url: logoPreview,
        default_lang: defaultLang,
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage,
        auto_backup: autoBackup,
        email_notif: emailNotif,
        webhook_url: webhookUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Lưu cài đặt thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── 1. THƯƠNG HIỆU & LOGO ── */}
      <Card
        title="Nhận Diện Thương Hiệu & Logo"
        headerRight={<HiOutlinePhoto size={20} style={{ color: '#6366f1' }} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Logo Upload Section */}
          <div className={styles.logoUploadContainer}>
            <div className={styles.logoPreviewBox}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Thương Hiệu" />
              ) : (
                <HiOutlineSparkles size={36} className={styles.defaultLogoIcon} />
              )}
            </div>

            <div className={styles.logoUploadActions}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                Logo Hệ Thống
              </div>
              <div className={styles.uploadHint}>
                Tải lên file ảnh logo dạng PNG, JPG, SVG hoặc WebP (tối đa 5MB). Logo sẽ tự động cập nhật trên toàn hệ thống (Thanh tiêu đề, Footer và Trang chủ).
              </div>

              <div className={styles.btnGroup}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInputHidden}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <HiOutlineArrowUpTray size={16} />
                  {isUploading ? 'Đang tải lên...' : logoPreview ? 'Thay đổi Logo' : 'Tải lên Logo mới'}
                </Button>

                {logoPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    onClick={handleResetLogo}
                    style={{ color: '#ef4444' }}
                  >
                    <HiOutlineTrash size={16} />
                    Đặt lại Logo mặc định
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Tên Thương Hiệu (Brand Name)"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Ví dụ: VeloX AI Gateway"
            fullWidth
          />

          <Input
            label="Tiêu Đề Trình Duyệt (Browser Tab Title)"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="Ví dụ: VeloX — AI Studio & Gateway"
            fullWidth
          />

          <Input
            label="Mô Tả Hệ Thống (Slogan)"
            value={siteDesc}
            onChange={(e) => setSiteDesc(e.target.value)}
            placeholder="Ví dụ: Nền tảng trung gian AI Gateway thế hệ mới"
            fullWidth
          />

          <Select
            label="Ngôn Ngữ Mặc Định"
            options={LANG_OPTIONS}
            value={defaultLang}
            onChange={(e) => setDefaultLang(e.target.value)}
            fullWidth
          />
        </div>
      </Card>

      {/* ── 2. CHẾ ĐỘ BẢO TRÌ & VẬN HÀNH ── */}
      <Card
        title="Chế Độ Bảo Trì & Vận Hành Hệ Thống"
        headerRight={<HiOutlineShieldCheck size={20} style={{ color: maintenanceMode ? '#ef4444' : '#10b981' }} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Toggle
            label="Bật Chế Độ Bảo Trì Toàn Hệ Thống (Maintenance Mode)"
            checked={maintenanceMode}
            onChange={setMaintenanceMode}
          />

          {maintenanceMode ? (
            <div className={styles.maintenanceWarningBox}>
              <HiOutlineExclamationTriangle size={24} className={styles.warningIcon} />
              <div>
                <div className={styles.warningTitle}>⚠️ HỆ THỐNG ĐANG TRONG TRẠNG THÁI BẢO TRÌ!</div>
                <div className={styles.warningDesc}>
                  Khi chế độ bảo trì được BẬT:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li><strong>Dòng chữ chạy cảnh báo (Marquee ticker bar)</strong> sẽ xuất hiện cố định ngay dưới Header trên tất cả các trang.</li>
                    <li><strong>Toàn bộ tiến trình tạo Job AI</strong> (Ảnh, Video, Âm thanh ở Studio / Chat) của người dùng thông thường sẽ tạm dừng tiếp nhận.</li>
                    <li><strong>Mọi API proxy</strong> gửi lên Gateway sẽ bị chặn với mã trạng thái <code>503 Service Unavailable</code>.</li>
                    <li>Tài khoản Super Admin vẫn có thể truy cập để kiểm thử và vận hành.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.maintenanceNormalBox}>
              <HiOutlineCheckCircle size={20} className={styles.normalIcon} />
              <div className={styles.normalText}>
                Hệ thống đang hoạt động bình thường. Tất cả tính năng tạo AI, Studio và API Gateway sẵn sàng phục vụ.
              </div>
            </div>
          )}

          <Input
            label="Thông Điệp Bảo Trì Gửi Đến Người Dùng (Hiển thị trên dòng chữ chạy & thông báo)"
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Nhập thông điệp bảo trì hiển thị trên toàn hệ thống..."
            fullWidth
          />

          <Toggle
            label="Tự Động Sao Lưu Dữ Liệu Hàng Ngày"
            checked={autoBackup}
            onChange={setAutoBackup}
          />
        </div>
      </Card>

      {/* ── 3. THÔNG BÁO & WEBHOOK ── */}
      <Card
        title="Thông Báo & Kênh Tích Hợp"
        headerRight={<HiOutlineBell size={20} style={{ color: '#f59e0b' }} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle
            label="Email Thông Báo Khi Có Sự Cố"
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <Input
            label="Webhook URL (Slack / Discord / Telegram Webhook)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            fullWidth
          />
        </div>
      </Card>

      {/* ── FLOATING SAVE BAR ── */}
      <div className={styles.saveFloatingBar}>
        <div>
          {saveSuccess && (
            <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineCheckCircle size={18} /> Đã lưu và đồng bộ cài đặt thành công!
            </span>
          )}
          {errorMsg && (
            <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={isSaving}
          onClick={handleSave}
        >
          <HiOutlineCog6Tooth size={18} />
          {isSaving ? 'Đang lưu cài đặt...' : 'Lưu Thay Đổi Cài Đặt'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
