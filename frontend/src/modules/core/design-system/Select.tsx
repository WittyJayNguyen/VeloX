import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Select ──
interface SelectOption { value: string; label: string; disabled?: boolean; }

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, error, hint, options, placeholder, fullWidth, className = '', ...rest }) => (
  <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <div className={`${styles.selectWrapper} ${error ? styles.hasError : ''}`}>
      <select className={styles.select} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
        ))}
      </select>
      <span className={styles.selectArrow}>▾</span>
    </div>
    {error && <span className={styles.errorText}>{error}</span>}
    {hint && !error && <span className={styles.hintText}>{hint}</span>}
  </div>
);
