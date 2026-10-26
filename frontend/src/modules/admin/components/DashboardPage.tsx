import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineCheckBadge,
  HiOutlineCurrencyDollar,
  HiOutlineBolt,
  HiOutlineArrowTrendingUp,
  HiOutlineExclamationTriangle,
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

// Top KPI metrics matching Velzon CRM
const kpiCards = [
  {
    icon: HiOutlineUsers,
    labelKey: 'admin.dashboard.total_users',
    value: '12,458',
    trend: '+8.2%',
    trendUp: true,
    bg: '#eef3fd',
    color: '#3577f1',
  },
  {
    icon: HiOutlineBanknotes,
    labelKey: 'admin.dashboard.total_revenue',
    value: '489.4M ₫',
    trend: '+12.5%',
    trendUp: true,
    bg: '#e6f7f5',
    color: '#0ab39c',
  },
  {
    icon: HiOutlineCheckBadge,
    labelKey: 'admin.dashboard.lead_conversion',
    value: '99.85%',
    trend: '+0.1%',
    trendUp: true,
    bg: '#fef8ee',
    color: '#f7b84b',
  },
  {
    icon: HiOutlineCurrencyDollar,
    labelKey: 'admin.dashboard.daily_income',
    value: '15.8M ₫',
    trend: '+5.4%',
    trendUp: true,
    bg: '#eaf5fb',
    color: '#299cdb',
  },
  {
    icon: HiOutlineBolt,
    labelKey: 'admin.dashboard.total_requests',
    value: '2.85M',
    trend: '+18.4%',
    trendUp: true,
    bg: '#fef0ed',
    color: '#f06548',
  },
];

// Package Sales Forecast (Starter, Pro, Studio, Enterprise)
const packageSalesData = [
  { name: 'Starter (50K)', sales: 420, revenue: 21 },
  { name: 'Pro (200K)', sales: 680, revenue: 136 },
  { name: 'Studio (500K)', sales: 310, revenue: 155 },
  { name: 'Enterprise (2M)', sales: 88, revenue: 176 },
];

// 4 Nhóm Model trong Note tay: Chat, Ảnh, Video, Dev Request
const modelCategoryData = [
  { name: 'Modal Chat', value: 48, color: '#3577f1', reqs: '1.36M' },
  { name: 'Modal Tạo Ảnh', value: 24, color: '#0ab39c', reqs: '680K' },
  { name: 'Modal Tạo Video', value: 16, color: '#f7b84b', reqs: '450K' },
  { name: 'Modal Req Dev', value: 12, color: '#8b5cf6', reqs: '360K' },
];

// Balance Overview: Doanh thu nạp vs Chi phí token
const balanceOverviewData = [
  { month: 'Jan', revenue: 28, cost: 14 },
  { month: 'Feb', revenue: 35, cost: 18 },
  { month: 'Mar', revenue: 42, cost: 20 },
  { month: 'Apr', revenue: 48, cost: 22 },
  { month: 'May', revenue: 65, cost: 28 },
  { month: 'Jun', revenue: 78, cost: 32 },
  { month: 'Jul', revenue: 95, cost: 38 },
  { month: 'Aug', revenue: 110, cost: 42 },
  { month: 'Sep', revenue: 135, cost: 50 },
  { month: 'Oct', revenue: 158, cost: 56 },
];

// Deals / Recent Transaction status table
const recentDeals = [
  {
    id: 'TX-9901',
    user: 'Hai Nguyen (Studio)',
    avatar: 'H',
    package: 'Studio Pack',
    status: 'Deal Won',
    statusType: 'success',
    amount: '500,000 ₫',
    date: '26 Oct, 2026',
  },
  {
    id: 'TX-9900',
    user: 'Thanh Le AI',
    avatar: 'T',
    package: 'Pro Pack',
    status: 'Deal Won',
    statusType: 'success',
    amount: '200,000 ₫',
    date: '26 Oct, 2026',
  },
  {
    id: 'TX-9899',
    user: 'Minh Quang Dev',
    avatar: 'M',
    package: 'Enterprise',
    status: 'Pending',
    statusType: 'warning',
    amount: '2,000,000 ₫',
    date: '25 Oct, 2026',
  },
  {
    id: 'TX-9898',
    user: 'Cyber Lab VN',
    avatar: 'C',
    package: 'Studio Pack',
    status: 'Deal Won',
    statusType: 'success',
    amount: '500,000 ₫',
    date: '25 Oct, 2026',
  },
  {
    id: 'TX-9897',
    user: 'Hoang Anh Dev',
    avatar: 'H',
    package: 'Starter Pack',
    status: 'Deal Won',
    statusType: 'success',
    amount: '50,000 ₫',
    date: '24 Oct, 2026',
  },
];

// Pool health list with Alert when empty/low
const poolHealthItems = [
  { name: 'OpenAI GPT-4o Pool', status: 'active', keys: '18 Active Keys', quota: '92% Quota' },
  { name: 'Claude 3.5 Sonnet Pool', status: 'active', keys: '12 Active Keys', quota: '84% Quota' },
  { name: 'Midjourney Token Pool', status: 'active', keys: '6 Accounts', quota: '78% Fast-hr' },
  { name: 'Runway Gen-3 Token Pool', status: 'warning', keys: '1 Token Left', quota: '15% Quota' },
  { name: 'DeepSeek-V3 API Pool', status: 'active', keys: '25 Active Keys', quota: '98% Quota' },
  { name: 'Luma Video Dream Pool', status: 'danger', keys: '0 Key (Cạn Pool!)', quota: '0% Hết Token' },
];

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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                <XAxis dataKey="name" stroke="#878a99" fontSize={11} />
                <YAxis stroke="#878a99" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ebec',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#3577f1" radius={[4, 4, 0, 0]} name="Doanh thu (Tr.₫)" />
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ebec',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(val: unknown) => [`${val}%`, 'Chiếm']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {modelCategoryData.map((m) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#495057' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color }} />
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
              <span className={styles.statNum} style={{ color: '#3577f1' }}>489.4M ₫</span>
              <span className={styles.statTitle}>Tổng Thu Nạp</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#0ab39c' }}>182.1M ₫</span>
              <span className={styles.statTitle}>Chi Phí API Gốc</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#f7b84b' }}>62.8%</span>
              <span className={styles.statTitle}>Biên Lợi Nhuận Gộp</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={balanceOverviewData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3577f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3577f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ab39c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ab39c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                <XAxis dataKey="month" stroke="#878a99" fontSize={11} />
                <YAxis stroke="#878a99" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ebec',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3577f1" fill="url(#colorRev)" strokeWidth={2} name="Nạp Tiền (Tr.₫)" />
                <Area type="monotone" dataKey="cost" stroke="#0ab39c" fill="url(#colorCost)" strokeWidth={2} name="Chi Phí API (Tr.₫)" />
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
            <span style={{ fontSize: '0.8rem', color: '#878a99' }}>Real-time Gateway Sync</span>
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
              {recentDeals.map((deal) => (
                <tr key={deal.id}>
                  <td style={{ fontWeight: 600, color: '#3577f1' }}>{deal.id}</td>
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
                  <td style={{ fontWeight: 600 }}>{deal.amount}</td>
                  <td style={{ color: '#878a99', fontSize: '0.75rem' }}>{deal.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Pool Health / Cảnh Báo Khi Pool Hết */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.pool_alerts') || 'Giám Sát Tình Trạng Pool'}</h3>
            <span style={{ fontSize: '0.75rem', color: '#f06548', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <HiOutlineExclamationTriangle size={14} /> 1 Cảnh Báo
            </span>
          </div>
          <div className={styles.poolHealthList}>
            {poolHealthItems.map((pool, idx) => (
              <div key={idx} className={styles.poolHealthItem}>
                <div className={styles.poolLeft}>
                  <span className={`${styles.poolDot} ${styles[pool.status]}`} />
                  <div>
                    <div className={styles.poolName}>{pool.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#878a99' }}>{pool.keys}</div>
                  </div>
                </div>
                <span className={`${styles.pillBadge} ${styles[pool.status]}`}>
                  {pool.quota}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
