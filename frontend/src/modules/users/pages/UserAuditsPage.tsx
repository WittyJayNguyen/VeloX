import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineArrowPath,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineClipboardDocumentList,
  HiOutlineEye,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput, StatCard } from '@modules/core/design-system/Components';
import {
  userManagementService,
  type SystemUserAuditItem,
} from '../services/userManagementService';

const actionBadges: Record<string, { variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple'; label: string }> = {
  LOGIN_SUCCESS: { variant: 'success', label: 'Đăng Nhập Thành Công' },
  LOGIN_FAILED: { variant: 'danger', label: 'Đăng Nhập Thất Bại' },
  LOGOUT: { variant: 'neutral', label: 'Đăng Xuất An Toàn' },
  SECURITY_LOCKOUT: { variant: 'danger', label: 'Khóa Tự Động (Brute-Force)' },
  ROLE_CHANGE: { variant: 'purple', label: 'Phân Quyền / Vai Trò' },
  CREDIT_ADJUST: { variant: 'primary', label: 'Điều Chỉnh Credit' },
  CREATE_USER: { variant: 'primary', label: 'Tạo Thành Viên' },
  REGISTER: { variant: 'success', label: 'Tự Đăng Ký' },
  UPDATE_USER: { variant: 'neutral', label: 'Cập Nhật Hồ Sơ' },
  STATUS_CHANGE: { variant: 'warning', label: 'Khóa / Mở Khóa' },
  PASSWORD_RESET: { variant: 'purple', label: 'Đặt Lại Mật Khẩu' },
  PASSWORD_CHANGE: { variant: 'purple', label: 'Tự Đổi Mật Khẩu' },
  DELETE_USER: { variant: 'danger', label: 'Xóa Tài Khoản' },
};

export const UserAuditsPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<SystemUserAuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalEvents: 0,
    securityLockouts: 0,
    passwordResets: 0,
    failedLogins: 0,
  });

  // Modal for detail / JSON diff
  const [selectedLog, setSelectedLog] = useState<SystemUserAuditItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userManagementService.getSystemUserAudits({
        page,
        pageSize,
        action: actionFilter,
        search: searchTerm,
      });
      setLogs(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setStats({
        totalEvents: res.stats.totalEvents,
        securityLockouts: res.stats.securityLockouts,
        passwordResets: res.stats.passwordResets,
        failedLogins: res.stats.failedLogins || 0,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actionOptions = [
    { value: 'ALL', label: 'Tất cả hành động' },
    { value: 'LOGIN_SUCCESS', label: 'Đăng Nhập Thành Công' },
    { value: 'LOGIN_FAILED', label: 'Đăng Nhập Thất Bại' },
    { value: 'SECURITY_LOCKOUT', label: 'Khóa Tự Động (Brute-Force)' },
    { value: 'ROLE_CHANGE', label: 'Phân Quyền / Vai Trò' },
    { value: 'CREDIT_ADJUST', label: 'Điều Chỉnh Credit' },
    { value: 'CREATE_USER', label: 'Tạo Thành Viên' },
    { value: 'REGISTER', label: 'Tự Đăng Ký' },
    { value: 'UPDATE_USER', label: 'Cập Nhật Hồ Sơ' },
    { value: 'STATUS_CHANGE', label: 'Khóa / Mở Khóa' },
    { value: 'PASSWORD_RESET', label: 'Đặt Lại Mật Khẩu' },
    { value: 'PASSWORD_CHANGE', label: 'Tự Đổi Mật Khẩu' },
    { value: 'DELETE_USER', label: 'Xóa Tài Khoản' },
    { value: 'LOGOUT', label: 'Đăng Xuất An Toàn' },
  ];

  const columns: TableColumn<SystemUserAuditItem>[] = [
    {
      key: 'action',
      header: 'Hành Động IAM',
      render: (l) => {
        const meta = actionBadges[l.action] || { variant: 'neutral' as const, label: l.action };
        return (
          <Badge variant={meta.variant} size="sm" dot>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'actorEmail',
      header: 'Người Thực Hiện',
      render: (l) => (
        <div>
          <strong style={{ color: '#fafafa', display: 'block', fontSize: '0.84rem' }}>{l.actorEmail}</strong>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>IP: {l.ipAddress}</span>
        </div>
      ),
    },
    {
      key: 'targetEmail',
      header: 'Tài Khoản Bị Tác Động',
      render: (l) => (
        <div>
          <strong style={{ color: '#818cf8', display: 'block', fontSize: '0.84rem' }}>{l.targetName}</strong>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>{l.targetEmail}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Lý Do & Nội Dung',
      render: (l) => (
        <div style={{ maxWidth: 380 }}>
          <span style={{ color: '#e4e4e7', fontSize: '0.82rem', display: 'block' }}>
            {l.reason || 'Không có ghi chú'}
          </span>
          {l.details && (
            <button
              type="button"
              onClick={() => setSelectedLog(l)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '0.72rem',
                padding: 0,
                marginTop: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <HiOutlineEye size={12} /> Xem chi tiết diff thay đổi
            </button>
          )}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              {t('admin.audit.iam_title', 'Nhật Ký Kiểm Toán IAM & Bảo Mật')}
            </h1>
            <Badge variant="purple" size="sm">
              {t('admin.audit.immutable_badge', 'Immutable Log (Bất biến)')}
            </Badge>
          </div>
          <p style={{ color: '#71717a', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            {t('admin.audit.iam_desc', 'Giám sát toàn bộ các hành vi can thiệp tài khoản, thay đổi quyền hạn, đổi mật khẩu và sự kiện phòng thủ tấn công')}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} loading={loading}>
          <HiOutlineArrowPath size={16} style={{ marginRight: 6 }} />
          {t('admin.audit.refresh_ledger', 'Làm Mới Sổ Cái')}
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label={t('admin.audit.stat_total_events', 'Tổng Sự Kiện Kiểm Toán')}
          value={stats.totalEvents.toLocaleString()}
          icon={<HiOutlineClipboardDocumentList />}
          color="#6366f1"
        />
        <StatCard
          label={t('admin.audit.stat_failed_logins', 'Cảnh Báo Đăng Nhập Sai')}
          value={(stats.failedLogins ?? 0).toLocaleString()}
          icon={<HiOutlineLockClosed />}
          color="#f59e0b"
        />
        <StatCard
          label={t('admin.audit.stat_lockouts', 'Sự Kiện Khóa Brute-Force')}
          value={stats.securityLockouts.toLocaleString()}
          icon={<HiOutlineLockClosed />}
          color="#f43f5e"
        />
        <StatCard
          label={t('admin.audit.stat_resets', 'Đổi / Đặt Lại Mật Khẩu')}
          value={stats.passwordResets.toLocaleString()}
          icon={<HiOutlineKey />}
          color="#eab308"
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
              placeholder="Tìm theo email người thao tác, email thành viên, lý do, IP..."
            />
          </div>

          <div style={{ width: 260 }}>
            <Select
              options={actionOptions}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <Table
          rowKey={(l) => l.id}
          columns={columns}
          data={logs}
          loading={loading}
          emptyText="Chưa có nhật ký kiểm toán nào được ghi nhận cho bộ lọc này"
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
            Hiển thị <strong>{logs.length}</strong> / <strong>{totalCount}</strong> bản ghi kiểm toán (Trang {page} / {totalPages})
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

      {/* Modal View Details / Diff */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Chi Tiết Thao Tác: ${selectedLog?.action || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem' }}>
            <div style={{ padding: 10, background: '#121214', borderRadius: 6, border: '1px solid #1f1f23' }}>
              <span style={{ color: '#71717a', fontSize: '0.72rem', display: 'block' }}>Người Thực Hiện</span>
              <strong style={{ color: '#fafafa' }}>{selectedLog?.actorEmail}</strong>
            </div>

            <div style={{ padding: 10, background: '#121214', borderRadius: 6, border: '1px solid #1f1f23' }}>
              <span style={{ color: '#71717a', fontSize: '0.72rem', display: 'block' }}>Địa Chỉ IP</span>
              <code style={{ color: '#818cf8' }}>{selectedLog?.ipAddress}</code>
            </div>

            <div style={{ padding: 10, background: '#121214', borderRadius: 6, border: '1px solid #1f1f23' }}>
              <span style={{ color: '#71717a', fontSize: '0.72rem', display: 'block' }}>Tài Khoản Tác Động</span>
              <strong style={{ color: '#fafafa' }}>{selectedLog?.targetEmail}</strong>
            </div>

            <div style={{ padding: 10, background: '#121214', borderRadius: 6, border: '1px solid #1f1f23' }}>
              <span style={{ color: '#71717a', fontSize: '0.72rem', display: 'block' }}>Thời Gian</span>
              <span style={{ color: '#a1a1aa' }}>
                {selectedLog?.createdAt ? new Date(selectedLog.createdAt).toLocaleString('vi-VN') : ''}
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: '#a1a1aa', fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Lý Do Ghi Nhận
            </span>
            <div style={{ padding: '8px 12px', background: '#09090b', border: '1px solid #27272a', borderRadius: 6, fontSize: '0.84rem', color: '#e4e4e7' }}>
              {selectedLog?.reason || 'Không có lý do kèm theo'}
            </div>
          </div>

          {selectedLog?.details && (
            <div>
              <span style={{ color: '#a1a1aa', fontSize: '0.76rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Dữ Liệu Chi Tiết (JSON Payload / Diff)
              </span>
              <pre style={{
                margin: 0,
                padding: '12px 14px',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#34d399',
                fontSize: '0.78rem',
                maxHeight: 220,
                overflowY: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                  } catch {
                    return selectedLog.details;
                  }
                })()}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserAuditsPage;
