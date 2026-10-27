import React, { useEffect, useState, useCallback } from 'react';
import { accountingService } from '../services/accountingService';
import type { CashFlowStatement, CreateExpensePayload } from '../types';
import { AccountingHeader } from '../components/AccountingHeader';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import {
  HiOutlineScale,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBanknotes,
} from 'react-icons/hi2';

export const AccountingCashFlowPage: React.FC = () => {
  const [statement, setStatement] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCashFlow = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountingService.getCashFlow();
      setStatement(data);
    } catch (err) {
      console.error('Failed to load cashflow statement', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashFlow();
  }, [fetchCashFlow]);

  const handleCreateExpense = async (payload: CreateExpensePayload) => {
    try {
      const item = await accountingService.createExpense(payload);
      await fetchCashFlow();
      return item;
    } catch (err) {
      console.error('Failed to create expense', err);
      return null;
    }
  };

  return (
    <div style={{ padding: '0', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <AccountingHeader
        title="Báo Cáo Lưu Chuyển Tiền Tệ & Đối Soát Công Nợ"
        subtitle="Theo dõi chi tiết dòng tiền vào từ khách hàng nạp tiền, dòng tiền ra chi trả mua tài khoản/nhà cung cấp và quản trị thanh khoản ngân quỹ."
        onOpenCreateModal={() => setModalOpen(true)}
        onRefresh={fetchCashFlow}
        loading={loading}
      />

      {/* 4 Cashflow Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Inflow */}
        <div
          style={{
            background: '#111622',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DÒNG TIỀN VÀO (INFLOW)</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <HiOutlineArrowTrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
            +{statement?.total_inflow_vnd ? Math.round(statement.total_inflow_vnd).toLocaleString('vi-VN') : '0'} đ
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Tổng tiền nạp từ khách hàng (Ngân hàng / MoMo)
          </div>
        </div>

        {/* Outflow */}
        <div
          style={{
            background: '#111622',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DÒNG TIỀN RA (OUTFLOW)</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <HiOutlineArrowTrendingDown size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
            -{statement?.total_outflow_vnd ? Math.round(statement.total_outflow_vnd).toLocaleString('vi-VN') : '0'} đ
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Tiền mua Acc Muse & nạp số dư NCC OpenAI
          </div>
        </div>

        {/* Net Cashflow */}
        <div
          style={{
            background: '#111622',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DÒNG TIỀN THUẦN (NET CASH)</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <HiOutlineScale size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: (statement?.net_cashflow_vnd || 0) >= 0 ? '#38bdf8' : '#f87171',
            }}
          >
            {statement?.net_cashflow_vnd ? Math.round(statement.net_cashflow_vnd).toLocaleString('vi-VN') : '0'} đ
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Số dư tiền mặt thực thu sau khi trừ hết chi phí vốn
          </div>
        </div>

        {/* Customer Liabilities */}
        <div
          style={{
            background: '#111622',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DƯ NỢ VÍ KHÁCH HÀNG</span>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <HiOutlineBanknotes size={18} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
            {statement?.customer_unearned_revenue_vnd
              ? Math.round(statement.customer_unearned_revenue_vnd).toLocaleString('vi-VN')
              : '0'}{' '}
            đ
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Doanh thu chưa thực hiện (Credits tồn đọng trong ví)
          </div>
        </div>
      </div>

      {/* Cash Movement Chronological Ledger */}
      <div
        style={{
          background: '#111622',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Sổ Nhật Ký Luân Chuyển Dòng Tiền (Cash Flow Journal)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              Bản ghi các khoản tiền thu từ nạp gói và tiền chi cho nhà cung cấp theo thời gian thực
            </p>
          </div>
          <span
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
            }}
          >
            {statement?.movements?.length || 0} Giao Dịch
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải nhật ký dòng tiền...</div>
        ) : !statement?.movements || statement.movements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Chưa có giao dịch dòng tiền nào</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '12px 16px' }}>Mã GD</th>
                  <th style={{ padding: '12px 16px' }}>Chiều Tiền</th>
                  <th style={{ padding: '12px 16px' }}>Kênh / Danh Mục</th>
                  <th style={{ padding: '12px 16px' }}>Đối Tác (User / NCC)</th>
                  <th style={{ padding: '12px 16px' }}>Nội Dung Chi Tiết</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Số Tiền (VND)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {statement.movements.map((m) => {
                  const isInflow = m.movement_type === 'INFLOW';
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {m.code}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isInflow ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isInflow ? '#34d399' : '#f87171',
                            border: `1px solid ${isInflow ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {isInflow ? '+' : '-'} {isInflow ? 'THU VÀO' : 'CHI RA'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                        {m.source}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                        {m.counterparty}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {m.description}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isInflow ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isInflow ? '+' : '-'}{Math.round(m.amount_vnd).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#34d399',
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>
                        {new Date(m.timestamp).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
};
