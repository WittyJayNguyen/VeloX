import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineCheckBadge,
  HiOutlineCurrencyDollar,
  HiOutlineBolt,
  HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import styles from '@assets/scss/admin/dashboard.module.scss';

// Top KPI metrics matching CRM
const kpiCards = [
  {
    icon: HiOutlineUsers,
    labelKey: 'admin.dashboard.total_users',
    value: '1',
    trend: '+0%',
    trendUp: true,
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#6366f1',
  },
  {
    icon: HiOutlineBanknotes,
    labelKey: 'admin.dashboard.total_revenue',
    value: '0 ₫',
    trend: '+0%',
    trendUp: true,
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#10b981',
  },
  {
    icon: HiOutlineCheckBadge,
    labelKey: 'admin.dashboard.lead_conversion',
    value: '0%',
    trend: '+0%',
    trendUp: true,
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
  },
  {
    icon: HiOutlineCurrencyDollar,
    labelKey: 'admin.dashboard.daily_income',
    value: '0 ₫',
    trend: '+0%',
    trendUp: true,
    bg: 'rgba(6, 182, 212, 0.12)',
    color: '#06b6d4',
  },
  {
    icon: HiOutlineBolt,
    labelKey: 'admin.dashboard.total_requests',
    value: '0',
    trend: '+0%',
    trendUp: true,
    bg: 'rgba(244, 63, 94, 0.12)',
    color: '#f43f5e',
  },
];

// Package Sales Forecast (Starter, Pro, Studio, Enterprise)
const packageSalesData = [
  { name: 'Starter (50K)', sales: 0, revenue: 0 },
  { name: 'Pro (200K)', sales: 0, revenue: 0 },
  { name: 'Studio (500K)', sales: 0, revenue: 0 },
  { name: 'Enterprise (2M)', sales: 0, revenue: 0 },
];

// 4 Nhóm Model: Chat, Ảnh, Video, Dev Request
const modelCategoryData = [
  { name: 'Modal Chat', value: 0, color: '#6366f1', reqs: '0' },
  { name: 'Modal Tạo Ảnh', value: 0, color: '#10b981', reqs: '0' },
  { name: 'Modal Tạo Video', value: 0, color: '#f59e0b', reqs: '0' },
  { name: 'Modal Req Dev', value: 0, color: '#8b5cf6', reqs: '0' },
];

// Balance Overview: Doanh thu nạp vs Chi phí token
const balanceOverviewData = [
  { month: 'Jan', revenue: 0, cost: 0 },
  { month: 'Feb', revenue: 0, cost: 0 },
  { month: 'Mar', revenue: 0, cost: 0 },
  { month: 'Apr', revenue: 0, cost: 0 },
  { month: 'May', revenue: 0, cost: 0 },
  { month: 'Jun', revenue: 0, cost: 0 },
  { month: 'Jul', revenue: 0, cost: 0 },
  { month: 'Aug', revenue: 0, cost: 0 },
  { month: 'Sep', revenue: 0, cost: 0 },
  { month: 'Oct', revenue: 0, cost: 0 },
];

// Deals / Recent Transaction status table
interface DealRecord {
  id: string;
  user: string;
  avatar: string;
  package: string;
  status: string;
  statusType: 'success' | 'warning' | 'danger';
  amount: string;
  date: string;
}

const recentDeals: DealRecord[] = [];

// Pool health list
interface PoolHealthItem {
  name: string;
  status: 'active' | 'warning' | 'danger';
  keys: string;
  quota: string;
}

const poolHealthItems: PoolHealthItem[] = [];

const DashboardPage = () => {
  const { t } = useTranslation();
  const [selectedSort] = useState('2026');

  return (
    <div className={styles.dashboard}>
      {/* 5 Top KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((c, i) => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ backgroundColor: c.bg, color: c.color }}>
              <c.icon size={24} />
            </div>
            <div className={styles.kpiDetails}>
              <span className={styles.kpiLabel}>{t(c.labelKey)}</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{c.value}</span>
                <span className={`${styles.trendBadge} ${c.trendUp ? styles.up : styles.down}`}>
                  <HiOutlineArrowTrendingUp size={14} />
                  {c.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3 Main Charts Row */}
      <div className={styles.chartsGrid}>
        {/* Chart 1: Doanh số theo gói */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.sales_forecast') || 'Doanh Số Bán Theo Gói'}</h3>
            <span className={styles.cardAction}>Gói Nạp Credit</span>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={packageSalesData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tick={{ fill: '#a1a1aa' }} />
                <YAxis stroke="#71717a" fontSize={11} tick={{ fill: '#a1a1aa' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fafafa',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#a1a1aa' }}
                  labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                />
                <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Doanh thu (Tr.₫)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 4 Nhóm Model (Note tay: chat, ảnh, video, dev req) */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.model_types') || 'Thống Kê 4 Nhóm Model'}</h3>
            <span className={styles.cardAction}>Tỉ Lệ Yêu Cầu</span>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={modelCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {modelCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fafafa',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#a1a1aa' }}
                  labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                  formatter={(val: unknown) => [`${val}%`, 'Chiếm']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {modelCategoryData.map((m) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                <span>{m.name} ({m.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Balance Overview (Doanh thu vs Chi phí) */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.balance_overview') || 'Cân Bằng Doanh Thu & Chi Phí Token'}</h3>
            <span className={styles.cardAction}>Năm {selectedSort}</span>
          </div>
          <div className={styles.chartStatsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#6366f1' }}>0 ₫</span>
              <span className={styles.statTitle}>Tổng Thu Nạp</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#10b981' }}>0 ₫</span>
              <span className={styles.statTitle}>Chi Phí API Gốc</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#f59e0b' }}>0%</span>
              <span className={styles.statTitle}>Biên Lợi Nhuận Gộp</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={balanceOverviewData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tick={{ fill: '#a1a1aa' }} />
                <YAxis stroke="#71717a" fontSize={11} tick={{ fill: '#a1a1aa' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fafafa',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#a1a1aa' }}
                  labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#colorRev)" strokeWidth={2.5} name="Nạp Tiền (Tr.₫)" />
                <Area type="monotone" dataKey="cost" stroke="#10b981" fill="url(#colorCost)" strokeWidth={2.5} name="Chi Phí API (Tr.₫)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Deals Status Table + Quick Pool Health list */}
      <div className={styles.bottomGrid}>
        {/* Table of Deals / Nạp Tiền */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.deals_status') || 'Giao Dịch Nạp Tiền Gần Nhất'}</h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Real-time Gateway Sync</span>
          </div>
          <table className={styles.velzonTable}>
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Người Dùng</th>
                <th>Gói Nạp</th>
                <th>Trạng Thái</th>
                <th>Số Tiền</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#71717a' }}>
                    Chưa có giao dịch nạp tiền nào
                  </td>
                </tr>
              ) : (
                recentDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td style={{ fontWeight: 600, color: '#6366f1' }}>{deal.id}</td>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.miniAvatar}>{deal.avatar}</div>
                        <span className={styles.userNameText}>{deal.user}</span>
                      </div>
                    </td>
                    <td>{deal.package}</td>
                    <td>
                      <span className={`${styles.pillBadge} ${styles[deal.statusType]}`}>
                        {deal.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#fafafa' }}>{deal.amount}</td>
                    <td style={{ color: '#71717a', fontSize: '0.75rem' }}>{deal.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Pool Health */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.pool_alerts') || 'Giám Sát Tình Trạng Pool'}</h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Bình Thường
            </span>
          </div>
          <div className={styles.poolHealthList}>
            {poolHealthItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '0.85rem' }}>
                Hệ thống đang sẵn sàng, chưa có cảnh báo pool
              </div>
            ) : (
              poolHealthItems.map((pool, idx) => (
                <div key={idx} className={styles.poolHealthItem}>
                  <div className={styles.poolLeft}>
                    <span className={`${styles.poolDot} ${styles[pool.status]}`} />
                    <div>
                      <div className={styles.poolName}>{pool.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{pool.keys}</div>
                    </div>
                  </div>
                  <span className={`${styles.pillBadge} ${styles[pool.status]}`}>
                    {pool.quota}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
