import { useTranslation } from 'react-i18next';
import styles from '@modules/admin/components/AdminPlaceholder.module.scss';

const BillingPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.billing')}</h1>
      <p className={styles.desc}>Giao dịch, nạp tiền và gói thuê bao — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>TX-88219</span><span>+500,000 ₫</span><span className={styles.tagActive}>Success</span><span>VietQR</span></div>
        <div className={styles.row}><span>TX-88218</span><span>+200,000 ₫</span><span className={styles.tagActive}>Success</span><span>Momo</span></div>
        <div className={styles.row}><span>TX-88217</span><span>+1,000,000 ₫</span><span className={styles.tagActive}>Success</span><span>VietQR</span></div>
      </div>
    </div>
  );
};

export default BillingPage;
