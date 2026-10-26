import { useState } from 'react';
import { HiOutlineBellAlert, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface Notification { id: string; title: string; message: string; type: 'info' | 'warning' | 'success' | 'danger'; is_read: boolean; date: string; }

const initialNotifs: Notification[] = [
  { id: 'n1', title: 'Pool Cạn Key', message: 'Luma Dream Machine Pool đã hết token. Bổ sung key ngay.', type: 'danger', is_read: false, date: '2026-10-26 21:00' },
  { id: 'n2', title: 'Nạp Tiền Thành Công', message: 'Người dùng studio.vn@gmail.com vừa nạp 500,000 ₫ qua VietQR.', type: 'success', is_read: false, date: '2026-10-26 21:40' },
  { id: 'n3', title: 'Rate Limit Cảnh Báo', message: 'OpenAI GPT-4o Pool đạt 85% rate limit. Cân nhắc tăng key.', type: 'warning', is_read: true, date: '2026-10-26 20:30' },
  { id: 'n4', title: 'Hệ Thống Cập Nhật', message: 'VeloX Gateway v2.3.1 đã được triển khai thành công.', type: 'info', is_read: true, date: '2026-10-26 18:00' },
  { id: 'n5', title: 'Người Dùng Mới', message: '3 người dùng mới đăng ký trong 24h qua.', type: 'info', is_read: true, date: '2026-10-26 09:00' },
];

const typeColors: Record<string, { bg: string; color: string; label: string }> = {
  info: { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', label: 'Thông Tin' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Cảnh Báo' },
  success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Thành Công' },
  danger: { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', label: 'Quan Trọng' },
};

const NotificationsPage = () => {
  const [notifs, setNotifs] = useState<Notification[]>(() => { const s = localStorage.getItem('velox_notifs'); return s ? JSON.parse(s) : initialNotifs; });
  const save = (d: Notification[]) => { setNotifs(d); localStorage.setItem('velox_notifs', JSON.stringify(d)); };

  const markRead = (id: string) => save(notifs.map((n) => n.id === id ? { ...n, is_read: true } : n));
  const markAllRead = () => save(notifs.map((n) => ({ ...n, is_read: true })));
  const handleDelete = (id: string) => save(notifs.filter((n) => n.id !== id));
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className={styles.moduleContainer}>
      <div className={styles.toolbarCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HiOutlineBellAlert size={20} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fafafa' }}>{unreadCount} chưa đọc</span>
        </div>
        <div className={styles.actionButtonGroup}>
          <Button variant="outline" size="sm" onClick={markAllRead}><HiOutlineCheckCircle size={16} /> Đánh dấu tất cả đã đọc</Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {notifs.map((n) => {
          const tc = typeColors[n.type];
          return (
            <div key={n.id} style={{ background: n.is_read ? '#18181b' : '#1c1c22', border: `1px solid ${n.is_read ? '#27272a' : 'rgba(99,102,241,0.15)'}`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => markRead(n.id)}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, backgroundColor: n.is_read ? '#27272a' : tc.color, boxShadow: n.is_read ? 'none' : `0 0 8px ${tc.color}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.85rem' }}>{n.title}</span>
                  <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 6, backgroundColor: tc.bg, color: tc.color, fontWeight: 600 }}>{tc.label}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#71717a', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: 4 }}>{n.date}</div>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} style={{ color: '#3f3f46', cursor: 'pointer', padding: 4, borderRadius: 6 }} title="Xoá"><HiOutlineTrash size={16} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default NotificationsPage;
