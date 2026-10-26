import { useTranslation } from 'react-i18next';
import styles from '@modules/admin/components/AdminPlaceholder.module.scss';

const ModelsPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.models')}</h1>
      <p className={styles.desc}>Danh mục Model & Định giá Token/Credit — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>GPT-4o</span><span>10 cr/1K tok</span><span className={styles.tagActive}>Enabled</span></div>
        <div className={styles.row}><span>Claude 3.5 Sonnet</span><span>15 cr/1K tok</span><span className={styles.tagActive}>Enabled</span></div>
        <div className={styles.row}><span>Midjourney v6</span><span>50 cr/ảnh</span><span className={styles.tagActive}>Enabled</span></div>
        <div className={styles.row}><span>Runway Gen-3</span><span>120 cr/video</span><span className={styles.tagActive}>Enabled</span></div>
      </div>
    </div>
  );
};

export default ModelsPage;
