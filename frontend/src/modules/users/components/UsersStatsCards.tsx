import React from 'react';
import { Card } from '@modules/core/design-system/Card';
import {
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineServerStack,
} from 'react-icons/hi2';

interface UsersStatsCardsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    totalCredits: number;
  };
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: `${color}18`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  </Card>
);

export const UsersStatsCards: React.FC<UsersStatsCardsProps> = ({ stats }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      <StatCard
        label="Tổng Người Dùng Hệ Thống"
        value={stats.totalUsers.toLocaleString()}
        icon={<HiOutlineUsers />}
        color="#6366f1"
      />
      <StatCard
        label="Tài Khoản Đang Hoạt Động"
        value={stats.activeUsers.toLocaleString()}
        icon={<HiOutlineCheckCircle />}
        color="#10b981"
      />
      <StatCard
        label="Tài Khoản Bị Tạm Khóa"
        value={stats.lockedUsers.toLocaleString()}
        icon={<HiOutlineLockClosed />}
        color="#f43f5e"
      />
      <StatCard
        label="Tổng Tín Dụng Toàn Hệ Thống"
        value={`${stats.totalCredits.toLocaleString()} pts`}
        icon={<HiOutlineServerStack />}
        color="#8b5cf6"
      />
    </div>
  );
};

export default UsersStatsCards;
