import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '@modules/core/design-system/Button';
import {
  HiOutlineCpuChip,
  HiOutlineServerStack,
  HiOutlineShieldCheck,
  HiOutlineLanguage,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineArrowRight,
  HiOutlineRocketLaunch,
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
  { icon: HiOutlineBolt, titleKey: 'features.realtime', descKey: 'features.realtime_desc' },
  { icon: HiOutlineChartBar, titleKey: 'features.analytics', descKey: 'features.analytics_desc' },
];

const howItWorks = [
  { step: 1, titleKey: 'home.how_step1_title', descKey: 'home.how_step1_desc' },
  { step: 2, titleKey: 'home.how_step2_title', descKey: 'home.how_step2_desc' },
  { step: 3, titleKey: 'home.how_step3_title', descKey: 'home.how_step3_desc' },
];

const providers = ['OpenAI', 'Claude', 'Gemini', 'Midjourney', 'Runway', 'DeepSeek', 'Groq', 'Qwen', 'Stable Diffusion', 'Luma AI', 'Meta Llama', 'Mistral'];

const pricingPlans = [
  {
    name: 'STARTER',
    descKey: 'home.plan_starter_desc',
    price: '50,000',
    unit: '₫',
    periodKey: 'home.per_month',
    featuresKeys: ['home.plan_starter_f1', 'home.plan_starter_f2', 'home.plan_starter_f3', 'home.plan_starter_f4'],
    popular: false,
  },
  {
    name: 'PRO',
    descKey: 'home.plan_pro_desc',
    price: '200,000',
    unit: '₫',
    periodKey: 'home.per_month',
    featuresKeys: ['home.plan_pro_f1', 'home.plan_pro_f2', 'home.plan_pro_f3', 'home.plan_pro_f4', 'home.plan_pro_f5', 'home.plan_pro_f6'],
    popular: true,
  },
  {
    name: 'ELITE',
    descKey: 'home.plan_elite_desc',
    price: '500,000',
    unit: '₫',
    periodKey: 'home.per_month',
    featuresKeys: ['home.plan_elite_f1', 'home.plan_elite_f2', 'home.plan_elite_f3', 'home.plan_elite_f4', 'home.plan_elite_f5', 'home.plan_elite_f6'],
    popular: false,
  },
];

const HomePage = () => {
  const { t } = useTranslation();

  // Double the providers array for seamless marquee
  const marqueeProviders = [...providers, ...providers];

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* Decorative orbits */}
        <div className={styles.heroOrbit} />
        <div className={styles.heroOrbit2} />

        <span className={styles.badge}>{t('hero.badge')}</span>

        <h1 className={styles.title}>
          {t('hero.title_1')} <br />
          <span className={styles.gradient}>{t('hero.title_highlight')}</span>
        </h1>

        <p className={styles.subtitle}>{t('hero.subtitle')}</p>

        <div className={styles.ctas}>
          <Link to="/register">
            <Button size="lg">
              <HiOutlineRocketLaunch size={18} /> {t('hero.cta_start')}
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              {t('hero.cta_docs')} <HiOutlineArrowRight size={16} />
            </Button>
          </a>
        </div>

        <div className={styles.statsStrip}>
          {stats.map((s) => (
            <div key={s.key} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{t(s.key)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Providers Marquee ── */}
      <section className={styles.providers}>
        <p className={styles.providerLabel}>{t('hero.providers_label')}</p>
        <div className={styles.providerTrack}>
          {marqueeProviders.map((p, idx) => (
            <div key={`${p}-${idx}`} className={styles.providerChip}>{p}</div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection} id="features">
        <p className={styles.sectionLabel}>{t('home.features_label')}</p>
        <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
        <p className={styles.sectionDesc}>{t('home.features_desc')}</p>
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

      {/* ── How It Works ── */}
      <section className={styles.howSection}>
        <p className={styles.sectionLabel}>{t('home.how_label')}</p>
        <h2 className={styles.sectionTitle}>{t('home.how_title')}</h2>
        <p className={styles.sectionDesc}>{t('home.how_desc')}</p>
        <div className={styles.howGrid}>
          {howItWorks.map((h) => (
            <div key={h.step} className={styles.howCard}>
              <div className={styles.howStep}>{h.step}</div>
              <div className={styles.howTitle}>{t(h.titleKey)}</div>
              <div className={styles.howDesc}>{t(h.descKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className={styles.pricingSection} id="pricing">
        <p className={styles.sectionLabel}>{t('home.pricing_label')}</p>
        <h2 className={styles.sectionTitle}>
          {t('home.pricing_title_1')} <span className={styles.gradientOrange}>{t('home.pricing_title_highlight')}</span>
        </h2>
        <p className={styles.sectionDesc}>{t('home.pricing_desc')}</p>
        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`${styles.pricingCard} ${plan.popular ? styles.pricingPopular : ''}`}>
              {plan.popular && <div className={styles.popularBadge}>{t('home.most_popular')}</div>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <p className={styles.planDesc}>{t(plan.descKey)}</p>
              <div className={styles.planPrice}>
                <span className={styles.priceValue}>{plan.price}</span>
                <span className={styles.priceUnit}>{plan.unit}/{t(plan.periodKey)}</span>
              </div>
              <ul className={styles.planFeatures}>
                {plan.featuresKeys.map((fk) => (
                  <li key={fk}><span className={styles.checkIcon}>✓</span> {t(fk)}</li>
                ))}
              </ul>
              <Link to="/register">
                <button type="button" className={`${styles.planCta} ${plan.popular ? styles.planCtaPopular : ''}`}>
                  {t('home.plan_cta')}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>{t('home.cta_title')}</h2>
          <p className={styles.ctaDesc}>{t('home.cta_desc')}</p>
          <div className={styles.ctaBtns}>
            <Link to="/register">
              <Button size="lg">
                <HiOutlineRocketLaunch size={18} /> {t('home.cta_start_free')}
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                {t('nav.login')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
