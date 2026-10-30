import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingPricingPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: 'Khối Bảng Giá & Câu Hỏi Thường Gặp',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    comparison_text: '',
    comparison_link: '',
    faq: [] as Array<{ q: string; a: string }>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const pri = all.find(s => s.section_key === 'pricing');
        if (pri) {
          setSection(pri);
          const c = pri.content || {};
          setFormData({
            title: pri.title || 'Khối Bảng Giá & Câu Hỏi Thường Gặp',
            is_active: pri.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            comparison_text: c.comparison_text || '',
            comparison_link: c.comparison_link || '',
            faq: Array.isArray(c.faq) ? c.faq : [],
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

  const handleFaqChange = (idx: number, field: 'q' | 'a', val: string) => {
    setFormData(prev => {
      const nextFaq = [...prev.faq];
      nextFaq[idx] = { ...nextFaq[idx], [field]: val };
      return { ...prev, faq: nextFaq };
    });
  };

  const handleAddFaq = () => {
    setFormData(prev => ({
      ...prev,
      faq: [
        ...prev.faq,
        {
          q: 'Câu hỏi mới?',
          a: 'Câu trả lời giải thích chi tiết cho người dùng...',
        },
      ],
    }));
  };

  const handleRemoveFaq = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== idx),
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
          comparison_text: formData.comparison_text,
          comparison_link: formData.comparison_link,
          faq: formData.faq,
        },
      });
      showToast('Đã lưu cấu hình Khối Bảng Giá & FAQ thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Pricing...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineCreditCard />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Bảng Giá & FAQ (Pricing)</h1>
            <p className={styles.subtitle}>
              Cấu hình tiêu đề bảng giá gói cước, thông điệp chi phí và bộ câu hỏi thường gặp (FAQ) trên Trang Chủ.
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
            <span>Trạng Thái & Tiêu Đề</span>
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
                placeholder="BẢNG GIÁ MINH BẠCH"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Nạp Bao Nhiêu Dùng Bấy Nhiêu..."
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Không cam kết hàng tháng bắt buộc. Tín dụng không thời hạn..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Chữ liên kết so sánh chi phí</label>
              <input
                type="text"
                value={formData.comparison_text}
                onChange={e => setFormData({ ...formData, comparison_text: e.target.value })}
                placeholder="So Sánh Chi Phí Tiết Kiệm Với Nhà Cung Cấp Gốc"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Đường dẫn liên kết so sánh</label>
              <input
                type="text"
                value={formData.comparison_link}
                onChange={e => setFormData({ ...formData, comparison_link: e.target.value })}
                placeholder="/pricing"
              />
            </div>
          </div>
        </div>

        <div className={styles.bannerNotice}>
          <span>
            ℹ️ <strong>Lưu ý:</strong> Danh sách các gói nạp thẻ (Credit Packages) hiển thị tại khối này được đồng bộ trực tiếp từ module <strong>Ví &amp; Thanh Toán &gt; Quản Lý Gói Nạp</strong>.
          </span>
        </div>

        {/* FAQ List */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Bộ Câu Hỏi Thường Gặp (FAQ) ({formData.faq.length})</span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleAddFaq}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <HiOutlinePlus /> Thêm Câu Hỏi
            </button>
          </div>

          <div className={styles.subItemList}>
            {formData.faq.map((item, idx) => (
              <div key={idx} className={styles.subItemCard}>
                <div className={styles.itemHeader}>
                  <span>Câu hỏi #{idx + 1}</span>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleRemoveFaq(idx)}
                    title="Xoá câu hỏi này"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
                <div className={styles.formGrid}>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label>Câu hỏi (Question)</label>
                    <input
                      type="text"
                      value={item.q}
                      onChange={e => handleFaqChange(idx, 'q', e.target.value)}
                      placeholder="Tín dụng có bị hết hạn sau 30 ngày không?"
                    />
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <label>Câu trả lời (Answer)</label>
                    <textarea
                      rows={2}
                      value={item.a}
                      onChange={e => handleFaqChange(idx, 'a', e.target.value)}
                      placeholder="Không. Toàn bộ số dư tín dụng nạp vào tài khoản có giá trị vĩnh viễn..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Bảng Giá'}
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

export default LandingPricingPage;
