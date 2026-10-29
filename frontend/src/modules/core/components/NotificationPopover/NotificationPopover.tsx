import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineBell,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { useSystemStore } from '@modules/core/states/systemStore';
import styles from './NotificationPopover.module.scss';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    maintenanceMode,
    maintenanceMessage,
    fetchNotifications,
    markAllNotificationsRead,
  } = useSystemStore();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger':
      case 'maintenance':
        return <HiOutlineExclamationTriangle size={17} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <HiOutlineExclamationTriangle size={17} style={{ color: '#f59e0b' }} />;
      case 'success':
        return <HiOutlineCheckCircle size={17} style={{ color: '#10b981' }} />;
      default:
        return <HiOutlineInformationCircle size={17} style={{ color: '#38bdf8' }} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.15)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.15)';
      case 'success':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(56, 189, 248, 0.15)';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div className={styles.popoverOverlay} onClick={onClose} />
      <div className={styles.popoverContainer} ref={containerRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.popoverHeader}>
          <div className={styles.headerTitleBox}>
            <HiOutlineBell size={18} style={{ color: '#38bdf8' }} />
            <span>{t('header.notifications', 'Thông Báo')}</span>
            {unreadCount > 0 && <span className={styles.headerBadge}>{unreadCount}</span>}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              className={styles.markReadBtn}
              onClick={() => markAllNotificationsRead()}
            >
              {t('notifications.mark_all_read', 'Đã đọc tất cả')}
            </button>
          )}
        </div>

        {/* Maintenance Banner when active */}
        {maintenanceMode && (
          <div className={styles.maintenanceAlertCard}>
            <HiOutlineExclamationTriangle className={styles.alertIcon} size={20} />
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>⚠️ {t('system.maintenance_active', 'Bảo trì hệ thống')}</div>
              <div className={styles.alertDesc}>{maintenanceMessage}</div>
            </div>
          </div>
        )}

        {/* Notification List */}
        <div className={styles.notifList}>
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <HiOutlineSparkles size={28} style={{ opacity: 0.3, marginBottom: 6 }} />
              <div>{t('notifications.empty', 'Bạn không có thông báo nào')}</div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`${styles.notifItem} ${!n.is_read ? styles.isUnread : ''}`}
              >
                <div
                  className={styles.itemIconBox}
                  style={{ background: getIconBg(n.type) }}
                >
                  {getIcon(n.type)}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemTitle}>{n.title}</div>
                  <div className={styles.itemMessage}>{n.message}</div>
                  {n.created_at && (
                    <div className={styles.itemTime}>{formatTime(n.created_at)}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPopover;
