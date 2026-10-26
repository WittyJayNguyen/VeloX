import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

export interface CreditPackage {
  id: string;
  name: string;
  priceVnd: number;
  credits: number;
  bonusPercent: number;
  isPopular?: boolean;
}

export interface TransactionRecord {
  id: string;
  userEmail: string;
  amountVnd: number;
  creditsGiven: number;
  method: 'VietQR' | 'MoMo' | 'VCC_Card' | 'Bank_Transfer';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  createdAt: string;
}

const initialPackages: CreditPackage[] = [
  { id: 'pkg_1', name: 'Starter Gói Nhỏ', priceVnd: 50000, credits: 50000, bonusPercent: 0 },
  { id: 'pkg_2', name: 'Pro Gói Tiêu Chuẩn', priceVnd: 200000, credits: 220000, bonusPercent: 10, isPopular: true },
  { id: 'pkg_3', name: 'Studio Gói Chuyên Nghiệp', priceVnd: 500000, credits: 600000, bonusPercent: 20 },
  { id: 'pkg_4', name: 'Enterprise Gói Doanh Nghiệp', priceVnd: 2000000, credits: 2600000, bonusPercent: 30 },
];

const initialTransactions: TransactionRecord[] = [
  {
    id: 'TX-88219',
    userEmail: 'studio.vn@gmail.com',
    amountVnd: 500000,
    creditsGiven: 600000,
    method: 'VietQR',
    status: 'SUCCESS',
    createdAt: '2026-10-26 21:40',
  },
  {
    id: 'TX-88218',
    userEmail: 'dev.anh@gmail.com',
    amountVnd: 200000,
    creditsGiven: 220000,
    method: 'MoMo',
    status: 'SUCCESS',
    createdAt: '2026-10-26 20:15',
  },
  {
    id: 'TX-88217',
    userEmail: 'corporate@agency.com',
    amountVnd: 2000000,
    creditsGiven: 2600000,
    method: 'VCC_Card',
    status: 'SUCCESS',
    createdAt: '2026-10-26 18:30',
  },
  {
    id: 'TX-88216',
    userEmail: 'test.user@yahoo.com',
    amountVnd: 50000,
    creditsGiven: 50000,
    method: 'VietQR',
    status: 'PENDING',
    createdAt: '2026-10-26 17:10',
  },
];

const BillingPage = () => {
  const [packages, setPackages] = useState<CreditPackage[]>(() => {
    const saved = localStorage.getItem('velox_billing_packages');
    return saved ? JSON.parse(saved) : initialPackages;
  });

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('velox_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');

  // Package Modal State
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState(100000);
  const [pkgCredits, setPkgCredits] = useState(100000);
  const [pkgBonus, setPkgBonus] = useState(5);

  const savePackages = (updated: CreditPackage[]) => {
    setPackages(updated);
    localStorage.setItem('velox_billing_packages', JSON.stringify(updated));
  };

  const saveTransactions = (updated: TransactionRecord[]) => {
    setTransactions(updated);
    localStorage.setItem('velox_transactions', JSON.stringify(updated));
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;

    const newPkg: CreditPackage = {
      id: `pkg_${Date.now()}`,
      name: pkgName,
      priceVnd: Number(pkgPrice),
      credits: Number(pkgCredits),
      bonusPercent: Number(pkgBonus),
    };

    savePackages([...packages, newPkg]);
    setShowPkgModal(false);
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Xoá gói nạp này?')) {
      savePackages(packages.filter((p) => p.id !== id));
    }
  };

  // Simulate Quick Top-Up Test
  const handleSimulateTopup = () => {
    const newTx: TransactionRecord = {
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      userEmail: 'customer@demo.vn',
      amountVnd: 200000,
      creditsGiven: 220000,
      method: 'VietQR',
      status: 'SUCCESS',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    saveTransactions([newTx, ...transactions]);
    alert('Đã giả lập giao dịch nạp tiền thành công và cộng 220.000 credit cho user!');
  };

  const handleApproveTx = (id: string) => {
    const updated = transactions.map((t) => (t.id === id ? { ...t, status: 'SUCCESS' as const } : t));
    saveTransactions(updated);
  };

  const filteredTx = transactions.filter((tx) => {
    const matchesSearch =
      tx.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || tx.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className={styles.moduleContainer}>
      {/* 4 Credit Package Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              backgroundColor: '#fff',
              border: pkg.isPopular ? '2px solid #6366f1' : '1px solid #27272a',
              borderRadius: 8,
              padding: '1.25rem',
              boxShadow: '0 1px 2px rgba(56,65,74,0.1)',
              position: 'relative',
            }}
          >
            {pkg.isPopular && (
              <span
                style={{
                  position: 'absolute',
                  top: -10,
                  right: 15,
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 9999,
                }}
              >
                PHỔ BIẾN NHẤT
              </span>
            )}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fafafa', marginBottom: '0.35rem' }}>
              {pkg.name}
            </h4>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem' }}>
              {pkg.priceVnd.toLocaleString()} ₫
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.75rem' }}>
              Nhận: <strong>{pkg.credits.toLocaleString()} Credits</strong>
              {pkg.bonusPercent > 0 && (
                <span style={{ color: '#f59e0b', marginLeft: 4, fontWeight: 700 }}>
                  (+{pkg.bonusPercent}% Thưởng)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDeletePackage(pkg.id)}
              style={{
                fontSize: '0.75rem',
                color: '#f43f5e',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Xoá gói
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm theo mã GD hoặc email khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFilter}
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="ALL">Tất cả cổng thanh toán</option>
            <option value="VietQR">VietQR (Ngân hàng)</option>
            <option value="MoMo">Ví MoMo</option>
            <option value="VCC_Card">VCC (Thẻ ảo/Credit)</option>
          </select>
        </div>

        <div className={styles.actionButtonGroup}>
          <Button variant="outline" size="md" onClick={handleSimulateTopup}>
            <HiOutlineArrowPath size={16} /> Giả Lập Nạp Tiền Thử
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowPkgModal(true)}>
            <HiOutlinePlus size={16} /> Tạo Gói Nạp Mới
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3>Lịch Sử Giao Dịch & Nạp Tiền Theo Ngày</h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Quản lý thanh toán tự động qua VietQR, MoMo và thẻ VCC
            </span>
          </div>
          <span className={styles.countBadge}>{filteredTx.length} Giao Dịch</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Mã Giao Dịch</th>
              <th>Khách Hàng / Email</th>
              <th>Số Tiền Nạp (VND)</th>
              <th>Credits Đã Cộng</th>
              <th>Cổng Thanh Toán</th>
              <th>Thời Gian</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <strong style={{ color: '#6366f1' }}>{tx.id}</strong>
                </td>
                <td>{tx.userEmail}</td>
                <td style={{ fontWeight: 700 }}>{tx.amountVnd.toLocaleString()} ₫</td>
                <td style={{ color: '#10b981', fontWeight: 700 }}>
                  +{tx.creditsGiven.toLocaleString()} cr
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#6366f1',
                    }}
                  >
                    <HiOutlineCreditCard size={15} /> {tx.method}
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#71717a' }}>{tx.createdAt}</td>
                <td>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 9999,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor:
                        tx.status === 'SUCCESS'
                          ? 'rgba(16,185,129,0.12)'
                          : tx.status === 'PENDING'
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(244,63,94,0.12)',
                      color:
                        tx.status === 'SUCCESS'
                          ? '#10b981'
                          : tx.status === 'PENDING'
                          ? '#f59e0b'
                          : '#f43f5e',
                    }}
                  >
                    {tx.status}
                  </span>
                </td>
                <td>
                  {tx.status === 'PENDING' && (
                    <Button variant="outline" size="sm" onClick={() => handleApproveTx(tx.id)}>
                      <HiOutlineCheckCircle size={14} /> Duyệt Nạp
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Tạo gói nạp */}
      {showPkgModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Tạo Gói Nạp Credit Mới</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowPkgModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleAddPackage}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tên Gói Nạp</label>
                  <input
                    type="text"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    placeholder="VD: Gói Siêu Khuyến Mãi 100K"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Giá Tiền Thu (VND)</label>
                  <input
                    type="number"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Số Credits Nhận Được</label>
                  <input
                    type="number"
                    value={pkgCredits}
                    onChange={(e) => setPkgCredits(Number(e.target.value))}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Phần Trăm Thưởng Thêm (%)</label>
                  <input
                    type="number"
                    value={pkgBonus}
                    onChange={(e) => setPkgBonus(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowPkgModal(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" type="submit">
                  Lưu Gói Nạp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
