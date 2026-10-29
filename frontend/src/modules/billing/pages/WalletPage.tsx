import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineWallet,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { billingService } from '../services/billingService';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { Tabs } from '@modules/core/design-system/Tabs';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';

// ── Types ──
export interface TopUpTransaction {
  id: string;
  userEmail: string;
  packageName: string;
  amountVnd: number;
  creditsGiven: number;
  method: 'VietQR' | 'MoMo' | 'Bank_Transfer' | 'VCC_Card';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  createdAt: string;
}

export interface CashFlowRecord {
  id: string;
  type: 'TOPUP' | 'CONSUME' | 'REFUND';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

const WalletPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'topup' | 'cashflow'>('topup');
  const [topUpList, setTopUpList] = useState<TopUpTransaction[]>([]);
  const [cashFlowList, setCashFlowList] = useState<CashFlowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, flow] = await Promise.all([
        billingService.getAdminTransactions(),
        billingService.getAdminCashFlow(),
      ]);
      if (Array.isArray(txs)) {
        setTopUpList(txs);
      }
      if (Array.isArray(flow)) {
        setCashFlowList(flow);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  // Manual Top-Up Modal
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalAmount, setModalAmount] = useState(189000);
  const [modalCredits, setModalCredits] = useState(2000);
  const [modalTier, setModalTier] = useState<string>('STARTER');
  const [modalDays, setModalDays] = useState<number>(30);
  const [modalMethod, setModalMethod] = useState<TopUpTransaction['method']>('VietQR');

  // Stats
  const totalTopUp = topUpList.filter((t) => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amountVnd, 0);
  const totalConsume = Math.abs(cashFlowList.filter((c) => c.type === 'CONSUME').reduce((acc, c) => acc + c.amount, 0));
  const currentBalance = Math.max(0, totalTopUp - totalConsume);
  const successTxCount = topUpList.filter((t) => t.status === 'SUCCESS').length;

  const handleManualTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim()) return;

    setSubmitting(true);
    try {
      await billingService.manualTopUp({
        email: modalEmail.trim(),
        amount_vnd: Number(modalAmount),
        credits: Number(modalCredits),
        method: modalMethod,
        note: `Nạp thủ công Admin (${Number(modalCredits).toLocaleString()} credits - Gói ${modalTier} hạn ${modalDays} ngày)`,
        tier: modalTier,
        duration_days: Number(modalDays),
      });
      setShowTopUpModal(false);
      setModalEmail('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Không thể thực hiện nạp tiền');
    } finally {
      setSubmitting(false);
    }
  };

  // TopUp table columns
  const filteredTopUp = topUpList.filter((t) => {
    const matchSearch = t.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMethod = filterMethod === 'ALL' || t.method === filterMethod;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchMethod && matchStatus;
  });

  const topUpColumns: TableColumn<TopUpTransaction>[] = [
    {
      key: 'id',
      header: 'Mã Giao Dịch',
      render: (t) => (
        <div>
          <strong style={{ color: '#fafafa' }}>{t.id}</strong>
          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{t.createdAt}</div>
        </div>
      ),
    },
    {
      key: 'userEmail',
      header: 'Tài Khoản / Khách Hàng',
      render: (t) => (
        <div>
          <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{t.userEmail}</span>
          <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Gói: {t.packageName}</div>
        </div>
      ),
    },
    {
      key: 'amountVnd',
      header: 'Số Tiền Nạp',
      render: (t) => (
        <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>
          +{t.amountVnd.toLocaleString()} ₫
        </strong>
      ),
    },
    {
      key: 'creditsGiven',
      header: 'Credit Nhận',
      render: (t) => (
        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
          {t.creditsGiven.toLocaleString()} pts
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Cổng Nạp',
      render: (t) => {
        let badgeVariant: 'primary' | 'info' | 'warning' | 'purple' = 'primary';
        if (t.method === 'VietQR') badgeVariant = 'info';
        else if (t.method === 'MoMo') badgeVariant = 'purple';
        else if (t.method === 'Bank_Transfer') badgeVariant = 'primary';
        return <Badge variant={badgeVariant} size="sm">{t.method}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (t) => {
        const variant = t.status === 'SUCCESS' ? 'success' : t.status === 'PENDING' ? 'warning' : 'danger';
        const label = t.status === 'SUCCESS' ? 'Thành công' : t.status === 'PENDING' ? 'Chờ xử lý' : 'Đã hoàn';
        return <Badge variant={variant} size="sm" dot>{label}</Badge>;
      },
    },
  ];

  // Cash flow table columns
  const filteredCashFlow = cashFlowList.filter((c) =>
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cashFlowColumns: TableColumn<CashFlowRecord>[] = [
    {
      key: 'id',
      header: 'Loại Giao Dịch',
      render: (c) => {
        const isTopUp = c.type === 'TOPUP';
        const isRefund = c.type === 'REFUND';
        return (
          <Badge variant={isTopUp ? 'success' : isRefund ? 'purple' : 'danger'} size="sm">
            {isTopUp ? 'Nạp Tiền' : isRefund ? 'Hoàn Tiền' : 'Chi Tiêu AI'}
          </Badge>
        );
      },
    },
    {
      key: 'description',
      header: 'Mô Tả Biến Động',
      render: (c) => (
        <div>
          <span style={{ color: '#e4e4e7' }}>{c.description}</span>
          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{c.createdAt}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Số Tiền Biến Động',
      render: (c) => {
        const isPositive = c.amount > 0;
        return (
          <strong style={{ color: isPositive ? '#10b981' : '#f43f5e' }}>
            {isPositive ? `+${c.amount.toLocaleString()}` : `${c.amount.toLocaleString()}`} ₫
          </strong>
        );
      },
    },
    {
      key: 'balanceAfter',
      header: 'Số Dư Sau Biến Động',
      align: 'right',
      render: (c) => (
        <span style={{ color: '#a1a1aa', fontWeight: 600 }}>
          {c.balanceAfter.toLocaleString()} ₫
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title={t('admin.wallet.available_balance', 'Số Dư Ví Khả Dụng')} value={`${currentBalance.toLocaleString()} ₫`} icon={<HiOutlineWallet size={22} />} change="Sẵn sàng gọi API" changeType="up" />
        <StatCard title={t('admin.wallet.total_deposited', 'Tổng Tiền Đã Nạp')} value={`${(totalTopUp / 1000000).toFixed(2)}M ₫`} icon={<HiOutlineArrowTrendingUp size={22} />} change={`${successTxCount} giao dịch thành công`} changeType="up" />
        <StatCard title={t('admin.wallet.total_consumed', 'Tổng Tiêu Thụ AI')} value={`${(totalConsume / 1000000).toFixed(2)}M ₫`} icon={<HiOutlineArrowTrendingDown size={22} />} change="Chi phí vận hành model" changeType="neutral" />
        <StatCard title={t('admin.wallet.success_tx', 'Giao Dịch Nạp Thành Công')} value={`${successTxCount} / ${topUpList.length}`} icon={<HiOutlineCheckCircle size={22} />} change="Tỷ lệ 98.5%" changeType="up" />
      </div>

      {/* Tabs Switcher */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Tabs
            variant="pill"
            items={[
              { key: 'topup', label: `${t('admin.wallet.tab_topup', 'Lịch Sử Nạp Tiền')} (${topUpList.length})` },
              { key: 'cashflow', label: `${t('admin.wallet.tab_cashflow', 'Biến Động Dòng Tiền')} (${cashFlowList.length})` },
            ]}
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as 'topup' | 'cashflow');
              setPage(1);
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="md" onClick={loadData} loading={loading}>
              <HiOutlineArrowPath size={16} /> Làm Mới
            </Button>
            <Button variant="primary" size="md" onClick={() => setShowTopUpModal(true)}>
              <HiOutlinePlus size={16} /> {t('admin.wallet.btn_manual_topup', 'Nạp Tiền Thủ Công')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Table */}
      {activeTab === 'topup' ? (
        <Card
          title={t('admin.wallet.tx_history_title', 'Lịch Sử Giao Dịch Nạp Tiền & Đối Soát')}
          subtitle={`Đang hiển thị ${filteredTopUp.length} giao dịch nạp tiền qua VietQR, MoMo, Ngân Hàng`}
          headerRight={<HiOutlineCreditCard size={20} style={{ color: '#10b981' }} />}
          padding="none"
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #27272a', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Tìm theo email khách, mã TX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả cổng nạp' },
                { value: 'VietQR', label: 'VietQR' },
                { value: 'MoMo', label: 'MoMo' },
                { value: 'Bank_Transfer', label: 'Chuyển Khoản' },
                { value: 'VCC_Card', label: 'Thẻ Quốc Tế' },
              ]}
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            />
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'SUCCESS', label: 'Thành công' },
                { value: 'PENDING', label: 'Chờ xử lý' },
                { value: 'REFUNDED', label: 'Đã hoàn tiền' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
          <Table columns={topUpColumns} data={filteredTopUp} rowKey={(t) => t.id} page={page} pageSize={10} onPageChange={setPage} />
        </Card>
      ) : (
        <Card
          title="Báo Cáo Biến Động Số Dư & Dòng Tiền Hệ Thống"
          subtitle={`Theo dõi toàn bộ dòng tiền nạp vào, hoàn tiền và mức tiêu thụ chi phí AI`}
          headerRight={<HiOutlineBanknotes size={20} style={{ color: '#6366f1' }} />}
          padding="none"
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #27272a', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Tìm mô tả biến động số dư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <Table columns={cashFlowColumns} data={filteredCashFlow} rowKey={(c) => c.id} page={page} pageSize={10} onPageChange={setPage} />
        </Card>
      )}

      {/* Modal Nạp Tiền Thủ Công */}
      <Modal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        title="Tạo Lệnh Nạp Tiền / Cộng Credit Thủ Công"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTopUpModal(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleManualTopUp} loading={submitting}>
              Xác Nhận Nạp Tiền
            </Button>
          </>
        }
      >
        <form onSubmit={handleManualTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Email Tài Khoản Khách Hàng"
            type="email"
            value={modalEmail}
            onChange={(e) => setModalEmail(e.target.value)}
            placeholder="client@company.com"
            required
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Số Tiền Nạp (VNĐ)"
              type="number"
              value={modalAmount}
              onChange={(e) => setModalAmount(Number(e.target.value))}
              required
              fullWidth
            />
            <Input
              label="Credit Cộng Thêm"
              type="number"
              value={modalCredits}
              onChange={(e) => setModalCredits(Number(e.target.value))}
              required
              fullWidth
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
            <Select
              label="Gói Thuê Bao (Tier)"
              options={[
                { value: 'STARTER', label: 'Creator Standard (STARTER)' },
                { value: 'PRO', label: 'Pro Developer (PRO)' },
                { value: 'ENTERPRISE', label: 'Enterprise AI (ENTERPRISE)' },
                { value: 'FREE', label: 'Không đổi gói (FREE)' },
              ]}
              value={modalTier}
              onChange={(e) => setModalTier(e.target.value)}
              fullWidth
            />
            <Input
              label="Thời Hạn Gói (Ngày)"
              type="number"
              value={modalDays}
              onChange={(e) => setModalDays(Number(e.target.value))}
              required
              fullWidth
            />
          </div>
          <Select
            label="Hình Thức Thanh Toán"
            options={[
              { value: 'VietQR', label: 'VietQR Pro' },
              { value: 'Bank_Transfer', label: 'Chuyển Khoản Ngân Hàng' },
              { value: 'MoMo', label: 'Ví Điện Tử MoMo' },
              { value: 'VCC_Card', label: 'Thẻ Quốc Tế Visa/Master' },
            ]}
            value={modalMethod}
            onChange={(e) => setModalMethod(e.target.value as TopUpTransaction['method'])}
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
};

export default WalletPage;
