import { useState } from 'react';
import { HiOutlineBellAlert, HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';

interface Notification { id: string; title: string; message: string; type: 'info' | 'warning' | 'success' | 'danger'; is_read: boolean; date: string; }

const initialNotifs: Notification[] = [
  { id: 'n1', title: 'Pool Cạn Key', message: 'Luma Dream Machine Pool đã hết token. Bổ sung key ngay.', type: 'danger', is_read: false, date: '2026-10-26 21:00' },
  { id: 'n2', title: 'Nạp Tiền Thành Công', message: 'Người dùng studio.vn@gmail.com vừa nạp 500,000 ₫ qua VietQR.', type: 'success', is_read: false, date: '2026-10-26 21:40' },
  { id: 'n3', title: 'Rate Limit Cảnh Báo', message: 'OpenAI GPT-4o Pool đạt 85% rate limit. Cân nhắc tăng key.', type: 'warning', is_read: true, date: '2026-10-26 20:30' },
  { id: 'n4', title: 'Hệ Thống Cập Nhật', message: 'VeloX Gateway v2.3.1 đã được triển khai thành công.', type: 'info', is_read: true, date: '2026-10-26 18:00' },
  { id: 'n5', title: 'Người Dùng Mới', message: '3 người dùng mới đăng ký trong 24h qua.', type: 'info', is_read: true, date: '2026-10-26 09:00' },
];

const NotificationsPage = () => {
  const [notifs, setNotifs] = useState<Notification[]>(() => { const s = localStorage.getItem('velox_notifs'); return s ? JSON.parse(s) : initialNotifs; });
  const save = (d: Notification[]) => { setNotifs(d); localStorage.setItem('velox_notifs', JSON.stringify(d)); };

  const markRead = (id: string) => save(notifs.map((n) => n.id === id ? { ...n, is_read: true } : n));
  const markAllRead = () => save(notifs.map((n) => ({ ...n, is_read: true })));
  const handleDelete = (id: string) => save(notifs.filter((n) => n.id !== id));
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const badgeVariant = (type: string) => type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info' as const;
  const typeLabel: Record<string, string> = { info: 'Thông Tin', warning: 'Cảnh Báo', success: 'Thành Công', danger: 'Quan Trọng' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HiOutlineBellAlert size={20} style={{ color: '#6366f1' }} />
            <Badge variant={unreadCount > 0 ? 'danger' : 'neutral'} size="md">{unreadCount} chưa đọc</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead}><HiOutlineCheckCircle size={16} /> Đánh dấu tất cả đã đọc</Button>
        </div>
      </Card>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {notifs.map((n) => (
          <Card key={n.id} padding="sm">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', opacity: n.is_read ? 0.65 : 1, transition: 'opacity 0.2s' }} onClick={() => markRead(n.id)}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 6, backgroundColor: n.is_read ? '#27272a' : (n.type === 'danger' ? '#f43f5e' : n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#10b981' : '#06b6d4'), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '0.85rem' }}>{n.title}</span>
                  <Badge variant={badgeVariant(n.type)} size="sm">{typeLabel[n.type]}</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#71717a', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: 4 }}>{n.date}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} title="Xoá"><HiOutlineTrash size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default NotificationsPage;
