import { useTranslation } from 'react-i18next';
import {
  HiOutlineUsers, HiOutlineBanknotes,
  HiOutlineBolt, HiOutlineServerStack,
} from 'react-icons/hi2';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import styles from './DashboardPage.module.scss';

const kpiCards = [
  { icon: HiOutlineUsers, key: 'total_users', value: '12,458', change: '+8.2%', color: '#3b82f6' },
  { icon: HiOutlineBanknotes, key: 'total_revenue', value: '45.2M ₫', change: '+12.5%', color: '#10b981' },
  { icon: HiOutlineBolt, key: 'total_credits_used', value: '892K', change: '+5.1%', color: '#f59e0b' },
  { icon: HiOutlineServerStack, key: 'pool_health', value: '98.7%', change: '+0.3%', color: '#8b5cf6' },
];

const revenueData = [
  { day: 'T2', revenue: 12 }, { day: 'T3', revenue: 18 },
  { day: 'T4', revenue: 15 }, { day: 'T5', revenue: 22 },
  { day: 'T6', revenue: 28 }, { day: 'T7', revenue: 35 },
  { day: 'CN', revenue: 30 },
];

const consumptionData = [
  { name: 'Chat AI', value: 45, color: '#3b82f6' },
  { name: 'Image Gen', value: 25, color: '#8b5cf6' },
  { name: 'Video Gen', value: 15, color: '#10b981' },
  { name: 'Dev Request', value: 15, color: '#f59e0b' },
];

const DashboardPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t('admin.dashboard.title')}</h1>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <div key={card.key} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t(`admin.dashboard.${card.key}`)}</span>
              <span className={styles.kpiValue}>{card.value}</span>
            </div>
            <span className={styles.kpiChange} style={{ color: card.color }}>{card.change}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3>{t('admin.dashboard.revenue_chart')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#161d2f', border: '1px solid #1e293b',
                  borderRadius: 8, color: '#f1f5f9',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>{t('admin.dashboard.consumption')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={consumptionData}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={100}
                dataKey="value"
                paddingAngle={4}
                stroke="none"
              >
                {consumptionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#161d2f', border: '1px solid #1e293b',
                  borderRadius: 8, color: '#f1f5f9',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {consumptionData.map((item) => (
              <div key={item.name} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: item.color }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
