import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Badge ──
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'sm', dot }) => (
  <span className={`${styles.badge} ${styles[`badge_${variant}`]} ${styles[`badge_${size}`]}`}>
    {dot && <span className={styles.badgeDot} />}
    {children}
  </span>
);
