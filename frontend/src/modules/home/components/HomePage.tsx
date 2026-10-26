import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '@modules/core/design-system/Button';
import {
  HiOutlineCpuChip,
  HiOutlineServerStack,
  HiOutlineShieldCheck,
  HiOutlineLanguage,
} from 'react-icons/hi2';
import styles from '@assets/scss/home/home.module.scss';

const stats = [
  { value: '100+', key: 'stats.models' },
  { value: '12K+', key: 'stats.users' },
  { value: '2M+', key: 'stats.requests' },
  { value: '99.9%', key: 'stats.uptime' },
];

const features = [
  { icon: HiOutlineCpuChip, titleKey: 'features.multi_model', descKey: 'features.multi_model_desc' },
  { icon: HiOutlineServerStack, titleKey: 'features.pool_system', descKey: 'features.pool_system_desc' },
  { icon: HiOutlineShieldCheck, titleKey: 'features.security', descKey: 'features.security_desc' },
  { icon: HiOutlineLanguage, titleKey: 'features.i18n', descKey: 'features.i18n_desc' },
];

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <span className={styles.badge}>{t('hero.badge')}</span>
        <h1 className={styles.title}>
          {t('hero.title_1')} <br />
          <span className={styles.gradient}>{t('hero.title_highlight')}</span>
        </h1>
        <p className={styles.subtitle}>{t('hero.subtitle')}</p>
        <div className={styles.ctas}>
          <Link to="/register">
            <Button size="lg">{t('hero.cta_start')}</Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">{t('hero.cta_docs')}</Button>
          </a>
        </div>

        {/* Stats Strip */}
        <div className={styles.statsStrip}>
          {stats.map((s) => (
            <div key={s.key} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{t(s.key)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection} id="features">
        <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
        <div className={styles.grid}>
          {features.map((f) => (
            <div key={f.titleKey} className={styles.card}>
              <div className={styles.cardIcon}>
                <f.icon size={26} />
              </div>
              <h3>{t(f.titleKey)}</h3>
              <p>{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers Section */}
      <section className={styles.providers}>
        <p className={styles.providerLabel}>{t('hero.providers_label') || 'Hỗ Trợ Hơn 100+ Mô Hình AI Từ Các Nền Tảng Hàng Đầu'}</p>
        <div className={styles.providerLogos}>
          {['OpenAI', 'Claude', 'Gemini', 'Midjourney', 'Runway', 'DeepSeek', 'Groq', 'Qwen'].map((p) => (
            <div key={p} className={styles.providerChip}>{p}</div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
