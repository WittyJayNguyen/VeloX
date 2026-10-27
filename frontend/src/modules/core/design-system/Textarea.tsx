import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Textarea ──
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, hint, fullWidth, className = '', ...rest }) => (
  <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <textarea className={`${styles.textarea} ${error ? styles.hasError : ''}`} rows={4} {...rest} />
    {error && <span className={styles.errorText}>{error}</span>}
    {hint && !error && <span className={styles.hintText}>{hint}</span>}
  </div>
);
