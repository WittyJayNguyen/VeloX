import { useTranslation } from 'react-i18next';
import styles from '@modules/admin/components/AdminPlaceholder.module.scss';

const UsersPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.users')}</h1>
      <p className={styles.desc}>Danh sách người dùng và phân quyền — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>admin@velox.ai</span><span>Admin VeloX</span><span className={styles.tagAdmin}>Super Admin</span></div>
        <div className={styles.row}><span>user1@gmail.com</span><span>Hai Nguyen</span><span className={styles.tagUser}>User</span></div>
        <div className={styles.row}><span>dev@studio.vn</span><span>Dev Studio</span><span className={styles.tagUser}>User</span></div>
      </div>
    </div>
  );
};

export default UsersPage;
