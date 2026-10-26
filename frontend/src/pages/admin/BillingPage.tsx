import { useTranslation } from 'react-i18next';
import styles from './AdminPlaceholder.module.scss';

const BillingPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.billing')}</h1>
      <p className={styles.desc}>Quản lý gói nạp tiền Credits & tính toán biên lợi nhuận — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>Gói Khởi Đầu</span><span>50,000 ₫</span><span>500 Credits</span></div>
        <div className={styles.row}><span>Gói Chuyên Nghiệp</span><span>200,000 ₫</span><span>2,500 Credits (+25%)</span></div>
        <div className={styles.row}><span>Gói Doanh Nghiệp</span><span>500,000 ₫</span><span>7,000 Credits (+40%)</span></div>
      </div>
    </div>
  );
};

export default BillingPage;
