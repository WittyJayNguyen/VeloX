import React from 'react';
import { HiOutlineServerStack, HiOutlineCpuChip } from 'react-icons/hi2';
import type { AccountInventoryItem } from '../types';

interface Props {
  items: AccountInventoryItem[];
}

export const AccountInventoryTable: React.FC<Props> = ({ items }) => {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const formatTokens = (num: number) => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} Tỷ`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Triệu`;
    return num.toLocaleString();
  };

  return (
    <div style={{
      background: '#131722', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: '24px', overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161b2a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
          <HiOutlineServerStack size={20} color="#38bdf8" />
          <span>Kiểm Toán Kho Tài Sản Tài Khoản & Số Dư Nhà Cung Cấp</span>
        </div>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Theo dõi khấu hao thực tế & giá trị sổ sách còn lại
        </span>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#111520', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <th style={{ padding: '12px 18px' }}>Tài Sản / Kho Acc</th>
              <th style={{ padding: '12px 16px' }}>Số Lượng Acc</th>
              <th style={{ padding: '12px 16px' }}>Dung Lượng Token</th>
              <th style={{ padding: '12px 16px' }}>Đơn Giá Nhập</th>
              <th style={{ padding: '12px 16px' }}>Tổng Vốn Đầu Tư</th>
              <th style={{ padding: '12px 16px' }}>Đã Tiêu Hao (COGS)</th>
              <th style={{ padding: '12px 16px' }}>Giá Trị Còn Lại</th>
              <th style={{ padding: '12px 18px', width: '160px' }}>Tỉ Lệ Còn Lại</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px 18px', textAlign: 'center', color: '#64748b' }}>
                  Chưa có tài sản kho hoặc số dư nhà cung cấp nào
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
              const pctRemaining = item.total_cost_vnd > 0
                ? Math.round((item.remaining_value_vnd / item.total_cost_vnd) * 100)
                : 100;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HiOutlineCpuChip color="#818cf8" size={16} />
                      <div>
                        <div>{item.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>{item.provider}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#38bdf8', fontWeight: 600 }}>
                    {item.account_count} Acc
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#a78bfa' }}>
                    {formatTokens(item.total_tokens)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {formatVND(item.unit_cost_vnd)}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f59e0b' }}>
                    {formatVND(item.total_cost_vnd)}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#ef4444' }}>
                    {formatVND(item.used_cost_vnd)}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#10b981' }}>
                    {formatVND(item.remaining_value_vnd)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pctRemaining}%`,
                          background: pctRemaining > 30 ? '#10b981' : '#f59e0b',
                          borderRadius: '4px'
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: pctRemaining > 30 ? '#34d399' : '#fbbf24' }}>
                        {pctRemaining}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
