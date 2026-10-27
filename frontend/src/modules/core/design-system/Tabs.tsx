import React, { useState } from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Tabs ──
interface TabItem { key: string; label: string; icon?: React.ReactNode; content: React.ReactNode; }

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  onChange?: (key: string) => void;
  variant?: 'line' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultKey, onChange, variant = 'line' }) => {
  const [activeKey, setActiveKey] = useState(defaultKey || items[0]?.key || '');
  const active = items.find((t) => t.key === activeKey);

  const handleChange = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={`${styles.tabsNav} ${styles[`tabs_${variant}`]}`}>
        {items.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${activeKey === tab.key ? styles.tabActive : ''}`}
            onClick={() => handleChange(tab.key)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>{active?.content}</div>
    </div>
  );
};
