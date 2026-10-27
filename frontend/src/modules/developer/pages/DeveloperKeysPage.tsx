import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineSparkles, HiOutlineArrowPath } from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import { developerService } from '../services/developerService';
import type { DeveloperApiKey, DeveloperApiKeyCreated } from '../types';
import { ApiKeyTable } from '../components/ApiKeyTable';
import { CreateApiKeyModal } from '../components/CreateApiKeyModal';
import { IntegrationGuide } from '../components/IntegrationGuide';

export const DeveloperKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<DeveloperApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await developerService.listKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to load developer keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (name: string, rateLimit: number): Promise<DeveloperApiKeyCreated | null> => {
    try {
      const created = await developerService.createKey({ name, rate_limit_per_min: rateLimit });
      setKeys((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể tạo API Key');
      return null;
    }
  };

  const handleToggle = async (key: DeveloperApiKey) => {
    try {
      const updated = await developerService.toggleKey(key.id, !key.is_active);
      setKeys((prev) => prev.map((k) => (k.id === key.id ? updated : k)));
    } catch (err) {
      alert('Lỗi cập nhật trạng thái key');
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn API Key "${name}"? Các ứng dụng đang dùng key này sẽ không thể gọi API được nữa.`)) {
      return;
    }
    try {
      await developerService.revokeKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      alert('Không thể thu hồi key');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '9px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex' }}>
              <RiOpenaiFill size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Developer API Keys</h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Quản lý Secret Keys để kết nối ứng dụng của bạn tới trạm trung gian VeloX AI Gateway (OpenAI Compatible).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchKeys}
            title="Làm mới"
            style={{
              padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: '#1a1f2e', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <HiOutlineArrowPath className={loading ? 'spin' : ''} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
            }}
          >
            <HiOutlinePlus size={18} /> Tạo API Key Mới
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        marginBottom: '24px', padding: '16px 20px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
        border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', flexShrink: 0 }}>
          <HiOutlineSparkles size={24} />
        </div>
        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
          <strong style={{ color: '#fff' }}>VeloX AI Gateway hoạt động như thế nào cho Dev?</strong> Bạn có thể dùng bất kỳ thư viện OpenAI SDK chuẩn nào trong Python, NodeJS hoặc Go. Chỉ cần trỏ <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>base_url="http://localhost:8000/v1"</code> và gắn API Key của bạn. VeloX sẽ tự động điều phối vào Provider Pool và trừ tiền theo số dư credits của bạn.
        </div>
      </div>

      {/* Keys Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách keys...</div>
      ) : (
        <ApiKeyTable keys={keys} onToggle={handleToggle} onRevoke={handleRevoke} />
      )}

      {/* Integration Guide */}
      <IntegrationGuide />

      {/* Create Modal */}
      <CreateApiKeyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default DeveloperKeysPage;
