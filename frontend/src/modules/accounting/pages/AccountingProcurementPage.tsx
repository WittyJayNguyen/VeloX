import React, { useEffect, useState, useCallback } from 'react';
import { accountingService } from '../services/accountingService';
import type { ExpenseItem, CreateExpensePayload } from '../types';
import { AccountingHeader } from '../components/AccountingHeader';
import { ExpenseTable } from '../components/ExpenseTable';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import {
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
} from 'react-icons/hi2';

export const AccountingProcurementPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountingService.listExpenses(category, page, pageSize);
      setExpenses(res.items);
      setTotal(res.total);
      setTotalAmount(res.total_amount_vnd);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, [category, page, pageSize]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreateExpense = async (payload: CreateExpensePayload) => {
    try {
      const item = await accountingService.createExpense(payload);
      await fetchExpenses();
      return item;
    } catch (err) {
      console.error('Failed to create expense', err);
      return null;
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bút toán chi "${title}" khỏi sổ cái kế toán?`)) {
      return;
    }
    try {
      await accountingService.deleteExpense(id);
      await fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense', err);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.provider.toLowerCase().includes(search.toLowerCase()) ||
      e.entry_code.toLowerCase().includes(search.toLowerCase()) ||
      (e.invoice_code && e.invoice_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '0', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <AccountingHeader
        title="Nhập Mua Acc & Nạp Tiền Ví API Nhà Cung Cấp"
        subtitle="Quản lý toàn bộ sổ cái phiếu chi, hóa đơn mua tài khoản AI, nạp tiền ví API upstream và đối soát thanh toán."
        onOpenCreateModal={() => setModalOpen(true)}
        onRefresh={fetchExpenses}
        loading={loading}
      />

      {/* Control Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
          padding: '16px',
          background: '#111622',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              flex: '1 1 200px',
            }}
          >
            <HiOutlineMagnifyingGlass size={16} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Tìm theo mã phiếu (EXP-...), NCC, hoặc tiêu đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineFunnel size={16} style={{ color: '#64748b' }} />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              style={{
                background: '#0d1117',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất Cả Danh Mục Chi</option>
              <option value="ACCOUNT_PURCHASE">Nhập Mua Acc (Muse, Midjourney...)</option>
              <option value="PROVIDER_TOPUP">Nạp Tiền Ví API (OpenAI, Anthropic...)</option>
              <option value="CAPTCHA_SOLVER">Giải Captcha (2Captcha...)</option>
              <option value="PROXY_NETWORK">Thuê Proxy & IP Xoay</option>
              <option value="SERVER_INFRA">Hạ Tầng Cloud & VPS</option>
              <option value="OTHER">Chi Phí Vận Hành Khác</option>
            </select>
          </div>
        </div>

        {/* Right Info: Total Capital Disbursed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>TỔNG TIỀN ĐÃ CHI TRẢ</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
              {Math.round(totalAmount).toLocaleString('vi-VN')} đ
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <HiOutlinePlus size={16} />
            <span>Tạo Phiếu Chi</span>
          </button>
        </div>
      </div>

      {/* Expense Ledger Table */}
      <ExpenseTable
        items={filteredExpenses}
        onDelete={handleDeleteExpense}
      />

      {/* Pagination */}
      {total > pageSize && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            fontSize: '13px',
            color: '#94a3b8',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>
            Hiển thị {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} trong tổng số{' '}
            {total} bút toán
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#1a1f2e',
                border: '1px solid rgba(255,255,255,0.1)',
                color: page === 1 ? '#475569' : '#fff',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Trang Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#1a1f2e',
                border: '1px solid rgba(255,255,255,0.1)',
                color: page * pageSize >= total ? '#475569' : '#fff',
                cursor: page * pageSize >= total ? 'not-allowed' : 'pointer',
              }}
            >
              Trang Tiếp
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
};
