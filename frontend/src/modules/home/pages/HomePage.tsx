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
  { step: 1, title: 'Kết Nối API Key', desc: 'Thêm API key hoặc account token từ OpenAI, Claude, Midjourney...' },
  { step: 2, title: 'Cấu Hình Model', desc: 'Chọn model, định giá credit, thiết lập thuật toán điều phối.' },
  { step: 3, title: 'Bắt Đầu Kiếm Tiền', desc: 'Khách hàng nạp credit, gọi API qua gateway, bạn hưởng lợi nhuận.' },
];

const providers = ['OpenAI', 'Claude', 'Gemini', 'Midjourney', 'Runway', 'DeepSeek', 'Groq', 'Qwen', 'Stable Diffusion', 'Luma AI'];

const pricingPlans = [
  {
    name: 'BASIC',
    desc: 'Perfect for getting started',
    price: '50,000',
    unit: '₫/tháng',
    features: ['Truy cập 10+ Models', 'Giám sát cơ bản', 'Cộng đồng hỗ trợ', 'Email support'],
    popular: false,
  },
  {
    name: 'PRO',
    desc: 'Most popular choice',
    price: '200,000',
    unit: '₫/tháng',
    features: ['Truy cập 100+ Models', 'AI Load Balancer', 'Phân tích nâng cao', 'Webhook & Realtime', 'Quản lý nhiều Pool', 'Ưu tiên hỗ trợ'],
    popular: true,
  },
  {
    name: 'ELITE',
    desc: 'For serious businesses',
    price: '500,000',
    unit: '₫/tháng',
    features: ['Mọi tính năng Pro', 'Dedicated Gateway', 'Custom model routing', 'API Rate limit mở rộng', 'White-label branding', 'Hỗ trợ 24/7'],
    popular: false,
  },
];

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
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

      {/* ── Features ── */}
      <section className={styles.featuresSection} id="features">
        <p className={styles.sectionLabel}>POWERFUL FEATURES</p>
        <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
        <p className={styles.sectionDesc}>
          Nền tảng AI Gateway mạnh mẽ nhất — hỗ trợ đa nhà cung cấp, pool quản lý key thông minh, và hệ thống billing tự động.
        </p>
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
        <p className={styles.sectionLabel}>HOW IT WORKS</p>
        <h2 className={styles.sectionTitle}>3 Bước Bắt Đầu</h2>
        <p className={styles.sectionDesc}>
          Từ kết nối API key đến thu lợi nhuận — chỉ mất vài phút cấu hình.
        </p>
        <div className={styles.howGrid}>
          {howItWorks.map((h) => (
            <div key={h.step} className={styles.howCard}>
              <div className={styles.howStep}>{h.step}</div>
              <div className={styles.howTitle}>{h.title}</div>
              <div className={styles.howDesc}>{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Providers ── */}
      <section className={styles.providers}>
        <p className={styles.providerLabel}>{t('hero.providers_label') || 'Hỗ Trợ Hơn 100+ Mô Hình AI'}</p>
        <div className={styles.providerLogos}>
          {providers.map((p) => (
            <div key={p} className={styles.providerChip}>{p}</div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className={styles.pricingSection} id="pricing">
        <p className={styles.sectionLabel}>PRICING</p>
        <h2 className={styles.sectionTitle}>
          CHOOSE YOUR <span className={styles.gradientOrange}>PLAN</span>
        </h2>
        <p className={styles.sectionDesc}>
          Start with a 7-day free trial. Cancel anytime.
        </p>
        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`${styles.pricingCard} ${plan.popular ? styles.pricingPopular : ''}`}>
              {plan.popular && <div className={styles.popularBadge}>MOST POPULAR</div>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <p className={styles.planDesc}>{plan.desc}</p>
              <div className={styles.planPrice}>
                <span className={styles.priceValue}>{plan.price}</span>
                <span className={styles.priceUnit}>{plan.unit}</span>
              </div>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}><span className={styles.checkIcon}>✓</span> {f}</li>
                ))}
              </ul>
              <Link to="/register">
                <button type="button" className={`${styles.planCta} ${plan.popular ? styles.planCtaPopular : ''}`}>
                  BẮT ĐẦU DÙNG THỬ
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Sẵn Sàng Khởi Tạo AI Gateway?</h2>
          <p className={styles.ctaDesc}>
            Đăng ký miễn phí, nhận 50,000 credits dùng thử. Không cần thẻ tín dụng.
          </p>
          <div className={styles.ctaBtns}>
            <Link to="/register">
              <Button size="lg">
                <HiOutlineRocketLaunch size={18} /> Bắt Đầu Miễn Phí
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Đăng Nhập
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
