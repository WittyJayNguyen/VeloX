import { useState } from 'react';
import { HiOutlineCog6Tooth, HiOutlineGlobeAlt, HiOutlinePaintBrush, HiOutlineShieldCheck, HiOutlineBell } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

const SettingsPage = () => {
  const [siteName, setSiteName] = useState('VeloX AI Gateway');
  const [siteDesc, setSiteDesc] = useState('Nền tảng trung gian AI Gateway thế hệ mới');
  const [defaultLang, setDefaultLang] = useState('vi');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('velox_settings', JSON.stringify({ siteName, siteDesc, defaultLang, maintenanceMode, autoBackup, emailNotif, webhookUrl }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number }>; title: string; children: React.ReactNode }) => (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Icon size={20} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fafafa' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className={styles.formField}><label>{label}</label>{children}</div>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 9999, border: 'none', cursor: 'pointer', position: 'relative', backgroundColor: value ? 'rgba(99,102,241,0.3)' : '#27272a', transition: 'all 0.2s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: value ? '#6366f1' : '#52525b', transition: 'all 0.2s', boxShadow: value ? '0 2px 8px rgba(99,102,241,0.4)' : 'none' }} />
      </button>
    </div>
  );

  return (
    <div className={styles.moduleContainer}>
      <Section icon={HiOutlineGlobeAlt} title="Cài Đặt Chung">
        <Field label="Tên Hệ Thống"><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} /></Field>
        <Field label="Mô Tả"><input type="text" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} /></Field>
        <Field label="Ngôn Ngữ Mặc Định">
          <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)}>
            <option value="vi">Tiếng Việt</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="zh">中文</option>
          </select>
        </Field>
      </Section>

      <Section icon={HiOutlineShieldCheck} title="Bảo Mật & Vận Hành">
        <Toggle label="Chế Độ Bảo Trì" value={maintenanceMode} onChange={setMaintenanceMode} />
        <Toggle label="Tự Động Backup Hàng Ngày" value={autoBackup} onChange={setAutoBackup} />
      </Section>

      <Section icon={HiOutlineBell} title="Thông Báo">
        <Toggle label="Email Thông Báo" value={emailNotif} onChange={setEmailNotif} />
        <Field label="Webhook URL"><input type="text" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..." /></Field>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        {saved && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>✓ Đã lưu!</span>}
        <Button variant="primary" size="md" onClick={handleSave}><HiOutlineCog6Tooth size={16} /> Lưu Cài Đặt</Button>
      </div>
    </div>
  );
};
export default SettingsPage;
