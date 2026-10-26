import { useTranslation } from 'react-i18next';
import styles from './AdminPlaceholder.module.scss';

const ModelsPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.models')}</h1>
      <p className={styles.desc}>Danh mục mô hình AI & cấu hình định giá — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>GPT-4o</span><span>CHAT</span><span>$5/1M tokens</span></div>
        <div className={styles.row}><span>Claude 3.5 Sonnet</span><span>CHAT</span><span>$3/1M tokens</span></div>
        <div className={styles.row}><span>Flux Pro</span><span>IMAGE</span><span>$0.04/image</span></div>
        <div className={styles.row}><span>Runway Gen-3</span><span>VIDEO</span><span>$0.25/second</span></div>
      </div>
    </div>
  );
};

export default ModelsPage;
