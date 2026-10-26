import { useTranslation } from 'react-i18next';
import styles from './AdminPlaceholder.module.scss';

const LogsPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.logs')}</h1>
      <p className={styles.desc}>Nhật ký gọi API, tạo ảnh & video — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>user1@gmail.com</span><span>GPT-4o</span><span>1,250 tokens</span><span>320ms</span></div>
        <div className={styles.row}><span>user2@gmail.com</span><span>Flux Pro</span><span>1 image</span><span>4.2s</span></div>
        <div className={styles.row}><span>user1@gmail.com</span><span>Claude 3.5</span><span>890 tokens</span><span>180ms</span></div>
      </div>
    </div>
  );
};

export default LogsPage;
