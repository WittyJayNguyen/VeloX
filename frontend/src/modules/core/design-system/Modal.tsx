import React from 'react';
import { createPortal } from 'react-dom';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Modal ──
export interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, isOpen, onClose, title, size = 'md', children, footer }) => {
  const isVisible = open ?? isOpen ?? false;
  if (!isVisible) return null;

  const modalNode = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles[`modal_${size}`]}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title || ''}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body);
  }

  return modalNode;
};
