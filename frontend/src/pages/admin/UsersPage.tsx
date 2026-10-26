import { useTranslation } from 'react-i18next';
import styles from './AdminPlaceholder.module.scss';

const UsersPage = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t('admin.sidebar.users')}</h1>
      <p className={styles.desc}>Quản lý tài khoản người dùng & phân quyền RBAC — đang phát triển.</p>
      <div className={styles.mockTable}>
        <div className={styles.row}><span>admin@velox.ai</span><span className={styles.tagAdmin}>SUPER_ADMIN</span><span>Active</span></div>
        <div className={styles.row}><span>user1@gmail.com</span><span className={styles.tagUser}>USER</span><span>Active</span></div>
        <div className={styles.row}><span>user2@gmail.com</span><span className={styles.tagUser}>USER</span><span>Active</span></div>
      </div>
    </div>
  );
};

export default UsersPage;
