import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineBolt,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineVideoCamera,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlinePlay,
} from 'react-icons/hi2';
import styles from '@assets/scss/home/home.module.scss';

interface WorkoutProgram {
  id: string;
  titleKey: string;
  levelKey: string;
  duration: string;
  calories: string;
  image: string;
}

interface TrainerProfile {
  id: string;
  name: string;
  specKey: string;
  expKey: string;
  image: string;
}

interface FeatureItem {
  icon: typeof HiOutlineSparkles;
  titleKey: string;
  descKey: string;
}

const workoutPrograms: WorkoutProgram[] = [
  {
    id: 'hiit',
    titleKey: 'fitness.workout_hiit',
    levelKey: 'fitness.level_intermediate',
    duration: '5 sec',
    calories: '80 cr',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=450&fit=crop&q=80',
  },
  {
    id: 'strength',
    titleKey: 'fitness.workout_strength',
    levelKey: 'fitness.level_advanced',
    duration: '8K Ultra',
    calories: '35 cr',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=450&fit=crop&q=80',
  },
  {
    id: 'yoga',
    titleKey: 'fitness.workout_yoga',
    levelKey: 'fitness.level_beginner',
    duration: 'Prompt Art',
    calories: '25 cr',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&h=450&fit=crop&q=80',
  },
  {
    id: 'boxing',
    titleKey: 'fitness.workout_boxing',
    levelKey: 'fitness.level_intermediate',
    duration: '60 FPS',
    calories: '75 cr',
    image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&h=450&fit=crop&q=80',
  },
];

const trainers: TrainerProfile[] = [
  {
    id: 'alex',
    name: 'OpenAI GPT-4o',
    specKey: 'fitness.spec_hiit',
    expKey: 'fitness.exp_8_years',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=500&fit=crop&q=80',
  },
  {
    id: 'sarah',
    name: 'Midjourney v6.1',
    specKey: 'fitness.spec_yoga',
    expKey: 'fitness.exp_10_years',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&h=500&fit=crop&q=80',
  },
  {
    id: 'marcus',
    name: 'Claude 3.5 Sonnet',
    specKey: 'fitness.spec_strength',
    expKey: 'fitness.exp_12_years',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&h=500&fit=crop&q=80',
  },
  {
    id: 'emma',
    name: 'Runway Gen-3 Alpha',
    specKey: 'fitness.spec_boxing',
    expKey: 'fitness.exp_6_years',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=500&fit=crop&q=80',
  },
];

const featuresList: FeatureItem[] = [
  {
    icon: HiOutlineSparkles,
    titleKey: 'fitness.feat_ai_title',
    descKey: 'fitness.feat_ai_desc',
  },
  {
    icon: HiOutlineChartBar,
    titleKey: 'fitness.feat_track_title',
    descKey: 'fitness.feat_track_desc',
  },
  {
    icon: HiOutlineVideoCamera,
    titleKey: 'fitness.feat_live_title',
    descKey: 'fitness.feat_live_desc',
  },
  {
    icon: HiOutlineAcademicCap,
    titleKey: 'fitness.feat_nutrition_title',
    descKey: 'fitness.feat_nutrition_desc',
  },
];

const pricingPlans = [
  {
    id: 'basic',
    nameKey: 'fitness.plan_basic',
    descKey: 'fitness.plan_basic_desc',
    price: '$9.99',
    popular: false,
    featuresKeys: [
      'fitness.f_workouts_100',
      'fitness.f_basic_tracking',
      'fitness.f_community',
      'fitness.f_email_support',
    ],
  },
  {
    id: 'pro',
    nameKey: 'fitness.plan_pro',
    descKey: 'fitness.plan_pro_desc',
    price: '$19.99',
    popular: true,
    featuresKeys: [
      'fitness.f_workouts_500',
      'fitness.f_ai_trainer',
      'fitness.f_adv_analytics',
      'fitness.f_live_classes',
      'fitness.f_nutrition',
      'fitness.f_priority_support',
    ],
  },
  {
    id: 'elite',
    nameKey: 'fitness.plan_elite',
    descKey: 'fitness.plan_elite_desc',
    price: '$39.99',
    popular: false,
    featuresKeys: [
      'fitness.f_everything_pro',
      'fitness.f_trainer_sessions',
      'fitness.f_custom_plans',
      'fitness.f_body_composition',
      'fitness.f_exclusive_content',
      'fitness.f_support_247',
    ],
  },
];

const HomePage = () => {
  const { t } = useTranslation();

  // Interactive Workout Demo State
  const [tasks, setTasks] = useState([
    { id: 1, nameKey: 'fitness.warm_up', time: '5 min', completed: true },
    { id: 2, nameKey: 'fitness.circuit_1', time: '15 min', completed: true },
    { id: 3, nameKey: 'fitness.circuit_2', time: '15 min', completed: false },
    { id: 4, nameKey: 'fitness.cool_down', time: '5 min', completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className={styles.fitnessGym}>
      {/* ── HERO SECTION ── */}
      <section className={styles.heroSection}>
        {/* Background AI Digital Studio with deep contrast gradient */}
        <div className={styles.heroBgWrapper}>
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop&q=85"
            alt="AI Studio Background"
            className={styles.heroBgImg}
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContainer}>
          {/* Left Content */}
          <div className={styles.heroContent}>
            <div className={styles.aiBadge}>
              <span className={styles.pulseDot} />
              <span className={styles.aiBadgeText}>{t('fitness.hero_badge')}</span>
            </div>

            <h1 className={styles.heroHeadline}>
              {t('fitness.hero_title_1')}<br />
              {t('fitness.hero_title_2')}<br />
              <span className={styles.highlightOrange}>{t('fitness.hero_title_hl')}</span>
            </h1>

            <p className={styles.heroSubtitle}>
              {t('fitness.hero_subtitle')}
            </p>

            <div className={styles.heroCtas}>
              <Link to="/studio" className={styles.btnPrimary}>
                {t('fitness.cta_trial')}
                <HiOutlineArrowRight className={styles.btnIcon} />
              </Link>
              <Link to="/models" className={styles.btnSecondary}>
                <HiOutlinePlay className={styles.btnIcon} />
                {t('fitness.cta_demo')}
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.statCol}>
                <div className={styles.statNumber}>100K+</div>
                <div className={styles.statLabel}>{t('fitness.stat_members')}</div>
              </div>
              <div className={styles.statCol}>
                <div className={styles.statNumber}>100+</div>
                <div className={styles.statLabel}>{t('fitness.stat_workouts')}</div>
              </div>
              <div className={styles.statCol}>
                <div className={styles.statNumber}>99.99%</div>
                <div className={styles.statLabel}>{t('fitness.stat_trainers')}</div>
              </div>
            </div>
          </div>

          {/* Right Floating Workout Widget Demo */}
          <div className={styles.heroWidgetCol}>
            <div className={styles.workoutWidget}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetIconWrap}>
                  <HiOutlineBolt className={styles.widgetBoltIcon} />
                </div>
                <div>
                  <div className={styles.widgetTitle}>{t('fitness.today_workout')}</div>
                  <div className={styles.widgetSubtitle}>{t('fitness.hiit_training')}</div>
                </div>
              </div>

              <div className={styles.widgetTasks}>
                {tasks.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.taskRow}
                    onClick={() => toggleTask(item.id)}
                  >
                    <div className={styles.taskLeft}>
                      <div
                        className={`${styles.checkbox} ${
                          item.completed ? styles.checkboxChecked : ''
                        }`}
                      >
                        {item.completed && <HiOutlineCheck className={styles.checkMark} />}
                      </div>
                      <span
                        className={`${styles.taskName} ${
                          item.completed ? styles.taskNameDone : ''
                        }`}
                      >
                        {t(item.nameKey)}
                      </span>
                    </div>
                    <span className={styles.taskTime}>{item.time}</span>
                  </button>
                ))}
              </div>

              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className={styles.progressLabel}>
                {progressPercent}% Complete
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WORKOUTS SECTION ── */}
      <section id="workouts" className={styles.workoutsSection}>
        <div className={styles.sectionHeaderRow}>
          <div>
            <span className={styles.tagOrange}>{t('fitness.workouts_tag')}</span>
            <h2 className={styles.sectionHeading}>
              {t('fitness.workouts_title')}{' '}
              <span className={styles.highlightOrange}>{t('fitness.workouts_title_hl')}</span>
            </h2>
          </div>
          <Link to="/studio" className={styles.btnSecondarySm}>
            {t('fitness.btn_view_all')}
          </Link>
        </div>

        <div className={styles.workoutsGrid}>
          {workoutPrograms.map(workout => (
            <div key={workout.id} className={styles.workoutCard}>
              <div className={styles.workoutMedia}>
                <img
                  src={workout.image}
                  alt={t(workout.titleKey)}
                  className={styles.workoutImg}
                />
                <div className={styles.workoutImgMask} />
                <span className={styles.levelBadge}>{t(workout.levelKey)}</span>
              </div>
              <div className={styles.workoutInfo}>
                <h3 className={styles.workoutCardTitle}>{t(workout.titleKey)}</h3>
                <div className={styles.workoutMeta}>
                  <span className={styles.metaItem}>
                    <HiOutlineClock className={styles.metaIcon} />
                    {workout.duration}
                  </span>
                  <span className={styles.metaItem}>
                    <HiOutlineFire className={styles.metaIconFire} />
                    {workout.calories}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagOrange}>{t('fitness.features_tag')}</span>
          <h2 className={styles.sectionHeading}>
            {t('fitness.features_title')}{' '}
            <span className={styles.highlightOrange}>{t('fitness.features_title_hl')}</span>
          </h2>
        </div>

        <div className={styles.featuresGrid}>
          {featuresList.map((feat, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <feat.icon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>{t(feat.titleKey)}</h3>
              <p className={styles.featureDesc}>{t(feat.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPERT TRAINERS SECTION ── */}
      <section id="trainers" className={styles.trainersSection}>
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagOrange}>{t('fitness.trainers_tag')}</span>
          <h2 className={styles.sectionHeading}>
            {t('fitness.trainers_title')}{' '}
            <span className={styles.highlightOrange}>{t('fitness.trainers_title_hl')}</span>
          </h2>
          <p className={styles.sectionSubDesc}>
            {t('fitness.trainers_desc')}
          </p>
        </div>

        <div className={styles.trainersGrid}>
          {trainers.map(trainer => (
            <div key={trainer.id} className={styles.trainerCard}>
              <div className={styles.trainerAvatarWrap}>
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className={styles.trainerAvatar}
                />
                <div className={styles.trainerOverlay}>
                  <Link to="/models" className={styles.btnProfile}>
                    {t('fitness.view_profile')}
                  </Link>
                </div>
              </div>
              <h3 className={styles.trainerName}>{trainer.name}</h3>
              <p className={styles.trainerSpec}>{t(trainer.specKey)}</p>
              <p className={styles.trainerExp}>{t(trainer.expKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.sectionHeaderCenter}>
          <span className={styles.tagOrange}>{t('fitness.pricing_tag')}</span>
          <h2 className={styles.sectionHeading}>
            {t('fitness.pricing_title')}{' '}
            <span className={styles.highlightOrange}>{t('fitness.pricing_title_hl')}</span>
          </h2>
          <p className={styles.sectionSubDesc}>
            {t('fitness.pricing_desc')}
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {pricingPlans.map(plan => (
            <div
              key={plan.id}
              className={`${styles.pricingCard} ${
                plan.popular ? styles.pricingCardPopular : ''
              }`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>
                  {t('fitness.most_popular')}
                </div>
              )}
              <h3 className={styles.planName}>{t(plan.nameKey)}</h3>
              <p className={styles.planDesc}>{t(plan.descKey)}</p>
              <div className={styles.priceRow}>
                <span className={styles.priceMain}>{plan.price}</span>
                <span className={styles.pricePeriod}>{t('fitness.per_month')}</span>
              </div>
              <ul className={styles.planFeatureList}>
                {plan.featuresKeys.map(fk => (
                  <li key={fk} className={styles.planFeatureItem}>
                    <HiOutlineCheck className={styles.planCheckIcon} />
                    <span>{t(fk)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className={plan.popular ? styles.planBtnPopular : styles.planBtn}>
                {t('fitness.start_trial')}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── MOTIVATIONAL CTA BANNER ── */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaBannerCard}>
          <div className={styles.ctaBadge}>
            <HiOutlineShieldCheck className={styles.ctaBadgeIcon} />
            <span>7-DAY TRIAL GUARANTEE</span>
          </div>
          <h2 className={styles.ctaTitle}>
            {t('fitness.cta_banner_title')}
          </h2>
          <p className={styles.ctaSubtitle}>
            {t('fitness.cta_banner_desc')}
          </p>
          <div className={styles.ctaButtonsRow}>
            <Link to="/register" className={styles.btnPrimaryLg}>
              {t('fitness.cta_trial')}
              <HiOutlineArrowRight className={styles.btnIcon} />
            </Link>
            <Link to="/login" className={styles.btnSecondaryLg}>
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
