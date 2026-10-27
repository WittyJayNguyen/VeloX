import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCommandLine, HiOutlineKey, HiOutlineDocumentDuplicate, HiOutlineCheckCircle, HiOutlinePlus } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

export const DeveloperApiPage: React.FC = () => {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('vlx-live-9a8b7c6d5e4f3a2b1c0d9e8f');
  const [copiedKey, setCopiedKey] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerate = () => {
    const newKey = `vlx-live-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
    setToast('Đã tạo mới API Key thành công!');
    setTimeout(() => setToast(null), 3000);
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        velox: {
          command: 'npx',
          args: ['-y', '@velox/mcp-server'],
          env: {
            VELOX_API_KEY: apiKey,
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
          <p>{t('developer.subtitle', 'Kết nối VeloX AI Gateway với các ứng dụng IDE, Claude Desktop, Cursor và hệ thống backend của bạn')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={handleRegenerate}>
            <HiOutlinePlus /> Tạo Lại API Key
          </button>
        </div>
      </div>

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* API Key Management */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineKey /> VeloX Secret API Key
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0d121c', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #243048', marginBottom: '1rem' }}>
          <code style={{ flex: 1, color: '#38bdf8', fontSize: '0.95rem', letterSpacing: '0.04em' }}>{apiKey}</code>
          <button type="button" className={styles.primaryBtn} onClick={() => handleCopy(apiKey)} style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            <HiOutlineDocumentDuplicate /> {copiedKey ? 'Đã Chép' : 'Sao Chép'}
          </button>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0 }}>
          🔒 Giữ bí mật API Key của bạn. Không commit lên GitHub hoặc chia sẻ công khai. Tương thích 100% với định dạng OpenAI SDK.
        </p>
      </div>

      {/* MCP Integration */}
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
            style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <HiOutlineDocumentDuplicate /> Sao Chép JSON
          </button>
        </div>
      </div>

      {/* Code Snippet Python / Curl */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>Code Mẫu Sử Dụng Python (OpenAI SDK)</h3>
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

client = OpenAI(
    api_key="${apiKey}",
    base_url="https://api.velox.nexoratech.com.vn/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Tạo lịch tập gym 4 ngày/tuần"}]
)

print(response.choices[0].message.content)`}
        </pre>
      </div>
    </div>
  );
};

export default DeveloperApiPage;
