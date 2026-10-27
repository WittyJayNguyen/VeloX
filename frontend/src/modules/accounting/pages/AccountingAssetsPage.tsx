import React, { useEffect, useState, useCallback } from 'react';
import { accountingService } from '../services/accountingService';
import type { AccountingOverview, CreateExpensePayload } from '../types';
import { AccountingHeader } from '../components/AccountingHeader';
import { AccountInventoryTable } from '../components/AccountInventoryTable';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import {
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineCheckBadge,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

export const AccountingAssetsPage: React.FC = () => {
  const [overview, setOverview] = useState<AccountingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountingService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load asset audit data', err);
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

  const totalTokens = overview?.account_inventory?.reduce((acc, i) => acc + i.total_tokens, 0) || 0;
  const totalAccCount = overview?.account_inventory?.reduce((acc, i) => acc + i.account_count, 0) || 0;
  const totalValuation = overview?.remaining_assets_vnd || 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <AccountingHeader
        title="Kiểm Toán Tài Sản Kho Account AI & Hạn Mức Token"
        subtitle="Kiểm kê thực tế số lượng tài khoản AI đang vận hành, định giá nguyên giá tài sản, khấu hao hao mòn theo sản lượng job và giá trị còn lại trên sổ sách."
        onOpenCreateModal={() => setModalOpen(true)}
        onRefresh={fetchOverview}
        loading={loading}
      />

      {/* Asset Audit Highlight Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#111622',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <HiOutlineCircleStack size={18} />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>TỔNG TÀI SẢN KHO CÒN LẠI</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {Math.round(totalValuation).toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
            Định giá sổ sách chưa khấu hao hết
          </div>
        </div>

        <div
          style={{
            background: '#111622',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <HiOutlineCpuChip size={18} />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>DUNG LƯỢNG TOKEN DỰ TRỮ</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {(totalTokens / 1_000_000_000).toFixed(1)} Tỷ Token
          </div>
          <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '4px' }}>
            Từ các tài khoản Muse 31B và 1B trong pool
          </div>
        </div>

        <div
          style={{
            background: '#111622',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <HiOutlineCheckBadge size={18} />
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>TỔNG ACC & VÍ API</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
            {totalAccCount} Tài Khoản
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
            Sẵn sàng cấp phát pool tự động 24/7
          </div>
        </div>
      </div>

      {/* Guide Note Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '10px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: '24px',
        }}
      >
        <HiOutlineInformationCircle size={20} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong style={{ color: '#ffffff' }}>Nguyên tắc kiểm toán tài sản AI VeloX:</strong> Tài khoản AI (Muse 31B: 30.000đ, Muse 1B: 5.000đ) được ghi nhận là Tài sản lưu động (Current Assets). Khi người dùng hoặc Developer gọi API tạo video/ảnh, hệ thống ghi nhận hao mòn thực tế và trừ dần vào giá trị còn lại cho đến khi hết token hoặc bị khóa.
        </div>
      </div>

      {/* Main Asset Inventory Table */}
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
