import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineViewColumns,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal create custom section
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newKey, setNewKey] = useState('');

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await landingService.getAdminLandingSections();
      setSections(data.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleActive = async (sec: LandingSection) => {
    const updated = !sec.is_active;
    try {
      await landingService.updateSection(sec.id, { is_active: updated });
      setSections(prev =>
        prev.map(s => (s.id === sec.id ? { ...s, is_active: updated } : s))
      );
      showToastMsg(`Đã ${updated ? 'bật' : 'tắt'} phần "${sec.title}"`);
    } catch {
      showToastMsg('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newArr = [...sections];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // re-assign orders
    const reordered = newArr.map((item, idx) => ({
      ...item,
      order: (idx + 1) * 10,
    }));
    setSections(reordered);

    try {
      setSaving(true);
      await landingService.reorderSections(
        reordered.map(s => ({ id: s.id, order: s.order }))
      );
      showToastMsg('Đã lưu thứ tự hiển thị mới');
    } catch {
      showToastMsg('Lỗi cập nhật thứ tự');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sec: LandingSection) => {
    if (!window.confirm(`Bạn có chắc muốn xoá phần "${sec.title}"?`)) return;
    try {
      await landingService.deleteSection(sec.id);
      setSections(prev => prev.filter(s => s.id !== sec.id));
      showToastMsg(`Đã xoá phần "${sec.title}"`);
    } catch {
      showToastMsg('Lỗi khi xoá phần');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Cảnh báo: Thao tác này sẽ khôi phục tất cả các phần về mẫu mặc định. Tiếp tục?')) return;
    try {
      setSaving(true);
      const res = await landingService.resetSections();
      setSections(res.sort((a, b) => a.order - b.order));
      showToastMsg('Đã khôi phục bố cục mặc định thành công');
    } catch {
      showToastMsg('Lỗi khi khôi phục bố cục');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const formattedKey = (newKey.trim() || `custom_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    try {
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) : 0;
      const created = await landingService.createSection({
        section_key: formattedKey,
        title: newTitle.trim(),
        order: maxOrder + 10,
        is_active: true,
        content: {
          headline: newTitle.trim(),
          body: 'Nội dung tuỳ chỉnh mới...',
        },
      });
      setSections(prev => [...prev, created]);
      setShowAddModal(false);
      setNewTitle('');
      setNewKey('');
      showToastMsg('Đã tạo thêm phần mới');
    } catch {
      showToastMsg('Lỗi khi tạo phần');
    }
  };

  // Helper mapping key to dedicated edit menu
  const getEditPath = (key: string) => {
    switch (key) {
      case 'hero':
        return '/admin/landing/hero';
      case 'features':
        return '/admin/landing/features';
      case 'models':
        return '/admin/landing/models';
      case 'developer':
        return '/admin/landing/developer';
      case 'pricing':
        return '/admin/landing/pricing';
      case 'testimonials':
      case 'partners':
        return '/admin/landing/testimonials';
      case 'cta_banner':
        return '/admin/landing/cta';
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineViewColumns />
          </div>
          <div>
            <h1 className={styles.title}>Bố Cục & Sắp Xếp Trang Chủ</h1>
            <p className={styles.subtitle}>
              Kéo thả, đổi thứ tự hiển thị, bật/tắt hoặc thêm mới các phần nội dung của Landing Page.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={styles.btnSecondary}
            title="Xem trước Landing Page thật"
          >
            <HiOutlineEye /> Xem Trang Chủ <HiOutlineArrowTopRightOnSquare style={{ fontSize: '0.75rem' }} />
          </a>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleReset}
            disabled={saving || loading}
          >
            <HiOutlineArrowPath /> Khôi Phục Mặc Định
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowAddModal(true)}
          >
            <HiOutlinePlus /> Thêm Phần Mới
          </button>
        </div>
      </div>

      <div className={styles.bannerNotice}>
        <span>
          💡 <strong>Mẹo bố cục:</strong> Sử dụng các nút <strong>Lên / Xuống</strong> để sắp xếp vị trí hiển thị trên Trang Chủ. Các menu chuyên biệt bên trái giúp bạn chỉnh sửa chi tiết nội dung từng phần riêng biệt.
        </span>
      </div>

      {/* Sections List */}
      <div className={styles.editorCard}>
        <div className={styles.cardTitle}>
          <span>Danh Sách Các Khối ({sections.length})</span>
          {saving && <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>Đang lưu thay đổi...</span>}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Đang tải dữ liệu bố cục...
          </div>
        ) : (
          <div className={styles.sectionList}>
            {sections.map((sec, idx) => {
              const editPath = getEditPath(sec.section_key);
              return (
                <div
                  key={sec.id}
                  className={`${styles.sectionItemCard} ${!sec.is_active ? styles.inactive : ''}`}
                >
                  <div className={styles.leftGroup}>
                    <div className={styles.orderControls}>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0 || saving}
                        title="Di chuyển lên"
                      >
                        <HiOutlineChevronUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === sections.length - 1 || saving}
                        title="Di chuyển xuống"
                      >
                        <HiOutlineChevronDown />
                      </button>
                    </div>

                    <div className={styles.orderBadge}>#{idx + 1}</div>

                    <div className={styles.sectionMeta}>
                      <div className={styles.sectionTitle}>
                        {sec.title}
                        {!sec.is_active && (
                          <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 'normal' }}>
                            (Đang ẩn)
                          </span>
                        )}
                      </div>
                      <span className={styles.sectionKey}>{sec.section_key}</span>
                    </div>
                  </div>

                  <div className={styles.rightGroup}>
                    {/* Switch On/Off */}
                    <label className={styles.switchToggle} title={sec.is_active ? 'Đang bật' : 'Đang tắt'}>
                      <input
                        type="checkbox"
                        checked={sec.is_active}
                        onChange={() => handleToggleActive(sec)}
                      />
                      <span className={styles.slider}></span>
                    </label>

                    {/* Dedicated Edit Link if available */}
                    {editPath ? (
                      <Link to={editPath} className={styles.btnSecondary} style={{ padding: '0.45rem 0.85rem' }}>
                        <HiOutlinePencilSquare /> Chỉnh Sửa
                      </Link>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Custom</span>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDelete(sec)}
                      title="Xoá phần này"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Custom Section Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '1rem',
              padding: '1.75rem',
              width: '90%',
              maxWidth: '480px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>Thêm Khối Giao Diện Mới</h3>
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.fieldGroup}>
                <label>Tên hiển thị (Tiêu đề khối)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đội Ngũ Cố Vấn & Khách Hàng VIP"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>Mã định danh (Key)</label>
                <input
                  type="text"
                  placeholder="custom_team (tự động nếu để trống)"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                />
                <span className={styles.helpText}>Chữ thường, số và dấu gạch dưới</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowAddModal(false)}
                >
                  Huỷ
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Tạo Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default LandingSectionsPage;
