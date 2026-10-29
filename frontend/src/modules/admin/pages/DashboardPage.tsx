import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineCheckBadge,
  HiOutlineCurrencyDollar,
  HiOutlineBolt,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowPath,
  HiOutlineCircleStack,
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
import apiClient from '@modules/core/lib/apiClient';
import styles from '@assets/scss/admin/dashboard.module.scss';

interface DashboardKpis {
  total_users: number;
  total_users_trend: string;
  total_revenue_vnd: number;
  total_revenue_trend: string;
  lead_conversion: number;
  lead_conversion_trend: string;
  daily_income_vnd: number;
  daily_income_trend: string;
  total_requests: number;
  total_requests_trend: string;
}

interface PackageSaleItem {
  name: string;
  sales: number;
  revenue: number;
}

interface ModelCategoryItem {
  name: string;
  value: number;
  color: string;
  reqs: string;
}

interface BalanceOverviewItem {
  month: string;
  revenue: number;
  cost: number;
}

interface BalanceSummary {
  total_revenue_vnd: number;
  total_cost_vnd: number;
  gross_margin_pct: number;
}

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

interface PoolHealthItem {
  name: string;
  status: 'active' | 'warning' | 'danger';
  keys: string;
  quota: string;
}

interface DashboardPayload {
  kpis: DashboardKpis;
  package_sales: PackageSaleItem[];
  model_categories: ModelCategoryItem[];
  balance_overview: BalanceOverviewItem[];
  balance_summary: BalanceSummary;
  recent_deals: DealRecord[];
  pool_health: PoolHealthItem[];
  year: number;
}

const formatVnd = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
const formatNumber = (num: number) => new Intl.NumberFormat('vi-VN').format(num);

const DashboardPage = () => {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<DashboardPayload | null>(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.get<{ status: string; data: DashboardPayload }>('/system/dashboard', {
        params: { year: selectedYear },
      });
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load CRM dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Top KPI Cards
  const kpiCards = [
    {
      icon: HiOutlineUsers,
      labelKey: 'admin.dashboard.total_users',
      value: formatNumber(data?.kpis.total_users ?? 0),
      trend: data?.kpis.total_users_trend ?? '+0%',
      trendUp: true,
      bg: 'rgba(99, 102, 241, 0.12)',
      color: '#6366f1',
    },
    {
      icon: HiOutlineBanknotes,
      labelKey: 'admin.dashboard.total_revenue',
      value: formatVnd(data?.kpis.total_revenue_vnd ?? 0),
      trend: data?.kpis.total_revenue_trend ?? '+0%',
      trendUp: true,
      bg: 'rgba(16, 185, 129, 0.12)',
      color: '#10b981',
    },
    {
      icon: HiOutlineCheckBadge,
      labelKey: 'admin.dashboard.lead_conversion',
      value: `${data?.kpis.lead_conversion ?? 0}%`,
      trend: data?.kpis.lead_conversion_trend ?? '+0%',
      trendUp: true,
      bg: 'rgba(245, 158, 11, 0.12)',
      color: '#f59e0b',
    },
    {
      icon: HiOutlineCurrencyDollar,
      labelKey: 'admin.dashboard.daily_income',
      value: formatVnd(data?.kpis.daily_income_vnd ?? 0),
      trend: data?.kpis.daily_income_trend ?? '+0%',
      trendUp: true,
      bg: 'rgba(6, 182, 212, 0.12)',
      color: '#06b6d4',
    },
    {
      icon: HiOutlineBolt,
      labelKey: 'admin.dashboard.total_requests',
      value: formatNumber(data?.kpis.total_requests ?? 0),
      trend: data?.kpis.total_requests_trend ?? '+0%',
      trendUp: true,
      bg: 'rgba(244, 63, 94, 0.12)',
      color: '#f43f5e',
    },
  ];

  const packageSales = data?.package_sales ?? [];
  const modelCategories = data?.model_categories ?? [];
  const balanceOverview = data?.balance_overview ?? [];
  const recentDeals = data?.recent_deals ?? [];
  const poolHealth = data?.pool_health ?? [];

  return (
    <div className={styles.dashboard}>
      {/* Top Header & Quick Actions */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTitleWrap}>
          <h1>{t('admin.dashboard.title') || 'Bảng Điều Khiển Quản Trị CRM'}</h1>
          <p>{t('admin.dashboard.subtitle') || 'Theo dõi toàn diện doanh thu, mô hình AI, hạ tầng pool và giao dịch nạp tiền theo thời gian thực'}</p>
        </div>
        <div className={styles.headerActions}>
          <select
            className={styles.yearSelect}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            title={t('admin.dashboard.refresh') || 'Làm mới dữ liệu'}
          >
            <HiOutlineArrowPath size={16} />
            <span>{t('admin.dashboard.refresh') || 'Làm mới'}</span>
          </button>
        </div>
      </div>

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
                <span className={styles.kpiValue}>{loading ? '...' : c.value}</span>
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
            <span className={styles.cardAction}>{t('admin.dashboard.credit_packages') || 'Gói Nạp Credit'}</span>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={packageSales}>
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
                  formatter={(val: unknown) => [`${val} Tr.₫`, 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Doanh thu (Tr.₫)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 4 Nhóm Model (Chat, Ảnh, Video, Dev req) */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.model_types') || 'Thống Kê 4 Nhóm Model'}</h3>
            <span className={styles.cardAction}>{t('admin.dashboard.request_ratio') || 'Tỉ Lệ Yêu Cầu'}</span>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={modelCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {modelCategories.map((entry, index) => (
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
            {modelCategories.map((m) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                <span>{m.name} ({m.value}%) - {m.reqs} reqs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Balance Overview (Doanh thu vs Chi phí) */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>{t('admin.dashboard.balance_overview') || 'Cân Bằng Doanh Thu & Chi Phí Token'}</h3>
            <span className={styles.cardAction}>{t('admin.dashboard.year') || 'Năm'} {selectedYear}</span>
          </div>
          <div className={styles.chartStatsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#6366f1' }}>
                {loading ? '...' : formatVnd(data?.balance_summary.total_revenue_vnd ?? 0)}
              </span>
              <span className={styles.statTitle}>{t('admin.dashboard.total_deposit') || 'Tổng Thu Nạp'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#10b981' }}>
                {loading ? '...' : formatVnd(data?.balance_summary.total_cost_vnd ?? 0)}
              </span>
              <span className={styles.statTitle}>{t('admin.dashboard.base_api_cost') || 'Chi Phí API Gốc'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum} style={{ color: '#f59e0b' }}>
                {loading ? '...' : `${data?.balance_summary.gross_margin_pct ?? 0}%`}
              </span>
              <span className={styles.statTitle}>{t('admin.dashboard.gross_margin') || 'Biên Lợi Nhuận Gộp'}</span>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={balanceOverview}>
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
                  formatter={(val: unknown) => [`${val} Tr.₫`, 'Số tiền']}
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
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{t('admin.dashboard.gateway_sync') || 'Real-time Gateway Sync'}</span>
          </div>
          <table className={styles.velzonTable}>
            <thead>
              <tr>
                <th>{t('admin.dashboard.code') || 'Mã GD'}</th>
                <th>{t('admin.dashboard.user') || 'Người Dùng'}</th>
                <th>{t('admin.dashboard.package') || 'Gói Nạp'}</th>
                <th>{t('admin.dashboard.status') || 'Trạng Thái'}</th>
                <th>{t('admin.dashboard.amount') || 'Số Tiền'}</th>
                <th>{t('admin.dashboard.date') || 'Ngày'}</th>
              </tr>
            </thead>
            <tbody>
              {recentDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#71717a' }}>
                    {loading ? 'Đang tải danh sách giao dịch...' : (t('admin.dashboard.no_deals') || 'Chưa có giao dịch nạp tiền nào')}
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
              <HiOutlineCircleStack size={14} />
              {t('admin.dashboard.pool_normal') || 'Bình Thường'}
            </span>
          </div>
          <div className={styles.poolHealthList}>
            {poolHealth.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '0.85rem' }}>
                {loading ? 'Đang kiểm tra hạ tầng pool...' : (t('admin.dashboard.no_pools') || 'Hệ thống đang sẵn sàng, chưa có cảnh báo pool')}
              </div>
            ) : (
              poolHealth.map((pool, idx) => (
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
