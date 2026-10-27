import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Modal ──
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, size = 'md', children, footer }) => {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles[`modal_${size}`]}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.modalHeader}>
            <h2>{title}</h2>
            <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        )}
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
};
