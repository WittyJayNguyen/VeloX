import React from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Spinner ──
interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; color?: string; label?: string; }

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color, label }) => (
  <div className={`${styles.spinnerContainer} ${styles[`spinner_${size}`]}`}>
    <div className={styles.spinnerCircle} style={color ? { borderTopColor: color } : undefined} />
    {label && <span className={styles.spinnerLabel}>{label}</span>}
  </div>
);

// ── Avatar ──
interface AvatarProps { name: string; src?: string; size?: 'sm' | 'md' | 'lg'; color?: string; }

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', color }) => {
  const initials = name.split(' ').map((n) => n.charAt(0).toUpperCase()).slice(0, 2).join('');
  return (
    <div className={`${styles.avatar} ${styles[`avatar_${size}`]}`} style={color ? { backgroundColor: color } : undefined}>
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
};

// ── Toggle / Switch ──
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; }

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => (
  <label className={`${styles.toggleLabel} ${disabled ? styles.disabled : ''}`}>
    <div className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} onClick={() => !disabled && onChange(!checked)}>
      <div className={styles.toggleThumb} />
    </div>
    {label && <span>{label}</span>}
  </label>
);

// ── Search Input ──
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onClear, ...rest }) => (
  <div className={styles.searchInputWrapper}>
    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input className={styles.searchField} value={value} {...rest} />
    {value && onClear && (
      <button type="button" className={styles.searchClear} onClick={onClear}>✕</button>
    )}
  </div>
);

// ── Tooltip ──
interface TooltipProps { text: string; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right'; }

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => (
  <span className={styles.tooltipWrapper}>
    {children}
    <span className={`${styles.tooltipText} ${styles[`tooltip_${position}`]}`}>{text}</span>
  </span>
);

// ── Empty State ──
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className={styles.emptyState}>
    {icon && <div className={styles.emptyIcon}>{icon}</div>}
    <h4>{title}</h4>
    {description && <p>{description}</p>}
    {action && <div className={styles.emptyAction}>{action}</div>}
  </div>
);

// ── Stat Card ──
interface StatCardProps { label: string; value: string | number; icon?: React.ReactNode; trend?: { value: string; positive: boolean }; color?: string; }

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color = '#6366f1' }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
    <div className={styles.statInfo}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {trend && (
        <span className={`${styles.statTrend} ${trend.positive ? styles.trendUp : styles.trendDown}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  </div>
);
