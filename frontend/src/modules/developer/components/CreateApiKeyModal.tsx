import React, { useState } from 'react';
import { HiOutlineKey, HiOutlineClipboard, HiOutlineCheck, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import type { DeveloperApiKeyCreated } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, rateLimit: number) => Promise<DeveloperApiKeyCreated | null>;
}

export const CreateApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<DeveloperApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(name.trim(), rateLimit);
      if (res) {
        setCreatedKey(res);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdKey?.secret_key) {
      navigator.clipboard.writeText(createdKey.secret_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#131722', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', maxWidth: '520px', width: '100%',
        padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: '#fff'
      }}>
        {!createdKey ? (
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                <HiOutlineKey size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Tạo API Key Mới Cho Developer</h3>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              API Key giúp ứng dụng của bạn gọi trực tiếp các mô hình AI (Ảnh, Video, Chat) thông qua cổng VeloX Gateway như một trạm trung gian bảo mật.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tên Định Danh Key <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: App Mobile iOS, Production Backend..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Giới Hạn Tốc Độ (Rate Limit - req/phút)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '14px', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                style={{
                  padding: '9px 20px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  opacity: submitting || !name.trim() ? 0.6 : 1
                }}
              >
                {submitting ? 'Đang tạo...' : 'Tạo Secret Key'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                <HiOutlineCheck size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>API Key Đã Được Tạo Thành Công</h3>
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px',
              color: '#f87171', fontSize: '12px', lineHeight: '1.5', marginBottom: '18px'
            }}>
              <HiOutlineExclamationTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>LƯU Ý QUAN TRỌNG:</strong> Hãy sao chép và lưu key này ngay bây giờ. Vì lý do bảo mật, VeloX chỉ băm SHA-256 và sẽ <strong>không bao giờ hiển thị lại chuỗi này lần thứ hai</strong>!
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Khóa Bí Mật Của Bạn
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', background: '#0b0f19',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '8px 12px'
              }}>
                <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {createdKey.secret_key}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    padding: '8px 14px', borderRadius: '6px', border: 'none',
                    background: copied ? '#10b981' : '#6366f1', color: '#fff',
                    cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                    fontWeight: 600, flexShrink: 0, transition: 'all 0.2s'
                  }}
                >
                  {copied ? <><HiOutlineCheck /> Đã copy</> : <><HiOutlineClipboard /> Copy</>}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 24px', borderRadius: '8px', border: 'none',
                  background: '#334155', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}
              >
                Tôi Đã Lưu Key Này
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
