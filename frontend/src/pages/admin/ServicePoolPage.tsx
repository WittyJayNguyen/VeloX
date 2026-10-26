import { useTranslation } from 'react-i18next';
import styles from './AdminPlaceholder.module.scss';

const ServicePoolPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.services')}</h1>
      <p className={styles.desc}>Quản lý Pool API Key & Token Account — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>OpenAI Pool</span><span className={styles.tagActive}>Active</span><span>12 keys</span></div>
        <div className={styles.row}><span>Midjourney Pool</span><span className={styles.tagActive}>Active</span><span>8 tokens</span></div>
        <div className={styles.row}><span>Runway Pool</span><span className={styles.tagWarn}>Low</span><span>2 tokens</span></div>
        <div className={styles.row}><span>Claude Pool</span><span className={styles.tagActive}>Active</span><span>5 keys</span></div>
      </div>
    </div>
  );
};

export default ServicePoolPage;
