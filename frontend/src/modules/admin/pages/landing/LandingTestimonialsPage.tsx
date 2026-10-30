import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingTestimonialsPage: React.FC = () => {
  const [partnerSec, setPartnerSec] = useState<LandingSection | null>(null);
  const [testiSec, setTestiSec] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Partners state
  const [partnerData, setPartnerData] = useState({
    title: 'Khối Đối Tác Tin Cậy',
    is_active: true,
    caption: '',
    items: [] as string[],
  });

  // Testimonials state
  const [testiData, setTestiData] = useState({
    title: 'Khối Đánh Giá Khách Hàng',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    reviews: [] as Array<{
      name: string;
      role: string;
      avatar: string;
      quote: string;
      rating: number;
    }>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const p = all.find(s => s.section_key === 'partners');
        if (p) {
          setPartnerSec(p);
          const c = p.content || {};
          setPartnerData({
            title: p.title || 'Khối Đối Tác Tin Cậy',
            is_active: p.is_active,
            caption: c.caption || '',
            items: Array.isArray(c.items) ? c.items : [],
          });
        }
        const tItem = all.find(s => s.section_key === 'testimonials');
        if (tItem) {
          setTestiSec(tItem);
          const c = tItem.content || {};
          setTestiData({
            title: tItem.title || 'Khối Đánh Giá Khách Hàng',
            is_active: tItem.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            reviews: Array.isArray(c.reviews) ? c.reviews : [],
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

  const handlePartnerItemChange = (idx: number, val: string) => {
    setPartnerData(prev => {
      const next = [...prev.items];
      next[idx] = val;
      return { ...prev, items: next };
    });
  };

  const handleAddPartnerItem = () => {
    setPartnerData(prev => ({
      ...prev,
      items: [...prev.items, 'Tên Đối Tác Mới'],
    }));
  };

  const handleRemovePartnerItem = (idx: number) => {
    setPartnerData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleReviewChange = (idx: number, field: string, val: any) => {
    setTestiData(prev => {
      const next = [...prev.reviews];
      next[idx] = { ...next[idx], [field]: val };
      return { ...prev, reviews: next };
    });
  };

  const handleAddReview = () => {
    setTestiData(prev => ({
      ...prev,
      reviews: [
        ...prev.reviews,
        {
          name: 'Khách Hàng Mới',
          role: 'Tech Lead / AI Engineer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          quote: 'VeloX giúp chúng tôi triển khai ứng dụng AI nhanh chóng với độ ổn định 100%...',
          rating: 5,
        },
      ],
    }));
  };

  const handleRemoveReview = (idx: number) => {
    setTestiData(prev => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (partnerSec) {
        await landingService.updateSection(partnerSec.id, {
          title: partnerData.title,
          is_active: partnerData.is_active,
          content: {
            caption: partnerData.caption,
            items: partnerData.items,
          },
        });
      }
      if (testiSec) {
        await landingService.updateSection(testiSec.id, {
          title: testiData.title,
          is_active: testiData.is_active,
          content: {
            badge: testiData.badge,
            title: testiData.section_title,
            subtitle: testiData.subtitle,
            reviews: testiData.reviews,
          },
        });
      }
      showToast('Đã lưu cấu hình Đối Tác & Đánh Giá thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Testimonials...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineChatBubbleBottomCenterText />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Đối Tác & Đánh Giá Khách Hàng</h1>
            <p className={styles.subtitle}>
              Chỉnh sửa thanh logo đối tác tin cậy và các lời bình luận, đánh giá chân thực từ khách hàng.
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
        {/* Partners Bar Section */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>1. Thanh Logo Đối Tác Tin Cậy (Partners Bar)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: partnerData.is_active ? '#34d399' : '#f87171' }}>
                {partnerData.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
              </span>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={partnerData.is_active}
                  onChange={e => setPartnerData({ ...partnerData, is_active: e.target.checked })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Dòng Chữ Dẫn (Caption)</label>
              <input
                type="text"
                value={partnerData.caption}
                onChange={e => setPartnerData({ ...partnerData, caption: e.target.value })}
                placeholder="ĐƯỢC TIN CẬY BỞI HƠN 10,000+ NHÀ PHÁT TRIỂN & DOANH NGHIỆP"
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>
                Danh sách thương hiệu đối tác ({partnerData.items.length})
              </span>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleAddPartnerItem}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              >
                <HiOutlinePlus /> Thêm Thương Hiệu
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {partnerData.items.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    padding: '0.3rem 0.6rem',
                  }}
                >
                  <input
                    type="text"
                    value={it}
                    onChange={e => handlePartnerItemChange(idx, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.85rem',
                      width: '120px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePartnerItem(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Reviews Section */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>2. Khối Đánh Giá Khách Hàng (Customer Reviews)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: testiData.is_active ? '#34d399' : '#f87171' }}>
                {testiData.is_active ? 'Đang hiển thị' : 'Đang ẩn'}
              </span>
              <label className={styles.switchToggle}>
                <input
                  type="checkbox"
                  checked={testiData.is_active}
                  onChange={e => setTestiData({ ...testiData, is_active: e.target.checked })}
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
                value={testiData.badge}
                onChange={e => setTestiData({ ...testiData, badge: e.target.value })}
                placeholder="KHÁCH HÀNG NÓI GÌ"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={testiData.section_title}
                onChange={e => setTestiData({ ...testiData, section_title: e.target.value })}
                placeholder="Được Đánh Giá Cao Bởi Cộng Đồng Công Nghệ"
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={testiData.subtitle}
                onChange={e => setTestiData({ ...testiData, subtitle: e.target.value })}
                placeholder="Hàng ngàn nhà phát triển và doanh nghiệp đã tăng tốc dự án..."
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                Danh Sách Đánh Giá ({testiData.reviews.length})
              </span>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleAddReview}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              >
                <HiOutlinePlus /> Thêm Lời Đánh Giá
              </button>
            </div>

            <div className={styles.subItemList}>
              {testiData.reviews.map((rev, idx) => (
                <div key={idx} className={styles.subItemCard}>
                  <div className={styles.itemHeader}>
                    <span>Lời nhận xét #{idx + 1}</span>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleRemoveReview(idx)}
                      title="Xoá nhận xét này"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}>
                      <label>Họ tên người đánh giá</label>
                      <input
                        type="text"
                        value={rev.name}
                        onChange={e => handleReviewChange(idx, 'name', e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Chức vụ / Công ty</label>
                      <input
                        type="text"
                        value={rev.role}
                        onChange={e => handleReviewChange(idx, 'role', e.target.value)}
                        placeholder="CTO @ Tech Startup"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Link Ảnh Avatar</label>
                      <input
                        type="text"
                        value={rev.avatar}
                        onChange={e => handleReviewChange(idx, 'avatar', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Số sao đánh giá (1 - 5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={rev.rating}
                        onChange={e => handleReviewChange(idx, 'rating', Number(e.target.value))}
                      />
                    </div>
                    <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                      <label>Lời nhận xét chi tiết (Quote)</label>
                      <textarea
                        rows={2}
                        value={rev.quote}
                        onChange={e => handleReviewChange(idx, 'quote', e.target.value)}
                        placeholder="VeloX giúp đội ngũ chúng tôi cắt giảm 70% chi phí..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Đối Tác & Đánh Giá'}
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

export default LandingTestimonialsPage;
