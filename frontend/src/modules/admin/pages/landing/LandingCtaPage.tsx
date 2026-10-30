import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineMegaphone,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingCtaPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: 'Khối Kêu Gọi Hành Động Cuối Trang',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    primary_cta_text: '',
    primary_cta_link: '',
    secondary_cta_text: '',
    secondary_cta_link: '',
    guarantee_text: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const cta = all.find(s => s.section_key === 'cta_banner');
        if (cta) {
          setSection(cta);
          const c = cta.content || {};
          setFormData({
            title: cta.title || 'Khối Kêu Gọi Hành Động Cuối Trang',
            is_active: cta.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            primary_cta_text: c.primary_cta_text || '',
            primary_cta_link: c.primary_cta_link || '',
            secondary_cta_text: c.secondary_cta_text || '',
            secondary_cta_link: c.secondary_cta_link || '',
            guarantee_text: c.guarantee_text || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section) return;
    try {
      setSaving(true);
      await landingService.updateSection(section.id, {
        title: formData.title,
        is_active: formData.is_active,
        content: {
          badge: formData.badge,
          title: formData.section_title,
          subtitle: formData.subtitle,
          primary_cta_text: formData.primary_cta_text,
          primary_cta_link: formData.primary_cta_link,
          secondary_cta_text: formData.secondary_cta_text,
          secondary_cta_link: formData.secondary_cta_link,
          guarantee_text: formData.guarantee_text,
        },
      });
      showToast('Đã lưu cấu hình Banner Kêu Gọi Hành Động thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình CTA...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineMegaphone />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Banner Kêu Gọi Hành Động (CTA Banner)</h1>
            <p className={styles.subtitle}>
              Chỉnh sửa thông điệp chốt hạ cuối trang, các nút đăng ký / liên hệ và dòng cam kết uy tín.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            <HiOutlineArrowLeft /> Quay Lại Bố Cục
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className={styles.btnSecondary}>
            <HiOutlineEye /> Xem Trang Chủ
          </a>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Trạng Thái & Nội Dung Banner</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: formData.is_active ? '#34d399' : '#f87171' }}>
                {formData.is_active ? 'Khối đang hiển thị' : 'Khối đang ẩn'}
              </span>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>Huy Hiệu (Badge)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                placeholder="BẮT ĐẦU NGAY HÔM NAY"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Sẵn Sàng Nâng Tầm Ứng Dụng AI Của Bạn?"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Đăng ký tài khoản trong 30 giây và nhận ngay 10,000 tín dụng..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Nút Đăng Ký (Chữ hiển thị)</label>
              <input
                type="text"
                value={formData.primary_cta_text}
                onChange={e => setFormData({ ...formData, primary_cta_text: e.target.value })}
                placeholder="Khởi Tạo Tài Khoản Miễn Phí"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường dẫn Nút Đăng Ký</label>
              <input
                type="text"
                value={formData.primary_cta_link}
                onChange={e => setFormData({ ...formData, primary_cta_link: e.target.value })}
                placeholder="/register"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Nút Phụ (Chữ hiển thị)</label>
              <input
                type="text"
                value={formData.secondary_cta_text}
                onChange={e => setFormData({ ...formData, secondary_cta_text: e.target.value })}
                placeholder="Liên Hệ Doanh Nghiệp"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường dẫn Nút Phụ</label>
              <input
                type="text"
                value={formData.secondary_cta_link}
                onChange={e => setFormData({ ...formData, secondary_cta_link: e.target.value })}
                placeholder="/contact"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Dòng cam kết uy tín (Guarantee note)</label>
              <input
                type="text"
                value={formData.guarantee_text}
                onChange={e => setFormData({ ...formData, guarantee_text: e.target.value })}
                placeholder="Không yêu cầu thẻ tín dụng quốc tế • Kích hoạt ngay lập tức"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi CTA'}
          </button>
        </div>
      </form>

      {toast && (
        <div className={styles.toastSuccess}>
          <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default LandingCtaPage;
