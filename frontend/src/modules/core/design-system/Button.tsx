import React from 'react';
import styles from '@assets/scss/core/button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  className = '',
  disabled,
  ...rest
}) => (
  <button
    className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <span className={styles.spinner} /> : children}
  </button>
);

export default Button;
