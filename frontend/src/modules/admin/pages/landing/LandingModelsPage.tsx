import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCpuChip,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingModelsPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: 'Khối Mô Hình Tiêu Biểu',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    view_all_text: '',
    view_all_link: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const mod = all.find(s => s.section_key === 'models');
        if (mod) {
          setSection(mod);
          const c = mod.content || {};
          setFormData({
            title: mod.title || 'Khối Mô Hình Tiêu Biểu',
            is_active: mod.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            view_all_text: c.view_all_text || '',
            view_all_link: c.view_all_link || '',
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
          view_all_text: formData.view_all_text,
          view_all_link: formData.view_all_link,
        },
      });
      showToast('Đã lưu cấu hình Khối Mô Hình thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Models...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineCpuChip />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Tuyển Tập Mô Hình (Models Showcase)</h1>
            <p className={styles.subtitle}>
              Cấu hình tiêu đề, huy hiệu và liên kết dẫn đến kho 100+ mô hình AI trên Trang Chủ.
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
            <span>Trạng Thái & Định Danh</span>
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
                placeholder="KHO MÔ HÌNH TOÀN DIỆN"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Tuyển Tập Hơn 100+ Mô Hình AI Hàng Đầu"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Từ các mô hình lý luận thông minh nhất..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Nút Xem Tất Cả (Chữ hiển thị)</label>
              <input
                type="text"
                value={formData.view_all_text}
                onChange={e => setFormData({ ...formData, view_all_text: e.target.value })}
                placeholder="Xem Toàn Bộ 100+ Mô Hình"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường dẫn Nút Xem Tất Cả</label>
              <input
                type="text"
                value={formData.view_all_link}
                onChange={e => setFormData({ ...formData, view_all_link: e.target.value })}
                placeholder="/admin/models"
              />
            </div>
          </div>
        </div>

        <div className={styles.bannerNotice}>
          <span>
            ℹ️ <strong>Lưu ý:</strong> Dữ liệu các mô hình bên trong khối này được lấy tự động trực tiếp từ <strong>Quản Lý Mô Hình (Models Catalog)</strong>. Quản trị viên có thể vào menu <em>Gateway & Developer &gt; Quản Lý Mô Hình</em> để điều chỉnh giá, quota và trạng thái kích hoạt của từng model.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Mô Hình'}
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

export default LandingModelsPage;
