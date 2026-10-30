import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCommandLine,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { landingService, type LandingSection } from '@modules/admin/services/landingService';
import styles from '@assets/scss/admin/landing-admin.module.scss';

export const LandingDeveloperPage: React.FC = () => {
  const [section, setSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: 'Khối Dành Cho Lập Trình Viên',
    is_active: true,
    badge: '',
    section_title: '',
    subtitle: '',
    base_url: '',
    checkpoints: [] as string[],
    python_snippet: '',
    node_snippet: '',
    curl_snippet: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const all = await landingService.getAdminLandingSections();
        const dev = all.find(s => s.section_key === 'developer');
        if (dev) {
          setSection(dev);
          const c = dev.content || {};
          setFormData({
            title: dev.title || 'Khối Dành Cho Lập Trình Viên',
            is_active: dev.is_active,
            badge: c.badge || '',
            section_title: c.title || '',
            subtitle: c.subtitle || '',
            base_url: c.base_url || '',
            checkpoints: Array.isArray(c.checkpoints) ? c.checkpoints : [],
            python_snippet: c.python_snippet || '',
            node_snippet: c.node_snippet || '',
            curl_snippet: c.curl_snippet || '',
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

  const handleCheckpointChange = (idx: number, val: string) => {
    setFormData(prev => {
      const next = [...prev.checkpoints];
      next[idx] = val;
      return { ...prev, checkpoints: next };
    });
  };

  const handleAddCheckpoint = () => {
    setFormData(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, 'Điểm mạnh mới của API...'],
    }));
  };

  const handleRemoveCheckpoint = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== idx),
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
          base_url: formData.base_url,
          checkpoints: formData.checkpoints,
          python_snippet: formData.python_snippet,
          node_snippet: formData.node_snippet,
          curl_snippet: formData.curl_snippet,
        },
      });
      showToast('Đã lưu cấu hình Khối Developer thành công');
    } catch {
      showToast('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải cấu hình Developer...</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <div className={styles.iconBox}>
            <HiOutlineCommandLine />
          </div>
          <div>
            <h1 className={styles.title}>Quản Lý Khối Tích Hợp Developer & SDK</h1>
            <p className={styles.subtitle}>
              Cấu hình Base URL OpenAI-compatible, các gạch đầu dòng tính năng SDK và mã code mẫu (Python / Node.js / cURL).
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
                placeholder="DÀNH CHO LẬP TRÌNH VIÊN"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Tiêu Đề Khối</label>
              <input
                type="text"
                value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                placeholder="Tương Thích Tuyệt Đối OpenAI SDK..."
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Mô tả bên dưới tiêu đề</label>
              <textarea
                rows={2}
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Chỉ cần thay đổi baseURL và sử dụng API Key VeloX..."
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Base URL Mẫu</label>
              <input
                type="text"
                value={formData.base_url}
                onChange={e => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.velox.ai/v1"
              />
            </div>
          </div>
        </div>

        {/* Checkpoints */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Các Điểm Nổi Bật (Bullet points) ({formData.checkpoints.length})</span>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleAddCheckpoint}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <HiOutlinePlus /> Thêm Gạch Đầu Dòng
            </button>
          </div>

          <div className={styles.subItemList}>
            {formData.checkpoints.map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={pt}
                  onChange={e => handleCheckpointChange(idx, e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    color: '#fff',
                  }}
                />
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => handleRemoveCheckpoint(idx)}
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Code Snippets */}
        <div className={styles.editorCard}>
          <div className={styles.cardTitle}>
            <span>Đoạn Code Mẫu (Code Snippets)</span>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Code Python (openai SDK)</label>
              <textarea
                rows={5}
                value={formData.python_snippet}
                onChange={e => setFormData({ ...formData, python_snippet: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Code Node.js (OpenAI package)</label>
              <textarea
                rows={5}
                value={formData.node_snippet}
                onChange={e => setFormData({ ...formData, node_snippet: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <label>Code cURL Terminal</label>
              <textarea
                rows={4}
                value={formData.curl_snippet}
                onChange={e => setFormData({ ...formData, curl_snippet: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/admin/landing/sections" className={styles.btnSecondary}>
            Quay Lại Bố Cục
          </Link>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Developer'}
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

export default LandingDeveloperPage;
