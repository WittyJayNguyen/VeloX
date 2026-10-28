import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCreditCard, HiOutlineReceiptPercent } from 'react-icons/hi2';
import apiClient from '@modules/core/lib/apiClient';
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

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiClient
      .get('/billing/my-orders')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setOrders(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load orders:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
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
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    Chưa có giao dịch nạp tiền nào. Hãy chọn một gói Credit để bắt đầu sử dụng!
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td><code style={{ color: '#38bdf8' }}>{o.id}</code></td>
                    <td><strong>{o.packageName}</strong></td>
                    <td>{o.amount.toLocaleString()} đ</td>
                    <td><span style={{ color: '#2dd4bf', fontWeight: 700 }}>+{o.credits.toLocaleString()} 💎</span></td>
                    <td>{o.paymentMethod}</td>
                    <td>{o.createdAt || 'Gần đây'}</td>
                    <td>
                      <span className={o.status === 'COMPLETED' ? styles.badgeSuccess : styles.badgeWarning}>
                        {o.status === 'COMPLETED' ? 'Thành Công' : o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default OrdersPage;
