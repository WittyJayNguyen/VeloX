import { HiOutlineTrash, HiOutlineCheckCircle, HiOutlinePauseCircle } from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import type { DeveloperApiKey } from '../types';

interface Props {
  keys: DeveloperApiKey[];
  onToggle: (key: DeveloperApiKey) => void;
  onRevoke: (id: string, name: string) => void;
}

export const ApiKeyTable: React.FC<Props> = ({ keys, onToggle, onRevoke }) => {
  if (keys.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', textAlign: 'center', background: '#111520',
        borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8'
      }}>
        <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', marginBottom: '14px' }}>
          <RiOpenaiFill size={36} />
        </div>
        <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '15px' }}>Chưa có API Key nào</h4>
        <p style={{ margin: 0, fontSize: '13px' }}>Hãy tạo một API Key để bắt đầu tích hợp VeloX Gateway vào ứng dụng của bạn.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#111520', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161b2a', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <th style={{ padding: '12px 16px' }}>Tên Định Danh</th>
            <th style={{ padding: '12px 16px' }}>Key Prefix</th>
            <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
            <th style={{ padding: '12px 16px' }}>Rate Limit</th>
            <th style={{ padding: '12px 16px' }}>Lượt Gọi</th>
            <th style={{ padding: '12px 16px' }}>Dùng Lần Cuối</th>
            <th style={{ padding: '12px 16px' }}>Ngày Tạo</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                {k.name}
              </td>
              <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#38bdf8' }}>
                {k.key_prefix}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  background: k.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: k.is_active ? '#34d399' : '#f87171'
                }}>
                  {k.is_active ? <HiOutlineCheckCircle /> : <HiOutlinePauseCircle />}
                  {k.is_active ? 'Active' : 'Paused'}
                </span>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <span style={{ color: '#a78bfa' }}>{k.rate_limit_per_min}</span> req/m
              </td>
              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>
                {k.total_requests.toLocaleString()}
              </td>
              <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>
                {k.last_used_at ? new Date(k.last_used_at).toLocaleString('vi-VN') : 'Chưa sử dụng'}
              </td>
              <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>
                {k.created_at ? new Date(k.created_at).toLocaleDateString('vi-VN') : '—'}
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <button
                    onClick={() => onToggle(k)}
                    title={k.is_active ? 'Tạm dừng key' : 'Kích hoạt key'}
                    style={{
                      padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                      background: '#1e2433', color: k.is_active ? '#fbbf24' : '#34d399',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 600
                    }}
                  >
                    {k.is_active ? 'Tạm dừng' : 'Bật lại'}
                  </button>
                  <button
                    onClick={() => onRevoke(k.id, k.name)}
                    title="Thu hồi / Xóa vĩnh viễn"
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: 'none',
                      background: 'rgba(239,68,68,0.15)', color: '#f87171',
                      cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
