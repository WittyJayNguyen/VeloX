import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineBanknotes, HiOutlinePlus, HiOutlineArrowPath,
  HiOutlineShieldCheck
} from 'react-icons/hi2';
import { accountingService } from '../services/accountingService';
import type { AccountingOverview, ExpenseItem, CreateExpensePayload } from '../types';
import { AccountingStatsCards } from '../components/AccountingStatsCards';
import { AccountInventoryTable } from '../components/AccountInventoryTable';
import { ExpenseTable } from '../components/ExpenseTable';
import { CreateExpenseModal } from '../components/CreateExpenseModal';

export const AccountingPage: React.FC = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<AccountingOverview | null>(null);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovData, expData] = await Promise.all([
        accountingService.getOverview(),
        accountingService.listExpenses(category, page, pageSize),
      ]);
      setOverview(ovData);
      setExpenses(expData.items);
      setTotalExpenses(expData.total);
    } catch (err) {
      console.error('Failed to load accounting data:', err);
    } finally {
      setLoading(false);
    }
  }, [category, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (payload: CreateExpensePayload): Promise<ExpenseItem | null> => {
    try {
      const created = await accountingService.createExpense(payload);
      fetchData();
      return created;
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Không thể ghi nhận chi phí');
      return null;
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bút toán "${title}"?`)) return;
    try {
      await accountingService.deleteExpense(id);
      fetchData();
    } catch (err) {
      alert('Không thể xóa bút toán');
    }
  };

  const totalPages = Math.ceil(totalExpenses / pageSize) || 1;

  const categories = [
    { key: 'ALL', label: 'Tất Cả Khoản Chi' },
    { key: 'ACCOUNT_PURCHASE', label: 'Mua Account AI' },
    { key: 'PROVIDER_TOPUP', label: 'Nạp Ví NCC' },
    { key: 'CAPTCHA_SOLVER', label: 'Giải Captcha' },
    { key: 'PROXY_NETWORK', label: 'Proxy IP' },
    { key: 'SERVER_INFRA', label: 'Hạ Tầng Server' },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex' }}>
            <HiOutlineBanknotes size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
              {t('admin.accounting.header_title', 'Kế Toán & Kiểm Toán Tài Sản VeloX')}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {t('admin.accounting.header_subtitle', 'Báo cáo Lời - Lỗ (P&L), Định giá kho tài khoản, Khấu hao dịch vụ (COGS) và Dòng tiền nhà cung cấp.')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchData}
            title="Làm mới sổ kế toán"
            style={{
              padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: '#1a1f2e', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <HiOutlineArrowPath className={loading ? 'spin' : ''} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
            }}
          >
            <HiOutlinePlus size={18} /> Ghi Nhận Nhập Acc / Chi Phí
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !overview ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Đang tính toán sổ kế toán...</div>
      ) : overview && (
        <>
          {/* KPI Cards */}
          <AccountingStatsCards data={overview} />

          {/* Account Inventory Valuation Table */}
          <AccountInventoryTable items={overview.account_inventory} />

          {/* Expenses Filter & Table */}
          <div style={{
            background: '#131722', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
            padding: '20px', marginTop: '24px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                <HiOutlineShieldCheck size={20} color="#10b981" />
                <span>Nhật Ký Bút Toán Chi Tiền & Nhập Kho Tài Khoản</span>
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => { setCategory(c.key); setPage(1); }}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: 'none',
                      background: category === c.key ? '#6366f1' : '#1a1f2e',
                      color: category === c.key ? '#fff' : '#94a3b8',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <ExpenseTable items={expenses} onDelete={handleDelete} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginTop: '20px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                    background: '#1a1f2e', color: page <= 1 ? '#475569' : '#cbd5e1',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px'
                  }}
                >
                  Trang Trước
                </button>
                <span style={{ fontSize: '12px', color: '#94a3b8', margin: '0 6px' }}>
                  Trang {page} / {totalPages} (Tổng: {totalExpenses} bút toán)
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                    background: '#1a1f2e', color: page >= totalPages ? '#475569' : '#cbd5e1',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px'
                  }}
                >
                  Trang Sau
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default AccountingPage;
