import React, { useEffect, useState, useCallback } from 'react';
import { accountingService } from '../services/accountingService';
import type { AccountingOverview, CreateExpensePayload } from '../types';
import { AccountingHeader } from '../components/AccountingHeader';
import { AccountingStatsCards } from '../components/AccountingStatsCards';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import { AccountInventoryTable } from '../components/AccountInventoryTable';
import {
  HiOutlineDocumentChartBar,
  HiOutlineScale,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

export const AccountingOverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<AccountingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountingService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load accounting overview', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleCreateExpense = async (payload: CreateExpensePayload) => {
    try {
      const item = await accountingService.createExpense(payload);
      await fetchOverview();
      return item;
    } catch (err) {
      console.error('Failed to create expense', err);
      return null;
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <AccountingHeader
        title="Báo Cáo Kết Quả Hoạt Động Kinh Doanh (P&L Statement)"
        subtitle="Tổng hợp doanh thu từ khách hàng, chi phí mua tài khoản/nạp tiền NCC, giá vốn trích lập COGS và biên lợi nhuận ròng."
        onOpenCreateModal={() => setModalOpen(true)}
        onRefresh={fetchOverview}
        loading={loading}
      />

      {/* KPI Cards */}
      {overview && <AccountingStatsCards data={overview} />}

      {/* P&L Financial Performance Breakdown & Category Structure */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Income Statement Structure */}
        <div
          style={{
            background: '#111622',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <HiOutlineDocumentChartBar size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Báo Cáo Thu Nhập & Phân Bổ Giá Vốn
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Hạch toán theo chuẩn kế toán dồn tích (Accrual Accounting)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>1. Doanh Thu Nạp Tiền (Revenue)</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                +{overview?.total_revenue_vnd ? Math.round(overview.total_revenue_vnd).toLocaleString('vi-VN') : '0'} đ
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>2. Giá Vốn Đã Trích Lập (COGS)</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                -{overview?.cogs_depreciated_vnd ? Math.round(overview.cogs_depreciated_vnd).toLocaleString('vi-VN') : '0'} đ
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#c7d2fe' }}>3. Lợi Nhuận Gộp (Gross Profit)</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#818cf8' }}>
                {overview?.gross_profit_vnd ? Math.round(overview.gross_profit_vnd).toLocaleString('vi-VN') : '0'} đ ({overview?.gross_margin_pct || 0}%)
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>4. Tổng Vốn Đã Chi Mua Acc & Nạp NCC</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>
                -{overview?.total_expense_vnd ? Math.round(overview.total_expense_vnd).toLocaleString('vi-VN') : '0'} đ
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#a7f3d0' }}>5. Lợi Nhuận Ròng (Net Cash Profit)</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
                {overview?.net_profit_vnd ? Math.round(overview.net_profit_vnd).toLocaleString('vi-VN') : '0'} đ (ROI: {overview?.roi_pct || 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Asset Health & Solvency Check */}
        <div
          style={{
            background: '#111622',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <HiOutlineScale size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Thanh Khoản & Dư Nợ Sổ Sách
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Kiểm định khả năng thanh toán và bảo toàn vốn đầu tư
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tài sản sổ sách còn lại (Unexhausted Assets)</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  {overview?.remaining_assets_vnd ? Math.round(overview.remaining_assets_vnd).toLocaleString('vi-VN') : '0'} đ
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Giá trị của các tài khoản Muse 31B/1B và ví OpenAI/2Captcha chưa dùng hết.
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Công nợ Credits ví người dùng (Customer Liabilities)</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fb7185' }}>
                  {overview?.customer_liabilities_vnd ? Math.round(overview.customer_liabilities_vnd).toLocaleString('vi-VN') : '0'} đ
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Số credit khách đã thanh toán nhưng chưa gọi API/Job (Doanh thu chưa thực hiện).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <HiOutlineCheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#a7f3d0' }}>
                Hệ số an toàn vốn đạt chuẩn: Tài sản thực tế vượt trội so với nghĩa vụ nợ ngắn hạn.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot of Account Inventory */}
      <AccountInventoryTable items={overview?.account_inventory || []} />

      {/* Modal */}
      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
};
