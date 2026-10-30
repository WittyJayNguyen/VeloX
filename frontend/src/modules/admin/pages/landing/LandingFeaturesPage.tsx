import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineRectangleStack,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingFeaturesPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: 'Khối Tính Năng Nổi Bật',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    cards: [] as Array<{
      icon: string;
      title: string;
      desc: string;
      tag: string;
    }>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const feat = all.find(s => s.section_key === 'features');
        if (feat) {
          setSection(feat);
          const c = feat.content || {};
          setFormData({
            title: feat.title || 'Khối Tính Năng Nổi Bật',
            is_active: feat.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            cards: Array.isArray(c.cards) ? c.cards : [],
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

  const handleCardChange = (idx: number, field: string, val: string) => {
    setFormData(prev => {
      const nextCards = [...prev.cards];
      nextCards[idx] = { ...nextCards[idx], [field]: val };
      return { ...prev, cards: nextCards };
    });
  };

  const handleAddCard = () => {
    setFormData(prev => ({
      ...prev,
      cards: [
        ...prev.cards,
        {
          icon: 'cpu',
          title: 'Tính năng mới',
          desc: 'Mô tả chi tiết về tính năng và lợi ích mang lại cho khách hàng...',
          tag: 'Mới ra mắt',
        },
      ],
    }));
  };

  const handleRemoveCard = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== idx),
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
          badge: formData.badge,
          title: formData.section_title,
          subtitle: formData.subtitle,
          cards: formData.cards,
        },
      });
      showToast('Đã lưu thay đổi khối Tính Năng thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Tính Năng...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineRectangleStack />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Tính Năng Nổi Bật (Features)</h1>
            <p className={styles.subtitle}>
              Chỉnh sửa các thẻ giới thiệu kiến trúc, bộ đệm thông minh, cân bằng tải, bảo mật và tính năng cốt lõi.
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
              <label>Huy hiệu phân loại (Badge)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                placeholder="KIẾN TRÚC VƯỢT TRỘI"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Hạ Tầng AI Gateway Được Tối Ưu Tận Cùng"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả ngắn bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Được thiết kế cho các hệ thống tải cao..."
              />
            </div>
          </div>
        </div>

        {/* Feature Cards List */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Danh Sách Thẻ Tính Năng ({formData.cards.length})</span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleAddCard}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <HiOutlinePlus /> Thêm Thẻ Mới
            </button>
          </div>

          <div className={styles.subItemList}>
            {formData.cards.map((cd, idx) => (
              <div key={idx} className={styles.subItemCard}>
                <div className={styles.itemHeader}>
                  <span>Thẻ tính năng #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleRemoveCard(idx)}
                    title="Xoá thẻ này"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label>Loại Icon (bolt | cpu | shield | chart | globe | lock)</label>
                    <input
                      type="text"
                      value={cd.icon}
                      onChange={e => handleCardChange(idx, 'icon', e.target.value)}
                      placeholder="bolt"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label>Huy hiệu thẻ (Tag)</label>
                    <input
                      type="text"
                      value={cd.tag}
                      onChange={e => handleCardChange(idx, 'tag', e.target.value)}
                      placeholder="Tốc độ cao / Tiết kiệm 80%"
                    />
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label>Tiêu đề thẻ</label>
                    <input
                      type="text"
                      value={cd.title}
                      onChange={e => handleCardChange(idx, 'title', e.target.value)}
                      placeholder="Bộ Đệm Ngữ Nghĩa Semantic Caching"
                    />
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label>Mô tả chi tiết</label>
                    <textarea
                      rows={2}
                      value={cd.desc}
                      onChange={e => handleCardChange(idx, 'desc', e.target.value)}
                      placeholder="Tự động cache kết quả cho các prompt tương đồng..."
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
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Tính Năng'}
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

export default LandingFeaturesPage;
