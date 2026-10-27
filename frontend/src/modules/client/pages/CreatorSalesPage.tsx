import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineBanknotes, HiOutlineArrowUpRight, HiOutlineCheckCircle } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

export const CreatorSalesPage: React.FC = () => {
  const { t } = useTranslation();
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handlePayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 3000);
  };

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
          <button type="button" className={styles.primaryBtn} onClick={handlePayout}>
            <HiOutlineBanknotes /> {t('sales.withdraw_btn', 'Yêu Cầu Rút Tiền')}
          </button>
        </div>
      </div>

      {payoutSuccess && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>Yêu cầu rút 2.850.000 đ đã được gửi đến ban quản trị VeloX xử lý chuyển khoản trong 24h!</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Doanh Thu</div>
            <div className={styles.statValue}>14.250.000 đ</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💵</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Số Dư Khả Dụng</div>
            <div className={styles.statValue}>2.850.000 đ</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🛍️</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Lượt Khách Mua</div>
            <div className={styles.statValue}>285 lượt</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📈</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tăng Trưởng Tuần</div>
            <div className={styles.statValue} style={{ color: '#10b981' }}>+24.5%</div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineArrowUpRight /> Danh Sách Workflow Đang Bán
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
              <tr>
                <td><strong>Lịch Tập Gym Siêu Tăng Cơ PulseFit</strong></td>
                <td>49.000 đ</td>
                <td>120 lượt</td>
                <td>5.880.000 đ</td>
                <td>⭐ 4.9 (42)</td>
                <td><span className={styles.badgeSuccess}>Đang bán</span></td>
              </tr>
              <tr>
                <td><strong>Bộ Prompt Midjourney Gym Model Chuyên Nghiệp</strong></td>
                <td>69.000 đ</td>
                <td>85 lượt</td>
                <td>5.865.000 đ</td>
                <td>⭐ 5.0 (36)</td>
                <td><span className={styles.badgeSuccess}>Đang bán</span></td>
              </tr>
              <tr>
                <td><strong>Tự Động Hóa Kế Hoạch Ăn Kiêng Keto AI</strong></td>
                <td>35.000 đ</td>
                <td>80 lượt</td>
                <td>2.800.000 đ</td>
                <td>⭐ 4.8 (21)</td>
                <td><span className={styles.badgeSuccess}>Đang bán</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreatorSalesPage;
