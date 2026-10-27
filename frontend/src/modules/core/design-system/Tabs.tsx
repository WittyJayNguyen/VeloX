import React, { useState } from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Tab Item Interface ──
export interface TabItem {
  key?: string;
  id?: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

interface TabsProps {
  items?: TabItem[];
  tabs?: TabItem[];
  defaultKey?: string;
  activeKey?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  variant?: 'line' | 'pill';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  tabs,
  defaultKey,
  activeKey: propActiveKey,
  activeTab: propActiveTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  const safeItems = items || tabs || [];
  const firstKey = safeItems[0]?.key || safeItems[0]?.id || '';

  const [internalKey, setInternalKey] = useState<string>(defaultKey || firstKey);

  // Support controlled or uncontrolled mode
  const currentKey = propActiveKey ?? propActiveTab ?? internalKey;

  const handleChange = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  const activeItem = safeItems.find((t) => (t.key || t.id) === currentKey);

  if (safeItems.length === 0) return null;

  return (
    <div className={`${styles.tabsContainer} ${className}`}>
      <div className={`${styles.tabsNav} ${styles[`tabs_${variant}`]}`}>
        {safeItems.map((tab) => {
          const tabKey = tab.key || tab.id || '';
          const isActive = currentKey === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleChange(tabKey)}
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeItem?.content && <div className={styles.tabContent}>{activeItem.content}</div>}
    </div>
  );
};

export default Tabs;
