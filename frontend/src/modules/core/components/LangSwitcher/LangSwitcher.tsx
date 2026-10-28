import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import { useUIStore } from '../../states/uiStore';
import styles from '@assets/scss/core/lang-switcher.module.scss';

const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const setLanguage = useUIStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCode = (i18n.language || 'vi').split('-')[0];
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === activeCode) ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)} type="button">
        <span className={styles.flag}>{current.flag}</span>
        <span className={styles.code}>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <ul className={styles.dropdown}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                className={`${styles.option} ${lang.code === current.code ? styles.active : ''}`}
                onClick={() => handleSelect(lang.code)}
              >
                <span className={styles.flag}>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LangSwitcher;
