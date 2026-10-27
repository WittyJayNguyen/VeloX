import React from 'react';
import {
  HiOutlineBanknotes, HiOutlineArrowTrendingUp, HiOutlineArchiveBox,
  HiOutlineScale, HiOutlineCurrencyDollar, HiOutlineShieldExclamation
} from 'react-icons/hi2';
import type { AccountingOverview } from '../types';

interface Props {
  data: AccountingOverview;
}

export const AccountingStatsCards: React.FC<Props> = ({ data }) => {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const cards = [
    {
      title: 'Doanh Thu Khách Nạp',
      desc: 'Tổng tiền khách nạp vào VeloX',
      value: formatVND(data.total_revenue_vnd),
      icon: HiOutlineBanknotes,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      badge: 'Thực thu',
    },
    {
      title: 'Tổng Vốn Đã Chi',
      desc: 'Chi mua Acc & Nạp ví NCC',
      value: formatVND(data.total_expense_vnd),
      icon: HiOutlineCurrencyDollar,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      badge: 'Dòng tiền ra',
    },
    {
      title: 'Giá Vốn Đã Tiêu Hao (COGS)',
      desc: 'Hao mòn thực tế theo các request',
      value: formatVND(data.cogs_depreciated_vnd),
      icon: HiOutlineScale,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.12)',
      badge: 'Khấu hao',
    },
    {
      title: 'Tài Sản Kho Còn Lại',
      desc: 'Giá trị acc & số dư NCC chưa dùng',
      value: formatVND(data.remaining_assets_vnd),
      icon: HiOutlineArchiveBox,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.12)',
      badge: 'Tồn kho',
    },
    {
      title: 'Lợi Nhuận Gộp',
      desc: `Biên lợi nhuận gộp: ${data.gross_margin_pct}%`,
      value: formatVND(data.gross_profit_vnd),
      icon: HiOutlineArrowTrendingUp,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.12)',
      badge: `${data.gross_margin_pct}% Margin`,
    },
    {
      title: 'Lợi Nhuận Ròng (Net Profit)',
      desc: `Tỉ suất sinh lời trên vốn: ${data.roi_pct}%`,
      value: formatVND(data.net_profit_vnd),
      icon: HiOutlineShieldExclamation,
      color: data.net_profit_vnd >= 0 ? '#818cf8' : '#ef4444',
      bg: data.net_profit_vnd >= 0 ? 'rgba(129,140,248,0.12)' : 'rgba(239,68,68,0.12)',
      badge: `ROI ${data.roi_pct}%`,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: '#131722', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', background: c.bg,
              color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <c.icon size={22} />
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)', color: c.color
            }}>
              {c.badge}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{c.title}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', marginBottom: '6px' }}>
              {c.value}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
