import { useState } from 'react';
import { HiOutlinePlus, HiOutlineCreditCard, HiOutlineCheckCircle, HiOutlineArrowPath } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { Tabs } from '@modules/core/design-system/Tabs';
import { SearchInput, StatCard } from '@modules/core/design-system/Components';

export interface CreditPackage { id: string; name: string; priceVnd: number; credits: number; bonusPercent: number; isPopular?: boolean; }
export interface TransactionRecord { id: string; userEmail: string; amountVnd: number; creditsGiven: number; method: 'VietQR' | 'MoMo' | 'VCC_Card' | 'Bank_Transfer'; status: 'SUCCESS' | 'PENDING' | 'REFUNDED'; createdAt: string; }

const initialPackages: CreditPackage[] = [
  { id: 'pkg_1', name: 'Starter Gói Nhỏ', priceVnd: 50000, credits: 50000, bonusPercent: 0 },
  { id: 'pkg_2', name: 'Pro Gói Tiêu Chuẩn', priceVnd: 200000, credits: 220000, bonusPercent: 10, isPopular: true },
  { id: 'pkg_3', name: 'Studio Gói Chuyên Nghiệp', priceVnd: 500000, credits: 600000, bonusPercent: 20 },
  { id: 'pkg_4', name: 'Enterprise Gói Doanh Nghiệp', priceVnd: 2000000, credits: 2600000, bonusPercent: 30 },
];

const initialTx: TransactionRecord[] = [
  { id: 'TX-88219', userEmail: 'studio.vn@gmail.com', amountVnd: 500000, creditsGiven: 600000, method: 'VietQR', status: 'SUCCESS', createdAt: '2026-10-26 21:40' },
  { id: 'TX-88218', userEmail: 'dev.anh@gmail.com', amountVnd: 200000, creditsGiven: 220000, method: 'MoMo', status: 'SUCCESS', createdAt: '2026-10-26 20:15' },
  { id: 'TX-88217', userEmail: 'corporate@agency.com', amountVnd: 2000000, creditsGiven: 2600000, method: 'Bank_Transfer', status: 'PENDING', createdAt: '2026-10-26 18:00' },
  { id: 'TX-88216', userEmail: 'test.user@yahoo.com', amountVnd: 50000, creditsGiven: 50000, method: 'VCC_Card', status: 'REFUNDED', createdAt: '2026-10-26 14:20' },
];

const txBadge = (s: string) => s === 'SUCCESS' ? 'success' : s === 'PENDING' ? 'warning' : 'danger' as const;
const txLabel: Record<string, string> = { SUCCESS: 'Thành Công', PENDING: 'Chờ Xử Lý', REFUNDED: 'Đã Hoàn' };

const BillingPage = () => {
  const [packages, setPackages] = useState<CreditPackage[]>(() => { const s = localStorage.getItem('velox_packages'); return s ? JSON.parse(s) : initialPackages; });
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => { const s = localStorage.getItem('velox_transactions'); return s ? JSON.parse(s) : initialTx; });
  const [searchTx, setSearchTx] = useState('');
  const [txPage, setTxPage] = useState(1);

  // Package Modal
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgCredits, setPkgCredits] = useState(0);
  const [pkgBonus, setPkgBonus] = useState(0);

  const savePkg = (u: CreditPackage[]) => { setPackages(u); localStorage.setItem('velox_packages', JSON.stringify(u)); };
  const saveTx = (u: TransactionRecord[]) => { setTransactions(u); localStorage.setItem('velox_transactions', JSON.stringify(u)); };

  const handleOpenAddPkg = () => { setEditingPkg(null); setPkgName(''); setPkgPrice(0); setPkgCredits(0); setPkgBonus(0); setShowPkgModal(true); };
  const handleEditPkg = (p: CreditPackage) => { setEditingPkg(p); setPkgName(p.name); setPkgPrice(p.priceVnd); setPkgCredits(p.credits); setPkgBonus(p.bonusPercent); setShowPkgModal(true); };

  const handleSavePkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    if (editingPkg) { savePkg(packages.map((p) => p.id === editingPkg.id ? { ...p, name: pkgName, priceVnd: pkgPrice, credits: pkgCredits, bonusPercent: pkgBonus } : p)); }
    else { savePkg([...packages, { id: `pkg_${Date.now()}`, name: pkgName, priceVnd: pkgPrice, credits: pkgCredits, bonusPercent: pkgBonus }]); }
    setShowPkgModal(false);
  };

  const handleRefundTx = (id: string) => { if (confirm('Hoàn tiền giao dịch này?')) saveTx(transactions.map((t) => t.id === id ? { ...t, status: 'REFUNDED' as const } : t)); };

  const totalRevenue = transactions.filter((t) => t.status === 'SUCCESS').reduce((s, t) => s + t.amountVnd, 0);
  const filteredTx = transactions.filter((t) => t.id.includes(searchTx) || t.userEmail.toLowerCase().includes(searchTx.toLowerCase()));

  const txColumns: TableColumn<TransactionRecord>[] = [
    { key: 'id', header: 'Mã GD', render: (t) => <strong style={{ color: '#6366f1' }}>{t.id}</strong> },
    { key: 'userEmail', header: 'Email KH', render: (t) => <span style={{ fontSize: '0.8rem' }}>{t.userEmail}</span> },
    { key: 'amountVnd', header: 'Số Tiền (₫)', align: 'right', render: (t) => <strong>{t.amountVnd.toLocaleString()} ₫</strong> },
    { key: 'creditsGiven', header: 'Credits', align: 'right', render: (t) => <span style={{ color: '#10b981', fontWeight: 600 }}>{t.creditsGiven.toLocaleString()} cr</span> },
    { key: 'method', header: 'Phương Thức', render: (t) => <Badge variant="neutral" size="sm">{t.method}</Badge> },
    { key: 'status', header: 'Trạng Thái', render: (t) => <Badge variant={txBadge(t.status)} size="sm" dot>{txLabel[t.status]}</Badge> },
    { key: 'createdAt', header: 'Thời Gian', render: (t) => <span style={{ color: '#71717a', fontSize: '0.78rem' }}>{t.createdAt}</span> },
    { key: 'actions', header: '', align: 'center', render: (t) => t.status === 'SUCCESS' ? <Button variant="ghost" size="sm" onClick={() => handleRefundTx(t.id)} title="Hoàn"><HiOutlineArrowPath size={14} /></Button> : null },
  ];

  const packagesTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="md" onClick={handleOpenAddPkg}><HiOutlinePlus size={16} /> Thêm Gói</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {packages.map((pkg) => (
          <Card key={pkg.id} padding="md">
            <div style={{ textAlign: 'center' }}>
              {pkg.isPopular && <Badge variant="warning" size="sm">⭐ Phổ biến</Badge>}
              <h3 style={{ color: '#fafafa', margin: '0.5rem 0 0.25rem', fontSize: '1rem' }}>{pkg.name}</h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1' }}>{pkg.priceVnd.toLocaleString()} ₫</div>
              <div style={{ color: '#10b981', fontWeight: 700, margin: '0.3rem 0' }}>{pkg.credits.toLocaleString()} Credits</div>
              {pkg.bonusPercent > 0 && <Badge variant="success" size="sm">+{pkg.bonusPercent}% Bonus</Badge>}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: '1rem' }}>
                <Button variant="outline" size="sm" onClick={() => handleEditPkg(pkg)}>Sửa</Button>
                <Button variant="ghost" size="sm" onClick={() => savePkg(packages.filter((p) => p.id !== pkg.id))}>Xoá</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const txTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Tổng Doanh Thu" value={`${totalRevenue.toLocaleString()} ₫`} color="#10b981" icon="💰" />
        <StatCard label="Tổng Giao Dịch" value={transactions.length} color="#6366f1" icon="📋" />
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
        { key: 'packages', label: '📦 Gói Credit', icon: <HiOutlineCreditCard size={16} />, content: packagesTab },
        { key: 'transactions', label: '📋 Giao Dịch', icon: <HiOutlineCheckCircle size={16} />, content: txTab },
      ]} defaultKey="packages" />

      <Modal open={showPkgModal} onClose={() => setShowPkgModal(false)} title={editingPkg ? 'Cập Nhật Gói' : 'Thêm Gói Mới'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowPkgModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSavePkg}>Lưu</Button></>}
      >
        <form onSubmit={handleSavePkg} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên Gói" value={pkgName} onChange={(e) => setPkgName(e.target.value)} required fullWidth />
          <Input label="Giá (VNĐ)" type="number" value={pkgPrice} onChange={(e) => setPkgPrice(Number(e.target.value))} fullWidth />
          <Input label="Credits" type="number" value={pkgCredits} onChange={(e) => setPkgCredits(Number(e.target.value))} fullWidth />
          <Input label="Bonus (%)" type="number" value={pkgBonus} onChange={(e) => setPkgBonus(Number(e.target.value))} hint="0 = không bonus" fullWidth />
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
