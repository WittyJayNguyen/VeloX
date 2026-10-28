import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineBanknotes,
  HiOutlineArrowUpRight,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineBuildingLibrary,
  HiOutlineClock,
} from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

interface ProductSale {
  id: string;
  name: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
  rating: string;
  status: 'Đang bán' | 'Tạm dừng';
}

interface PayoutRequest {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  date: string;
  status: 'Đang xử lý' | 'Thành công';
}

const DEFAULT_PRODUCTS: ProductSale[] = [
  {
    id: 'p1',
    name: 'Bộ Prompt Cinematic Photorealistic VeloX',
    price: 79000,
    salesCount: 142,
    totalRevenue: 11218000,
    rating: '⭐ 5.0 (58)',
    status: 'Đang bán',
  },
  {
    id: 'p2',
    name: 'Pipeline Tự Động Tạo Kịch Bản & Voiceover Video Shorts',
    price: 149000,
    salesCount: 86,
    totalRevenue: 12814000,
    rating: '⭐ 4.9 (42)',
    status: 'Đang bán',
  },
  {
    id: 'p3',
    name: 'Workflow Báo Cáo Nghiên Cứu Thị Trường Đa Ngôn Ngữ',
    price: 99000,
    salesCount: 64,
    totalRevenue: 6336000,
    rating: '⭐ 4.8 (26)',
    status: 'Đang bán',
  },
];

const VIETNAM_BANKS = [
  'Vietcombank (VCB)',
  'MB Bank (Quân Đội)',
  'Techcombank (TCB)',
  'ACB (Á Châu)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'TPBank (Tiên Phong)',
  'BIDV (Đầu Tư & Phát Triển)',
  'VietinBank (Công Thương)',
  'MoMo Ví Điện Tử',
];

export const CreatorSalesPage: React.FC = () => {
  const { t } = useTranslation();
  const [products] = useState<ProductSale[]>(DEFAULT_PRODUCTS);
  const [availableBalance, setAvailableBalance] = useState(3850000);
  const [toast, setToast] = useState<string | null>(null);

  // Payout Modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(VIETNAM_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutAmount, setPayoutAmount] = useState(3850000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payout History
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);

  const payoutStorageKey = 'velox_creator_payout_history';

  useEffect(() => {
    const saved = localStorage.getItem(payoutStorageKey);
    if (saved) {
      try {
        setPayoutHistory(JSON.parse(saved));
      } catch {
        // Fallback
      }
    }
  }, []);

  const handleOpenPayout = () => {
    if (availableBalance < 200000) {
      alert('Số dư khả dụng tối thiểu để tạo yêu cầu rút tiền là 200.000 đ.');
      return;
    }
    setPayoutAmount(availableBalance);
    setIsPayoutModalOpen(true);
  };

  const handleSubmitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !accountName.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng nhận tiền.');
      return;
    }

    if (payoutAmount < 200000 || payoutAmount > availableBalance) {
      alert(`Số tiền rút không hợp lệ. Tối thiểu 200.000 đ và tối đa ${availableBalance.toLocaleString()} đ.`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newReq: PayoutRequest = {
        id: `PO-${Date.now().toString().slice(-6)}`,
        bankName: selectedBank,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        amount: payoutAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'Đang xử lý',
      };

      const updatedHistory = [newReq, ...payoutHistory];
      setPayoutHistory(updatedHistory);
      localStorage.setItem(payoutStorageKey, JSON.stringify(updatedHistory));

      setAvailableBalance((prev) => Math.max(0, prev - payoutAmount));
      setIsSubmitting(false);
      setIsPayoutModalOpen(false);
      setToast(`Đã tạo yêu cầu rút ${payoutAmount.toLocaleString()} đ thành công! Bộ phận kế toán VeloX sẽ giải ngân trong 24h làm việc.`);
      setTimeout(() => setToast(null), 5000);
    }, 1000);
  };

  const totalRevenue = products.reduce((acc, cur) => acc + cur.totalRevenue, 0);
  const totalSales = products.reduce((acc, cur) => acc + cur.salesCount, 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>📊</span>
            {t('client_menu.sales', 'Bảng Bán Hàng & Doanh Thu Creator')}
          </h1>
          <p>{t('sales.subtitle', 'Theo dõi thu nhập từ việc chia sẻ các Workflow AI, Prompt và tài nguyên lên VeloX Marketplace')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={handleOpenPayout}>
            <HiOutlineBanknotes /> {t('sales.withdraw_btn', 'Yêu Cầu Rút Tiền')}
          </button>
        </div>
      </div>

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Doanh Thu</div>
            <div className={styles.statValue}>{totalRevenue.toLocaleString()} đ</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💵</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Số Dư Khả Dụng</div>
            <div className={styles.statValue} style={{ color: '#2dd4bf' }}>
              {availableBalance.toLocaleString()} đ
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🛍️</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Lượt Khách Mua</div>
            <div className={styles.statValue}>{totalSales} lượt</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📈</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tăng Trưởng Tuần</div>
            <div className={styles.statValue} style={{ color: '#10b981' }}>+28.4%</div>
          </div>
        </div>
      </div>

      {/* Product list */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineArrowUpRight /> Danh Sách Workflow & Tài Nguyên Đang Bán
        </h3>

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Tên Sản Phẩm Workflow</th>
                <th>Giá Bán</th>
                <th>Lượt Đã Bán</th>
                <th>Tổng Doanh Thu</th>
                <th>Đánh Giá</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.price.toLocaleString()} đ</td>
                  <td>{p.salesCount} lượt</td>
                  <td><strong style={{ color: '#38bdf8' }}>{p.totalRevenue.toLocaleString()} đ</strong></td>
                  <td>{p.rating}</td>
                  <td><span className={styles.badgeSuccess}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History */}
      {payoutHistory.length > 0 && (
        <div className={styles.contentCard}>
          <h3 className={styles.cardTitle}>
            <HiOutlineClock /> Lịch Sử Yêu Cầu Rút Tiền
          </h3>

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Mã Lệnh</th>
                  <th>Ngày Yêu Cầu</th>
                  <th>Ngân Hàng Thụ Hưởng</th>
                  <th>Số Tài Khoản</th>
                  <th>Chủ Tài Khoản</th>
                  <th>Số Tiền</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((po) => (
                  <tr key={po.id}>
                    <td><code>{po.id}</code></td>
                    <td>{po.date}</td>
                    <td>{po.bankName}</td>
                    <td><code>{po.accountNumber}</code></td>
                    <td><strong>{po.accountName}</strong></td>
                    <td><strong style={{ color: '#10b981' }}>{po.amount.toLocaleString()} đ</strong></td>
                    <td>
                      <span className={styles.badgeWarning}>
                        {po.status} (24h)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineBuildingLibrary size={24} style={{ color: '#ff6b35' }} />
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Yêu Cầu Rút Tiền Doanh Thu</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <div style={{ background: '#090d16', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Số dư khả dụng hiện tại:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2dd4bf' }}>
                {availableBalance.toLocaleString()} VNĐ
              </div>
            </div>

            <form onSubmit={handleSubmitPayout}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Ngân hàng nhận tiền *
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Số tài khoản ngân hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="vd: 0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Họ và tên chủ tài khoản (Viết in hoa không dấu) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="vd: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Số tiền muốn rút (VNĐ) *
                </label>
                <input
                  type="number"
                  min={200000}
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Hạn mức rút tối thiểu: 200.000 VNĐ. Miễn phí xử lý giao dịch.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsPayoutModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting || !accountNumber.trim() || !accountName.trim()}
                >
                  {isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác Nhận Rút Tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorSalesPage;
