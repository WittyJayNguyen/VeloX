import { useState } from 'react';
import { HiOutlinePlus, HiOutlineCreditCard, HiOutlineCheckCircle, HiOutlineArrowPath, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCheck, HiOutlineBanknotes, HiOutlineClock, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { Tabs } from '@modules/core/design-system/Tabs';
import { SearchInput, StatCard, Toggle } from '@modules/core/design-system/Components';
import styles from '@assets/scss/admin/billing-cards.module.scss';

export interface CreditPackage {
  id: string; name: string; subtitle: string; priceVnd: number; credits: number;
  bonusPercent: number; isPopular?: boolean; features: string[];
}
export interface TransactionRecord {
  id: string; userEmail: string; amountVnd: number; creditsGiven: number;
  method: 'VietQR' | 'MoMo' | 'VCC_Card' | 'Bank_Transfer';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED'; createdAt: string;
}

const initialPackages: CreditPackage[] = [
  {
    id: 'pkg_1', name: 'STARTER', subtitle: 'Bắt đầu nhẹ nhàng',
    priceVnd: 50000, credits: 50000, bonusPercent: 0,
    features: ['Truy cập 10+ Models cơ bản', 'Giám sát request đơn giản', 'Cộng đồng hỗ trợ', 'Email support'],
  },
  {
    id: 'pkg_2', name: 'PRO', subtitle: 'Lựa chọn phổ biến nhất',
    priceVnd: 200000, credits: 220000, bonusPercent: 10, isPopular: true,
    features: ['Truy cập 100+ Models', 'AI Load Balancer tự động', 'Phân tích nâng cao', 'Webhook & Realtime', 'Quản lý nhiều Pool', 'Ưu tiên hỗ trợ kỹ thuật'],
  },
  {
    id: 'pkg_3', name: 'STUDIO', subtitle: 'Cho chuyên gia sáng tạo',
    priceVnd: 500000, credits: 600000, bonusPercent: 20,
    features: ['Mọi tính năng Pro', 'Image & Video generation', 'Custom routing strategies', 'Dedicated rate limits', 'Phân tích chi phí nâng cao', 'Hỗ trợ priority 24/7'],
  },
  {
    id: 'pkg_4', name: 'ENTERPRISE', subtitle: 'Cho doanh nghiệp lớn',
    priceVnd: 2000000, credits: 2600000, bonusPercent: 30,
    features: ['Mọi tính năng Studio', 'Dedicated Gateway instance', 'White-label branding', 'SLA 99.95% uptime', 'API Rate limit không giới hạn', 'Account Manager riêng'],
  },
];

const initialTx: TransactionRecord[] = [];

const txBadge = (s: string) => s === 'SUCCESS' ? 'success' : s === 'PENDING' ? 'warning' : 'danger' as const;
const txLabel: Record<string, string> = { SUCCESS: 'Thành Công', PENDING: 'Chờ Xử Lý', REFUNDED: 'Đã Hoàn' };

const BillingPage = () => {
  const [packages, setPackages] = useState<CreditPackage[]>(() => { const s = localStorage.getItem('velox_packages_v2'); return s ? JSON.parse(s) : initialPackages; });
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const s = localStorage.getItem('velox_transactions');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.some((x: any) => x.id === 'TX-88219')) {
          localStorage.removeItem('velox_transactions');
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return initialTx;
  });
  const [searchTx, setSearchTx] = useState('');
  const [txPage, setTxPage] = useState(1);

  // Package Modal
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgSubtitle, setPkgSubtitle] = useState('');
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgCredits, setPkgCredits] = useState(0);
  const [pkgBonus, setPkgBonus] = useState(0);
  const [pkgPopular, setPkgPopular] = useState(false);

  const savePkg = (u: CreditPackage[]) => { setPackages(u); localStorage.setItem('velox_packages_v2', JSON.stringify(u)); };
  const saveTx = (u: TransactionRecord[]) => { setTransactions(u); localStorage.setItem('velox_transactions', JSON.stringify(u)); };

  const handleOpenAddPkg = () => { setEditingPkg(null); setPkgName(''); setPkgSubtitle(''); setPkgPrice(0); setPkgCredits(0); setPkgBonus(0); setPkgPopular(false); setShowPkgModal(true); };
  const handleEditPkg = (p: CreditPackage) => { setEditingPkg(p); setPkgName(p.name); setPkgSubtitle(p.subtitle); setPkgPrice(p.priceVnd); setPkgCredits(p.credits); setPkgBonus(p.bonusPercent); setPkgPopular(!!p.isPopular); setShowPkgModal(true); };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    if (editingPkg) {
      savePkg(packages.map((p) => p.id === editingPkg.id ? { ...p, name: pkgName, subtitle: pkgSubtitle, priceVnd: pkgPrice, credits: pkgCredits, bonusPercent: pkgBonus, isPopular: pkgPopular } : p));
    } else {
      savePkg([...packages, { id: `pkg_${Date.now()}`, name: pkgName, subtitle: pkgSubtitle, priceVnd: pkgPrice, credits: pkgCredits, bonusPercent: pkgBonus, isPopular: pkgPopular, features: [] }]);
    }
    setShowPkgModal(false);
  };

  const handleDeletePkg = (id: string) => { if (confirm('Xoá gói này?')) savePkg(packages.filter((p) => p.id !== id)); };
  const handleRefundTx = (id: string) => { if (confirm('Hoàn tiền giao dịch này?')) saveTx(transactions.map((t) => t.id === id ? { ...t, status: 'REFUNDED' as const } : t)); };

  const totalRevenue = transactions.filter((t) => t.status === 'SUCCESS').reduce((s, t) => s + t.amountVnd, 0);
  const totalPending = transactions.filter((t) => t.status === 'PENDING').reduce((s, t) => s + t.amountVnd, 0);
  const filteredTx = transactions.filter((t) => t.id.includes(searchTx) || t.userEmail.toLowerCase().includes(searchTx.toLowerCase()));

  const txColumns: TableColumn<TransactionRecord>[] = [
    { key: 'id', header: 'Mã GD', render: (t) => <strong style={{ color: '#6366f1' }}>{t.id}</strong> },
    { key: 'userEmail', header: 'Email KH', render: (t) => <span style={{ fontSize: '0.8rem' }}>{t.userEmail}</span> },
    { key: 'amountVnd', header: 'Số Tiền (₫)', align: 'right', render: (t) => <strong>{t.amountVnd.toLocaleString()} ₫</strong> },
    { key: 'creditsGiven', header: 'Credits', align: 'right', render: (t) => <span style={{ color: '#10b981', fontWeight: 600 }}>{t.creditsGiven.toLocaleString()} cr</span> },
    { key: 'method', header: 'Phương Thức', render: (t) => <Badge variant="neutral" size="sm">{t.method.replace('_', ' ')}</Badge> },
    { key: 'status', header: 'Trạng Thái', render: (t) => <Badge variant={txBadge(t.status)} size="sm" dot>{txLabel[t.status]}</Badge> },
    { key: 'createdAt', header: 'Thời Gian', render: (t) => <span style={{ color: '#71717a', fontSize: '0.78rem' }}>{t.createdAt}</span> },
    { key: 'actions', header: '', align: 'center', render: (t) => t.status === 'SUCCESS' ? <Button variant="ghost" size="sm" onClick={() => handleRefundTx(t.id)} title="Hoàn tiền"><HiOutlineArrowPath size={14} /></Button> : null },
  ];

  // ── Packages Tab ──
  const packagesTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className={styles.pricingHeader}>
        <div>
          <p className={styles.pricingLabel}>QUẢN LÝ GÓI CREDIT</p>
          <h2 className={styles.pricingTitle}>Thiết Kế Gói <span className={styles.highlight}>Bảng Giá</span></h2>
          <p className={styles.pricingSubtitle}>Tạo, sửa, xoá gói credit. Gói có đánh dấu sẽ hiển thị "Most Popular" trên trang chủ.</p>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenAddPkg}><HiOutlinePlus size={16} /> Thêm Gói Mới</Button>
      </div>

      {/* Pricing Cards Grid */}
      <div className={styles.pricingGrid}>
        {packages.map((pkg) => (
          <div key={pkg.id} className={`${styles.pricingCard} ${pkg.isPopular ? styles.popular : ''}`}>
            {pkg.isPopular && <div className={styles.popularBadge}>MOST POPULAR</div>}

            {/* Admin controls */}
            <div className={styles.adminControls}>
              <button type="button" onClick={() => handleEditPkg(pkg)} title="Sửa"><HiOutlinePencilSquare size={15} /></button>
              <button type="button" onClick={() => handleDeletePkg(pkg.id)} title="Xoá"><HiOutlineTrash size={15} /></button>
            </div>

            <h3 className={styles.planName}>{pkg.name}</h3>
            <p className={styles.planSubtitle}>{pkg.subtitle}</p>

            <div className={styles.planPrice}>
              <span className={styles.priceValue}>{pkg.priceVnd.toLocaleString()}</span>
              <span className={styles.priceUnit}>₫</span>
            </div>

            <div className={styles.creditInfo}>
              <span className={styles.creditValue}>{pkg.credits.toLocaleString()} Credits</span>
              {pkg.bonusPercent > 0 && <span className={styles.bonusBadge}>+{pkg.bonusPercent}% BONUS</span>}
            </div>

            <ul className={styles.featureList}>
              {pkg.features.map((f) => (
                <li key={f}>
                  <span className={styles.checkIcon}><HiOutlineCheck size={14} /></span>
                  {f}
                </li>
              ))}
            </ul>

            <button type="button" className={`${styles.ctaBtn} ${pkg.isPopular ? styles.ctaPopular : ''}`}>
              {pkg.isPopular ? 'GÓI PHỔ BIẾN NHẤT' : 'CHỌN GÓI NÀY'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Transactions Tab ──
  const txTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Tổng Doanh Thu" value={`${totalRevenue.toLocaleString()} ₫`} color="#10b981" icon={<HiOutlineBanknotes size={22} />} />
        <StatCard label="Đang Chờ Xử Lý" value={`${totalPending.toLocaleString()} ₫`} color="#f59e0b" icon={<HiOutlineClock size={22} />} />
        <StatCard label="Tổng Giao Dịch" value={transactions.length} color="#6366f1" icon={<HiOutlineClipboardDocumentList size={22} />} />
      </div>
      <Card padding="sm">
        <SearchInput placeholder="Tìm mã GD hoặc email..." value={searchTx} onChange={(e) => setSearchTx(e.target.value)} onClear={() => setSearchTx('')} />
      </Card>
      <Card title="Lịch Sử Giao Dịch" subtitle={`${filteredTx.length} giao dịch`} padding="none">
        <Table columns={txColumns} data={filteredTx} rowKey={(t) => t.id} page={txPage} pageSize={10} onPageChange={setTxPage} />
      </Card>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Tabs variant="line" items={[
        { key: 'packages', label: 'Gói Credit', icon: <HiOutlineCreditCard size={16} />, content: packagesTab },
        { key: 'transactions', label: 'Lịch Sử Giao Dịch', icon: <HiOutlineCheckCircle size={16} />, content: txTab },
      ]} defaultKey="packages" />

      {/* Modal: Add/Edit Package */}
      <Modal open={showPkgModal} onClose={() => setShowPkgModal(false)} title={editingPkg ? 'Cập Nhật Gói Credit' : 'Tạo Gói Credit Mới'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowPkgModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSavePkg}>Lưu Gói</Button></>}
      >
        <form onSubmit={handleSavePkg} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên Gói (VD: PRO, STUDIO)" value={pkgName} onChange={(e) => setPkgName(e.target.value)} required fullWidth />
          <Input label="Mô Tả Ngắn" value={pkgSubtitle} onChange={(e) => setPkgSubtitle(e.target.value)} placeholder="Lựa chọn phổ biến nhất" fullWidth />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="Giá (VNĐ)" type="number" value={pkgPrice} onChange={(e) => setPkgPrice(Number(e.target.value))} fullWidth />
            <Input label="Credits" type="number" value={pkgCredits} onChange={(e) => setPkgCredits(Number(e.target.value))} fullWidth />
          </div>
          <Input label="Bonus (%)" type="number" value={pkgBonus} onChange={(e) => setPkgBonus(Number(e.target.value))} hint="0 = không bonus" fullWidth />
          <Toggle label="Đánh dấu Most Popular" checked={pkgPopular} onChange={setPkgPopular} />
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
