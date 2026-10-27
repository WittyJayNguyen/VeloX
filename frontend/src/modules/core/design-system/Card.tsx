import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Card ──
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, headerRight, padding = 'md', className = '' }) => (
  <div className={`${styles.card} ${styles[`card_pad_${padding}`]} ${className}`}>
    {(title || headerRight) && (
      <div className={styles.cardHeader}>
        <div>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
        </div>
        {headerRight && <div className={styles.cardHeaderRight}>{headerRight}</div>}
      </div>
    )}
    <div className={styles.cardBody}>{children}</div>
  </div>
);
