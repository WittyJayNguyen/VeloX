import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingHeroPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: 'Khối Hero Banner',
    is_active: true,
    badge_text: '',
    badge_link: '',
    headline_prefix: '',
    headline_highlight: '',
    headline_suffix: '',
    description: '',
    primary_cta_text: '',
    primary_cta_link: '',
    secondary_cta_text: '',
    secondary_cta_link: '',
    stats: [] as Array<{ label: string; value: string; note: string }>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const hero = all.find(s => s.section_key === 'hero');
        if (hero) {
          setSection(hero);
          const c = hero.content || {};
          setFormData({
            title: hero.title || 'Khối Hero Banner',
            is_active: hero.is_active,
            badge_text: c.badge_text || '',
            badge_link: c.badge_link || '',
            headline_prefix: c.headline_prefix || '',
            headline_highlight: c.headline_highlight || '',
            headline_suffix: c.headline_suffix || '',
            description: c.description || '',
            primary_cta_text: c.primary_cta_text || '',
            primary_cta_link: c.primary_cta_link || '',
            secondary_cta_text: c.secondary_cta_text || '',
            secondary_cta_link: c.secondary_cta_link || '',
            stats: Array.isArray(c.stats) ? c.stats : [],
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

  const handleStatChange = (idx: number, field: string, val: string) => {
    setFormData(prev => {
      const nextStats = [...prev.stats];
      nextStats[idx] = { ...nextStats[idx], [field]: val };
      return { ...prev, stats: nextStats };
    });
  };

  const handleAddStat = () => {
    setFormData(prev => ({
      ...prev,
      stats: [...prev.stats, { label: 'Chỉ số mới', value: '100%', note: 'Ghi chú' }],
    }));
  };

  const handleRemoveStat = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== idx),
    }));
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
          badge_text: formData.badge_text,
          badge_link: formData.badge_link,
          headline_prefix: formData.headline_prefix,
          headline_highlight: formData.headline_highlight,
          headline_suffix: formData.headline_suffix,
          description: formData.description,
          primary_cta_text: formData.primary_cta_text,
          primary_cta_link: formData.primary_cta_link,
          secondary_cta_text: formData.secondary_cta_text,
          secondary_cta_link: formData.secondary_cta_link,
          stats: formData.stats,
        },
      });
      showToast('Đã lưu thay đổi khối Hero Banner thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Hero...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineSparkles />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Hero (Banner Đầu Trang)</h1>
            <p className={styles.subtitle}>
              Chỉnh sửa tiêu đề chính, hiệu ứng gradient, mô tả dịch vụ, nút kêu gọi hành động (CTA) và 3 chỉ số ấn tượng.
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
        {/* Basic section settings */}
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
              <label>Tên Khối Quản Trị</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Badge & Headline */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Tiêu Đề & Thông Điệp Nổi Bật</span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>Huy Hiệu (Badge Tag)</label>
              <input
                type="text"
                value={formData.badge_text}
                onChange={e => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="⚡ NỀN TẢNG AI GATEWAY DOANH NGHIỆP THẾ HỆ MỚI"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Liên kết Huy Hiệu (Link click)</label>
              <input
                type="text"
                value={formData.badge_link}
                onChange={e => setFormData({ ...formData, badge_link: e.target.value })}
                placeholder="/admin/models"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Dòng 1 (Trước Highlight)</label>
              <input
                type="text"
                value={formData.headline_prefix}
                onChange={e => setFormData({ ...formData, headline_prefix: e.target.value })}
                placeholder="Hạ Tầng AI Gateway"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Cụm Từ Nổi Bật (Gradient Tím - Hồng)</label>
              <input
                type="text"
                value={formData.headline_highlight}
                onChange={e => setFormData({ ...formData, headline_highlight: e.target.value })}
                placeholder="Siêu Tốc & Tối Ưu Chi Phí"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Tiêu Đề Dòng 2 (Sau Highlight)</label>
              <input
                type="text"
                value={formData.headline_suffix}
                onChange={e => setFormData({ ...formData, headline_suffix: e.target.value })}
                placeholder="Cho Doanh Nghiệp & Lập Trình Viên"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Đoạn Mô Tả Dưới Tiêu Đề</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tích hợp hơn 100+ mô hình ngôn ngữ lớn..."
              />
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Nút Kêu Gọi Hành Động (CTA Buttons)</span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label>Nút Chính (Primary CTA - Chữ hiển thị)</label>
              <input
                type="text"
                value={formData.primary_cta_text}
                onChange={e => setFormData({ ...formData, primary_cta_text: e.target.value })}
                placeholder="Trải Nghiệm Miễn Phí"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường Dẫn Nút Chính</label>
              <input
                type="text"
                value={formData.primary_cta_link}
                onChange={e => setFormData({ ...formData, primary_cta_link: e.target.value })}
                placeholder="/register"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Nút Phụ (Secondary CTA - Chữ hiển thị)</label>
              <input
                type="text"
                value={formData.secondary_cta_text}
                onChange={e => setFormData({ ...formData, secondary_cta_text: e.target.value })}
                placeholder="Tài Liệu API & SDK"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường Dẫn Nút Phụ</label>
              <input
                type="text"
                value={formData.secondary_cta_link}
                onChange={e => setFormData({ ...formData, secondary_cta_link: e.target.value })}
                placeholder="/api-docs"
              />
            </div>
          </div>
        </div>

        {/* Stats Metrics */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Các Chỉ Số Ấn Tượng ({formData.stats.length})</span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleAddStat}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <HiOutlinePlus /> Thêm Chỉ Số
            </button>
          </div>

          <div className={styles.subItemList}>
            {formData.stats.map((st, idx) => (
              <div key={idx} className={styles.subItemCard}>
                <div className={styles.itemHeader}>
                  <span>Chỉ số #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleRemoveStat(idx)}
                    title="Xoá chỉ số này"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Số liệu lớn (Value)</label>
                    <input
                      type="text"
                      value={st.value}
                      onChange={e => handleStatChange(idx, 'value', e.target.value)}
                      placeholder="99.99% hoặc 100+ hoặc < 50ms"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Nhãn hiển thị (Label)</label>
                    <input
                      type="text"
                      value={st.label}
                      onChange={e => handleStatChange(idx, 'label', e.target.value)}
                      placeholder="SLA Uptime Cao Cấp"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Ghi chú phụ (Note)</label>
                    <input
                      type="text"
                      value={st.note}
                      onChange={e => handleStatChange(idx, 'note', e.target.value)}
                      placeholder="Cam kết hợp đồng SLA"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Hero Banner'}
          </button>
        </div>
      </form>

      {/* Toast Alert */}
      {toast && (
        <div className={styles.toastSuccess}>
          <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default LandingHeroPage;
