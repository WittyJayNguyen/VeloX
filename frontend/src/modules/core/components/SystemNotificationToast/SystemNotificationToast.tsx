import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineBell,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useSystemStore } from '@modules/core/states/systemStore';
import styles from './SystemNotificationToast.module.scss';

interface Props {
  onOpenNotifications?: () => void;
}

const SystemNotificationToast: React.FC<Props> = ({ onOpenNotifications }) => {
  const { t } = useTranslation();
  const { activeToast, dismissToast } = useSystemStore();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'danger':
        return <HiOutlineExclamationTriangle className={styles.iconDanger} size={22} />;
      case 'warning':
        return <HiOutlineExclamationTriangle className={styles.iconWarning} size={22} />;
      case 'success':
        return <HiOutlineCheckCircle className={styles.iconSuccess} size={22} />;
      default:
        return <HiOutlineBell className={styles.iconInfo} size={22} />;
    }
  };

  const handleClickToast = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    }
    dismissToast();
  };

  return (
    <aside
      className={`${styles.toastWrapper} ${styles[activeToast.type] || styles.info}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onClick={handleClickToast}
    >
      <div className={styles.toastGlow} />

      <div className={styles.toastBody}>
        <div className={styles.iconWrapper}>
          {getIcon()}
          <span className={styles.pulseRing} />
        </div>

        <div className={styles.textContent}>
          <div className={styles.toastHeaderRow}>
            <span className={styles.sourceTag}>{t('notifications.from_system', 'THÔNG BÁO TỪ HỆ THỐNG')}</span>
            <span className={styles.toastTime}>{t('notifications.just_now', 'Vừa xong')}</span>
          </div>
          <h4 className={styles.toastTitle}>{activeToast.title}</h4>
          <p className={styles.toastMessage}>{activeToast.message}</p>
        </div>

        <button
          type="button"
          className={styles.closeBtn}
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          aria-label="Đóng thông báo"
        >
          <HiOutlineXMark size={18} />
        </button>
      </div>

      <div className={styles.progressBar} />
    </aside>
  );
};

export default SystemNotificationToast;
