import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCog6Tooth, HiOutlineGlobeAlt, HiOutlineShieldCheck, HiOutlineBell } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Card } from '@modules/core/design-system/Card';
import { Toggle } from '@modules/core/design-system/Components';

const LANG_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

const SettingsPage = () => {
  const { t } = useTranslation();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card title="Cài Đặt Chung" headerRight={<HiOutlineGlobeAlt size={20} style={{ color: '#6366f1' }} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên Hệ Thống" value={siteName} onChange={(e) => setSiteName(e.target.value)} fullWidth />
          <Input label="Mô Tả" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} fullWidth />
          <Select label="Ngôn Ngữ Mặc Định" options={LANG_OPTIONS} value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} fullWidth />
        </div>
      </Card>

      <Card title="Bảo Mật & Vận Hành" headerRight={<HiOutlineShieldCheck size={20} style={{ color: '#10b981' }} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle label="Chế Độ Bảo Trì" checked={maintenanceMode} onChange={setMaintenanceMode} />
          <Toggle label="Tự Động Backup Hàng Ngày" checked={autoBackup} onChange={setAutoBackup} />
        </div>
      </Card>

      <Card title={t('admin.sidebar.notifications', 'Thông Báo')} headerRight={<HiOutlineBell size={20} style={{ color: '#f59e0b' }} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Toggle label="Email Thông Báo" checked={emailNotif} onChange={setEmailNotif} />
          <Input label="Webhook URL" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.slack.com/..." fullWidth />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        {saved && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>✓ {t('common.save', 'Đã lưu!')}</span>}
        <Button variant="primary" size="md" onClick={handleSave}><HiOutlineCog6Tooth size={16} /> {t('common.save', 'Lưu Cài Đặt')}</Button>
      </div>
    </div>
  );
};
export default SettingsPage;
