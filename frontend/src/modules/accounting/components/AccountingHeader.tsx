import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineDocumentChartBar,
  HiOutlineCircleStack,
  HiOutlineReceiptRefund,
  HiOutlineScale,
  HiOutlinePlus,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

interface Props {
  title?: string;
  subtitle?: string;
  onOpenCreateModal?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const navTabs = [
  {
    path: '/admin/accounting/pnl',
    label: 'Báo Cáo P&L & Lời Lỗ',
    desc: 'Doanh thu, COGS & Lợi nhuận',
    icon: HiOutlineDocumentChartBar,
  },
  {
    path: '/admin/accounting/assets',
    label: 'Kiểm Toán Kho Acc & Token',
    desc: 'Định giá tài sản & Khấu hao',
    icon: HiOutlineCircleStack,
  },
  {
    path: '/admin/accounting/procurement',
    label: 'Nhập Acc & Nạp Tiền NCC',
    desc: 'Sổ cái phiếu chi & Hóa đơn',
    icon: HiOutlineReceiptRefund,
  },
  {
    path: '/admin/accounting/cashflow',
    label: 'Đối Soát Dòng Tiền & Công Nợ',
    desc: 'Dòng tiền vào/ra & Dư nợ ví',
    icon: HiOutlineScale,
  },
];

export const AccountingHeader: React.FC<Props> = ({
  title = 'Kế Toán & Kiểm Toán Tài Sản VeloX',
  subtitle = 'Phân hệ quản trị tài chính, kiểm toán tài sản tài khoản AI, khấu hao giá vốn COGS và hạch toán dòng tiền.',
  onOpenCreateModal,
  onRefresh,
  loading = false,
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Top Banner & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              Enterprise Accounting & Audit
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Kỳ Kế Toán 10/2026</span>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Làm mới dữ liệu sổ cái"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                background: '#1a1f2e',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <HiOutlineArrowPath size={16} className={loading ? 'spin-animation' : ''} />
              <span>Đối Soát Lại</span>
            </button>
          )}

          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
            >
              <HiOutlinePlus size={16} />
              <span>Lập Phiếu Chi / Nhập Acc</span>
            </button>
          )}
        </div>
      </div>

      {/* Accounting Workflow Process Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '10px',
          background: '#0d1117',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15))'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(99, 102, 241, 0.4)'
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isActive ? '#ffffff' : '#cbd5e1',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {tab.label}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: isActive ? '#a5b4fc' : '#64748b',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {tab.desc}
                    </div>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
