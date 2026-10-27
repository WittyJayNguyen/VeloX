import React from 'react';
import { HiOutlineTrash, HiOutlineDocumentText } from 'react-icons/hi2';
import type { ExpenseItem } from '../types';

interface Props {
  items: ExpenseItem[];
  onDelete: (id: string, title: string) => void;
}

export const ExpenseTable: React.FC<Props> = ({ items, onDelete }) => {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ACCOUNT_PURCHASE':
        return { label: 'Mua Account', bg: 'rgba(99,102,241,0.15)', color: '#818cf8' };
      case 'PROVIDER_TOPUP':
        return { label: 'Nạp Ví NCC', bg: 'rgba(16,185,129,0.15)', color: '#34d399' };
      case 'CAPTCHA_SOLVER':
        return { label: 'Giải Captcha', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
      case 'PROXY_NETWORK':
        return { label: 'Proxy IP', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' };
      case 'SERVER_INFRA':
        return { label: 'Server VPS', bg: 'rgba(56,189,248,0.15)', color: '#38bdf8' };
      default:
        return { label: 'Chi Phí Khác', bg: 'rgba(255,255,255,0.08)', color: '#cbd5e1' };
    }
  };

  if (items.length === 0) {
    return (
      <div style={{
        padding: '40px', textAlign: 'center', background: '#111520',
        borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8'
      }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', marginBottom: '10px' }}>
          <HiOutlineDocumentText size={32} />
        </div>
        <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '15px' }}>Chưa có bút toán chi phí nào</h4>
        <p style={{ margin: 0, fontSize: '13px' }}>Hãy bấm nút "Nhập Acc / Ghi Nhận Chi Phí Mới" để thêm bút toán đầu tiên.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#111520', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161b2a', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <th style={{ padding: '12px 16px' }}>Mã Bút Toán</th>
            <th style={{ padding: '12px 16px' }}>Phân Loại</th>
            <th style={{ padding: '12px 16px' }}>Nội Dung / Nhà Cung Cấp</th>
            <th style={{ padding: '12px 16px' }}>Quy Mô (Acc / Tokens)</th>
            <th style={{ padding: '12px 16px' }}>Tổng Tiền Chi</th>
            <th style={{ padding: '12px 16px' }}>Đã Khấu Hao</th>
            <th style={{ padding: '12px 16px' }}>Tài Sản Còn Lại</th>
            <th style={{ padding: '12px 16px' }}>Ngày Ghi Nhận</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const badge = getCategoryBadge(it.category);
            return (
              <tr key={it.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                  {it.entry_code}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    background: badge.bg, color: badge.color
                  }}>
                    {badge.label}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{it.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>NCC: {it.provider}</div>
                </td>
                <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                  {it.account_count > 0 && <span style={{ color: '#818cf8', fontWeight: 600 }}>{it.account_count} Acc</span>}
                  {it.tokens_capacity > 0 && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                      {(it.tokens_capacity / 1_000_000_000).toFixed(1)}B Tokens
                    </span>
                  )}
                  {it.account_count === 0 && it.tokens_capacity === 0 && '—'}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f59e0b' }}>
                  {formatVND(it.amount_vnd)}
                </td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>
                  {formatVND(it.depreciated_amount_vnd)}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#10b981' }}>
                  {formatVND(it.remaining_value_vnd)}
                </td>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>
                  {it.created_at ? new Date(it.created_at).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => onDelete(it.id, it.title)}
                    title="Xóa bút toán"
                    style={{
                      padding: '6px 8px', borderRadius: '6px', border: 'none',
                      background: 'rgba(239,68,68,0.15)', color: '#f87171',
                      cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    <HiOutlineTrash />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
