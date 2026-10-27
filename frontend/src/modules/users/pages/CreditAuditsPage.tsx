import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineBanknotes,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineScale,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Select } from '@modules/core/design-system/Select';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput, StatCard } from '@modules/core/design-system/Components';
import {
  userManagementService,
  type SystemCreditAuditItem,
} from '../services/userManagementService';

export const CreditAuditsPage = () => {
  const [logs, setLogs] = useState<SystemCreditAuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deltaType, setDeltaType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalAdjustments: 0,
    totalCredited: 0,
    totalDeducted: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userManagementService.getSystemCreditAudits({
        page,
        pageSize,
        deltaType,
        search: searchTerm,
      });
      setLogs(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setStats(res.stats);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, deltaType, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const typeOptions = [
    { value: 'ALL', label: 'Tất cả biến động' },
    { value: 'POSITIVE', label: 'Lệnh Cộng (+) Tín Dụng' },
    { value: 'NEGATIVE', label: 'Lệnh Trừ (-) Tín Dụng' },
  ];

  const columns: TableColumn<SystemCreditAuditItem>[] = [
    {
      key: 'userEmail',
      header: 'Tài Khoản Thụ Hưởng',
      render: (l) => (
        <div>
          <strong style={{ color: '#fafafa', display: 'block', fontSize: '0.84rem' }}>{l.userName}</strong>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>{l.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'delta',
      header: 'Biến Động (Delta)',
      align: 'right',
      render: (l) => {
        const isPositive = l.delta > 0;
        return (
          <span style={{
            color: isPositive ? '#10b981' : '#f43f5e',
            fontWeight: 700,
            fontSize: '0.92rem',
          }}>
            {isPositive ? '+' : ''}{l.delta.toLocaleString()} pts
          </span>
        );
      },
    },
    {
      key: 'balanceAfter',
      header: 'Đối Soát Số Dư (Trước → Sau)',
      align: 'right',
      render: (l) => (
        <span style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
          {l.balanceBefore.toLocaleString()} → <strong style={{ color: '#fafafa' }}>{l.balanceAfter.toLocaleString()}</strong>
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Lý Do Kiểm Toán Kế Toán',
      render: (l) => (
        <div style={{ maxWidth: 360 }}>
          <span style={{ color: '#e4e4e7', fontSize: '0.82rem', display: 'block' }}>
            {l.reason}
          </span>
        </div>
      ),
    },
    {
      key: 'actorEmail',
      header: 'Thực Hiện Bởi',
      render: (l) => (
        <div>
          <strong style={{ color: '#818cf8', display: 'block', fontSize: '0.82rem' }}>{l.actorEmail}</strong>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>IP: {l.ipAddress}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời Gian',
      align: 'right',
      render: (l) => (
        <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
          {l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : ''}
        </span>
      ),
    },
  ];

  const netCredits = stats.totalCredited - stats.totalDeducted;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              Sổ Cái Biến Động Tín Dụng (Credit Ledger)
            </h1>
            <Badge variant="success" size="sm">
              ACID Row-Locked
            </Badge>
          </div>
          <p style={{ color: '#71717a', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            Sổ cái kiểm toán bất biến theo dõi toàn bộ các lệnh can thiệp tín dụng thủ công, đối soát số dư và chống gian lận
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} loading={loading}>
          <HiOutlineArrowPath size={16} style={{ marginRight: 6 }} />
          Làm Mới Sổ Cái
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label="Tổng Lệnh Điều Chỉnh"
          value={stats.totalAdjustments.toLocaleString()}
          icon={<HiOutlineBanknotes />}
          color="#6366f1"
        />
        <StatCard
          label="Tổng Tín Dụng Đã Cấp (+)"
          value={`+${stats.totalCredited.toLocaleString()}`}
          icon={<HiOutlineArrowTrendingUp />}
          color="#10b981"
        />
        <StatCard
          label="Tổng Tín Dụng Đã Trừ (-)"
          value={`-${stats.totalDeducted.toLocaleString()}`}
          icon={<HiOutlineArrowTrendingDown />}
          color="#f43f5e"
        />
        <StatCard
          label="Dòng Tín Dụng Thực Tế"
          value={`${netCredits >= 0 ? '+' : ''}${netCredits.toLocaleString()} pts`}
          icon={<HiOutlineScale />}
          color="#8b5cf6"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo email người thụ hưởng, email admin, lý do, IP..."
            />
          </div>

          <div style={{ width: 260 }}>
            <Select
              options={typeOptions}
              value={deltaType}
              onChange={(e) => {
                setDeltaType(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card>
        <Table
          rowKey={(l) => l.id}
          columns={columns}
          data={logs}
          loading={loading}
          emptyText="Chưa có dữ liệu biến động credit nào phù hợp với bộ lọc"
        />

        {/* Server-Side Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid #27272a',
          fontSize: '0.82rem',
          color: '#71717a',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            Hiển thị <strong>{logs.length}</strong> / <strong>{totalCount}</strong> giao dịch sổ cái (Trang {page} / {totalPages})
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang Kế
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreditAuditsPage;
