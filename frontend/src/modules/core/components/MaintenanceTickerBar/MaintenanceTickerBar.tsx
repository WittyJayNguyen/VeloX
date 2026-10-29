import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { useSystemStore } from '@modules/core/states/systemStore';
import styles from './MaintenanceTickerBar.module.scss';

const MaintenanceTickerBar: React.FC = () => {
  const { t } = useTranslation();
  const { maintenanceMode, maintenanceMessage } = useSystemStore();

  if (!maintenanceMode) return null;

  const defaultMsg = t(
    'system.maintenance_marquee_default',
    'Hệ thống đang trong thời gian bảo trì định kỳ / nâng cấp hạ tầng. Toàn bộ tiến trình tạo AI (Ảnh, Video, Âm thanh) và API Gateway tạm thời ngưng phục vụ để đảm bảo dữ liệu. Vui lòng quay lại sau!'
  );

  const displayMessage = maintenanceMessage ? `${maintenanceMessage} — ${defaultMsg}` : defaultMsg;

  return (
    <div className={styles.maintenanceBar}>
      <div className={styles.badgeTag}>
        <div className={styles.pulseDot} />
        <HiOutlineExclamationTriangle size={15} style={{ color: '#fca5a5' }} />
        <span>{t('system.maintenance_tag', 'Bảo Trì')}</span>
      </div>

      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeContent}>
          ⚠️ {displayMessage} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; ⚠️ {displayMessage}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTickerBar;
