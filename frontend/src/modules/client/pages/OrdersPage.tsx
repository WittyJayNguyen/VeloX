import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCreditCard, HiOutlineReceiptPercent } from 'react-icons/hi2';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from '@assets/scss/client/client-pages.module.scss';

interface OrderItem {
  id: string;
  packageName: string;
  amount: number;
  credits: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

const DEFAULT_ORDERS: OrderItem[] = [
  { id: 'ORD-991201', packageName: 'Nạp 1,100 Credit', amount: 100000, credits: 1100, status: 'COMPLETED', createdAt: '2026-10-27 14:20', paymentMethod: 'VietQR Banking' },
  { id: 'ORD-882109', packageName: 'Nạp 2,400 Credit', amount: 200000, credits: 2400, status: 'COMPLETED', createdAt: '2026-10-25 10:15', paymentMethod: 'VietQR Banking' },
  { id: 'ORD-771024', packageName: 'Khởi tạo tài khoản tặng Credit', amount: 0, credits: 500, status: 'COMPLETED', createdAt: '2026-10-20 09:00', paymentMethod: 'Hệ thống tặng' },
];

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderItem[]>(DEFAULT_ORDERS);
  const [topupOpen, setTopupOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('velox_user_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [topupOpen]);

  const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalCredits = orders.reduce((sum, o) => sum + (o.credits || 0), 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>🛍️</span>
            {t('client_menu.orders', 'Đơn Đã Mua & Hóa Đơn')}
          </h1>
          <p>{t('orders.subtitle', 'Theo dõi lịch sử giao dịch nạp tiền, mua gói cước và xuất hóa đơn điện tử')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => setTopupOpen(true)}>
            <HiOutlineCreditCard /> {t('orders.new_topup', 'Nạp Tiền Mới')}
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🧾</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Giao Dịch</div>
            <div className={styles.statValue}>{orders.length} đơn</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Credit Đã Nạp</div>
            <div className={styles.statValue}>{totalCredits.toLocaleString()} cr</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Chi Tiêu</div>
            <div className={styles.statValue}>{totalSpent.toLocaleString()} đ</div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineReceiptPercent /> Danh Sách Hóa Đơn Giao Dịch
        </h3>

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Tên Gói / Dịch Vụ</th>
                <th>Số Tiền</th>
                <th>Credit Nhận</th>
                <th>Phương Thức</th>
                <th>Thời Gian</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><code style={{ color: '#38bdf8' }}>{o.id}</code></td>
                  <td><strong>{o.packageName}</strong></td>
                  <td>{o.amount.toLocaleString()} đ</td>
                  <td><span style={{ color: '#2dd4bf', fontWeight: 700 }}>+{o.credits.toLocaleString()} 💎</span></td>
                  <td>{o.paymentMethod}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={styles.badgeSuccess}>Thành Công</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default OrdersPage;
