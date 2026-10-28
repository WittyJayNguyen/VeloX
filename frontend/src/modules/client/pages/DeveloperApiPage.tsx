import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineCommandLine,
  HiOutlineKey,
  HiOutlineDocumentDuplicate,
  HiOutlineCheckCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import apiClient from '@modules/core/lib/apiClient';
import styles from '@assets/scss/client/client-pages.module.scss';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_per_min: number;
  total_requests: number;
  last_used_at?: string;
  created_at?: string;
}

export const DeveloperApiPage: React.FC = () => {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [isCreating, setIsCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Active key for snippet preview
  const [activeKeyString, setActiveKeyString] = useState<string>('sk-velox-YOUR-API-KEY');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiKeyItem[]>('/developer/keys');
      const list = res.data || [];
      setKeys(list);
      if (list.length > 0 && activeKeyString === 'sk-velox-YOUR-API-KEY') {
        setActiveKeyString(`${list[0].key_prefix}...`);
      }
    } catch {
      // Fallback
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text: string, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setIsCreating(true);
      const res = await apiClient.post<{ secret_key: string } & ApiKeyItem>('/developer/keys', {
        name: newKeyName.trim(),
        rate_limit_per_min: Number(rateLimit) || 60,
      });

      setCreatedSecret(res.data.secret_key);
      setActiveKeyString(res.data.secret_key);
      setToast('Đã tạo API Key mới thành công!');
      setTimeout(() => setToast(null), 3500);
      await fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể tạo API Key. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (keyItem: ApiKeyItem) => {
    try {
      await apiClient.patch(`/developer/keys/${keyItem.id}/toggle?is_active=${!keyItem.is_active}`);
      setKeys((prev) =>
        prev.map((k) => (k.id === keyItem.id ? { ...k, is_active: !k.is_active } : k))
      );
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể thay đổi trạng thái key.');
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi (xóa) API Key này? Tất cả ứng dụng đang sử dụng key này sẽ bị ngắt kết nối ngay lập tức!')) {
      return;
    }
    try {
      await apiClient.delete(`/developer/keys/${keyId}`);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      setToast('Đã thu hồi API Key thành công.');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể thu hồi API Key.');
    }
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        velox: {
          command: 'npx',
          args: ['-y', '@velox/mcp-server'],
          env: {
            VELOX_API_KEY: activeKeyString,
            VELOX_BASE_URL: 'https://api.velox.nexoratech.com.vn/v1',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>💻</span>
            {t('client_menu.developer', 'API & Giao Thức MCP (Model Context Protocol)')}
          </h1>
          <p>
            {t(
              'developer.subtitle',
              'Kết nối VeloX AI Gateway với các ứng dụng IDE, Claude Desktop, Cursor và hệ thống backend của bạn'
            )}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setNewKeyName('');
              setCreatedSecret(null);
              setIsModalOpen(true);
            }}
          >
            <HiOutlinePlus /> Tạo API Key Mới
          </button>
        </div>
      </div>

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Keys Table Card */}
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className={styles.cardTitle} style={{ margin: 0 }}>
            <HiOutlineKey /> Danh Sách Khóa Bí Mật API (Secret Keys)
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Tổng số: <strong>{keys.length}</strong> khóa
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Đang tải danh sách API Keys...
          </div>
        ) : keys.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: '#0a0e17', borderRadius: '12px', border: '1px dashed #243048' }}>
            <HiOutlineKey size={40} style={{ color: '#475569', marginBottom: '0.75rem' }} />
            <h4 style={{ color: '#e2e8f0', margin: '0 0 0.5rem' }}>Bạn chưa có API Key nào</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
              Tạo khóa API đầu tiên để tích hợp VeloX Gateway vào Claude Desktop, Cursor IDE hoặc backend ứng dụng.
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setNewKeyName('');
                setCreatedSecret(null);
                setIsModalOpen(true);
              }}
            >
              <HiOutlinePlus /> Tạo Khóa API Đầu Tiên
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Tên Định Danh</th>
                  <th>Tiền Tố Khóa (Prefix)</th>
                  <th>Giới Hạn</th>
                  <th>Số Request</th>
                  <th>Ngày Tạo</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <strong style={{ color: '#f1f5f9' }}>{k.name}</strong>
                    </td>
                    <td>
                      <code style={{ color: '#38bdf8', background: '#0e1726', padding: '3px 8px', borderRadius: '4px' }}>
                        {k.key_prefix}...
                      </code>
                    </td>
                    <td>{k.rate_limit_per_min} req/phút</td>
                    <td>{k.total_requests.toLocaleString()}</td>
                    <td>{k.created_at ? new Date(k.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggle(k)}
                        className={k.is_active ? styles.badgeSuccess : styles.badgeDanger}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Bấm để bật/tắt kích hoạt khóa này"
                      >
                        {k.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                        }}
                        title="Thu hồi khóa"
                      >
                        <HiOutlineTrash /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Connection Parameters Card */}
      <div className={styles.contentCard} style={{ border: '1px solid rgba(56, 189, 248, 0.3)', background: 'linear-gradient(180deg, rgba(14, 23, 38, 0.9) 0%, rgba(10, 14, 23, 0.9) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <h3 className={styles.cardTitle} style={{ margin: 0, color: '#38bdf8' }}>
            Thông Số Kết Nối Nhanh (Open Code, Cursor, VS Code, Python SDK)
          </h3>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
          Tất cả yêu cầu được định tuyến qua chuẩn <strong>OpenAI Compatible</strong>. Số dư Credit trong tài khoản của bạn sẽ tự động khấu trừ chính xác theo biểu phí niêm yết của từng model.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#070a10', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Base URL (OpenAI Endpoint):</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <code style={{ color: '#38bdf8', fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                https://velox.nexoratech.com.vn/v1
              </code>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleCopy('https://velox.nexoratech.com.vn/v1')}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Sao Chép
              </button>
            </div>
          </div>

          <div style={{ background: '#070a10', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Mô Hình Sinh Code / Lập Trình (Models):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>codex</span>
              <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>gpt-4o</span>
              <span style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>claude-sonnet-5-5-ccmax</span>
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>gpt-6.1-sol</span>
            </div>
          </div>
        </div>

        {/* Integration Instructions */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '1rem', borderRadius: '10px', borderLeft: '3px solid #ff6b35' }}>
          <strong style={{ color: '#ffedd5', fontSize: '0.88rem' }}>💡 Hướng dẫn cấu hình Open Code / Cursor / Cline / VS Code:</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6' }}>
            <li>Trong phần <strong>Model Provider</strong>: Chọn <strong>OpenAI</strong> hoặc <strong>OpenAI Compatible</strong>.</li>
            <li>Tại mục <strong>Base URL</strong>: Điền <code>https://velox.nexoratech.com.vn/v1</code></li>
            <li>Tại mục <strong>API Key</strong>: Dán khóa <code>sk-velox-...</code> của bạn bên dưới.</li>
            <li>Tại mục <strong>Model Name</strong>: Điền <code>codex</code> hoặc <code>gpt-4o</code>.</li>
            <li>Mỗi tài khoản có thể tạo nhiều API Key riêng biệt cho từng công cụ mà không bị trùng lặp!</li>
          </ul>
        </div>
      </div>

      {/* Code Snippet Python / OpenAI SDK */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>Code Mẫu Sử Dụng Python (OpenAI SDK Chuẩn)</h3>
        <pre
          style={{
            background: '#090d16',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #1c2638',
            color: '#a7f3d0',
            fontSize: '0.86rem',
            overflowX: 'auto',
            fontFamily: 'monospace',
          }}
        >
{`from openai import OpenAI

# Kết nối trực tiếp vào VeloX AI Gateway
client = OpenAI(
    api_key="${activeKeyString}",
    base_url="https://velox.nexoratech.com.vn/v1"
)

# Gọi model codex hoặc gpt-4o để viết code
response = client.chat.completions.create(
    model="codex", # hoặc "gpt-4o"
    messages=[
        {"role": "user", "content": "Viết thuật toán QuickSort bằng Python"}
    ],
    temperature=0.3
)

print(response.choices[0].message.content)`}
        </pre>
      </div>

      {/* MCP Integration Card */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineCommandLine /> Tích Hợp MCP (Claude Desktop / Cursor / Windsurf)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Dán đoạn cấu hình sau vào tệp <code>claude_desktop_config.json</code> hoặc phần cấu hình MCP của Cursor:
        </p>

        <div style={{ position: 'relative' }}>
          <pre
            style={{
              background: '#090d16',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #1c2638',
              color: '#38bdf8',
              fontSize: '0.86rem',
              overflowX: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {mcpConfig}
          </pre>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleCopy(mcpConfig)}
            style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <HiOutlineDocumentDuplicate /> {copiedSnippet ? 'Đã Chép' : 'Sao Chép JSON'}
          </button>
        </div>
      </div>

      {/* Modal Create Key */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {createdSecret ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
                  <HiOutlineCheckCircle size={28} />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Tạo API Key Thành Công!</h3>
                </div>

                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <HiOutlineExclamationTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Lưu ý quan trọng:</strong> Vì lý do bảo mật, bạn sẽ không thể nhìn thấy lại toàn bộ khóa này sau khi đóng hộp thoại. Hãy lưu vào nơi an toàn ngay!
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Khóa Bí Mật Của Bạn (Secret Key):
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={createdSecret}
                      style={{
                        flex: 1,
                        background: '#090d16',
                        border: '1px solid #22c55e',
                        color: '#4ade80',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                      }}
                    />
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => handleCopy(createdSecret, true)}
                    >
                      <HiOutlineDocumentDuplicate /> {copiedKey ? 'Đã Chép' : 'Sao Chép'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      setIsModalOpen(false);
                      setCreatedSecret(null);
                    }}
                  >
                    Tôi Đã Lưu Khóa Này
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.2rem' }}>
                  Tạo API Key Mới
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0 0 1.25rem' }}>
                  Khóa API cho phép hệ thống hoặc IDE của bạn gửi request trực tiếp đến VeloX AI Gateway.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                    Tên định danh khóa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: Claude Desktop, Cursor IDE, App Backend..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#fff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                    Giới hạn số request / phút (Rate Limit)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#fff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setIsModalOpen(false)}
                    disabled={isCreating}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={isCreating || !newKeyName.trim()}
                  >
                    {isCreating ? 'Đang tạo...' : 'Tạo Khóa Bí Mật'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperApiPage;
