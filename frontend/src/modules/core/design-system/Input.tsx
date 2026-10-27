import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Input ──
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, icon, fullWidth, className = '', ...rest }) => (
  <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
      {icon && <span className={styles.inputIcon}>{icon}</span>}
      <input className={`${styles.input} ${icon ? styles.withIcon : ''}`} {...rest} />
    </div>
    {error && <span className={styles.errorText}>{error}</span>}
    {hint && !error && <span className={styles.hintText}>{hint}</span>}
  </div>
);
