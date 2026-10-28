import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@modules/core/design-system/Card';
import Button from '@modules/core/design-system/Button';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Badge } from '@modules/core/design-system/Badge';
import { Select } from '@modules/core/design-system/Select';
import { Input } from '@modules/core/design-system/Input';
import {
  HiOutlineUserPlus,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineDocumentMagnifyingGlass,
} from 'react-icons/hi2';

import {
  userManagementService,
  type UserDto,
  type RoleDto,
} from '../services/userManagementService';

import UsersStatsCards from '../components/UsersStatsCards';
import UserFormModal from '../components/UserFormModal';
import CreditAdjustModal from '../components/CreditAdjustModal';
import UserLockModal from '../components/UserLockModal';
import PasswordResetModal from '../components/PasswordResetModal';
import UserDetailModal from '../components/UserDetailModal';

export const UsersPage: React.FC = () => {
  // Data State
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    totalCredits: 0,
  });

  // Modal Control States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditTargetUser, setCreditTargetUser] = useState<UserDto | null>(null);

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockTargetUser, setLockTargetUser] = useState<UserDto | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserDto | null>(null);
  const [revealedNewPassword, setRevealedNewPassword] = useState<string | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTargetUser, setDetailTargetUser] = useState<UserDto | null>(null);

  // Load Data from Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, fetchedRoles] = await Promise.all([
        userManagementService.getUsers({
          page,
          pageSize,
          search: searchTerm,
          role: filterRole,
          status: filterStatus,
        }),
        userManagementService.getRoles(),
      ]);

      setUsers(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setStats(res.stats);
      setRoles(fetchedRoles);
      setIsBackendConnected(true);
    } catch (err: unknown) {
      setIsBackendConnected(false);
      const msg = err instanceof Error ? err.message : 'Không thể kết nối máy chủ';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear toast status after 5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Modal Opener Handlers
  const handleOpenAdd = () => {
    setEditingUser(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (u: UserDto) => {
    setEditingUser(u);
    setShowFormModal(true);
  };

  const handleOpenCreditModal = (u: UserDto) => {
    setCreditTargetUser(u);
    setShowCreditModal(true);
  };

  const handleOpenLockModal = (u: UserDto) => {
    setLockTargetUser(u);
    setShowLockModal(true);
  };

  const handleOpenResetPassword = (u: UserDto) => {
    setResetTargetUser(u);
    setRevealedNewPassword(null);
    setShowResetModal(true);
  };

  const handleOpenDetailModal = (u: UserDto) => {
    setDetailTargetUser(u);
    setShowDetailModal(true);
  };

  const handleUserCreatedWithPassword = (u: UserDto, tempPass: string) => {
    setResetTargetUser(u);
    setRevealedNewPassword(tempPass);
    setShowResetModal(true);
  };

  // Delete User
  const handleDeleteUser = async (u: UserDto) => {
    if (u.email === 'admin@velox.ai') {
      alert('Bảo mật: Không thể xóa tài khoản Super Admin của hệ thống');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${u.email}? Mọi dữ liệu liên quan sẽ bị thu hồi vĩnh viễn.`)) {
      try {
        await userManagementService.deleteUser(u.id);
        setStatusMessage({ type: 'success', text: `Đã xóa tài khoản ${u.email} thành công` });
        await loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể xóa người dùng';
        setStatusMessage({ type: 'error', text: errorMsg });
      }
    }
  };

  // Filter Dropdown Options
  const roleFilterOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất Cả Vai Trò' },
    ...roles.map((r) => ({ value: r.code, label: `${r.name} (${r.code})` })),
  ], [roles]);

  const statusFilterOptions = useMemo(() => [
    { value: 'ALL', label: 'Mọi Trạng Thái' },
    { value: 'ACTIVE', label: 'Đang Hoạt Động' },
    { value: 'LOCKED', label: 'Bị Tạm Khóa' },
  ], []);

  // Table Columns Definition
  const columns: TableColumn<UserDto>[] = [
    {
      key: 'userCode',
      header: 'Mã KH',
      render: (u) => (
        <span
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '2px 8px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          #{u.userCode || (u as any).user_code || u.id.replace(/-/g, '').slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Thành Viên',
      render: (u) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ color: '#fafafa' }}>{u.fullName}</strong>
            {u.email === 'admin@velox.ai' && (
              <Badge variant="danger" size="sm">GỐC HỆ THỐNG</Badge>
            )}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: 2 }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai Trò RBAC',
      render: (u) => {
        const variant =
          u.role === 'ROLE_SUPER_ADMIN'
            ? 'danger'
            : u.role === 'ROLE_ADMIN'
            ? 'primary'
            : u.role === 'ROLE_OPERATOR'
            ? 'success'
            : 'neutral';
        return <Badge variant={variant} size="sm">{u.role}</Badge>;
      },
    },
    {
      key: 'tier',
      header: 'Hạng (Tier)',
      render: (u) => (
        <Badge
          variant={u.tier === 'ENTERPRISE' ? 'purple' : u.tier === 'PRO' ? 'primary' : 'neutral'}
          size="sm"
        >
          {u.tier || 'FREE'}
        </Badge>
      ),
    },
    {
      key: 'creditBalance',
      header: 'Số Dư Tín Dụng',
      render: (u) => (
        <strong style={{ color: '#10b981', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
          {(u.creditBalance || 0).toLocaleString()} Credits
        </strong>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
          {u.isActive ? 'Hoạt Động' : 'Đang Khóa'}
        </Badge>
      ),
    },
    {
      key: 'registeredDate',
      header: 'Ngày Đăng Ký',
      render: (u) => <span style={{ color: '#a1a1aa', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{u.registeredDate}</span>,
    },
    {
      key: 'actions',
      header: 'Thao Tác Bảo Mật & Quản Trị',
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <button
            type="button"
            onClick={() => handleOpenDetailModal(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Xem hồ sơ và nhật ký bảo mật chi tiết"
          >
            <HiOutlineDocumentMagnifyingGlass size={14} />
            Hồ Sơ
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreditModal(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Điều chỉnh số dư credit"
          >
            <HiOutlineCurrencyDollar size={14} />
            Credit
          </button>

          <button
            type="button"
            onClick={() => handleOpenLockModal(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: u.isActive ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${u.isActive ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              color: u.isActive ? '#f43f5e' : '#34d399',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title={u.isActive ? 'Khóa tài khoản khẩn cấp' : 'Mở khóa tài khoản'}
          >
            <HiOutlineLockClosed size={14} />
            {u.isActive ? 'Khóa' : 'Mở'}
          </button>

          <button
            type="button"
            onClick={() => handleOpenResetPassword(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#eab308',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Đặt lại mật khẩu bảo mật"
          >
            <HiOutlineKey size={14} />
            Reset Pass
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818cf8',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Chỉnh sửa thông tin thành viên"
          >
            <HiOutlinePencilSquare size={14} />
            Sửa
          </button>

          <button
            type="button"
            onClick={() => handleDeleteUser(u)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Xóa tài khoản khỏi hệ thống"
          >
            <HiOutlineTrash size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Server Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              Quản Trị Người Dùng & Phân Quyền
            </h1>
            <Badge variant={isBackendConnected ? 'success' : 'danger'} size="sm" dot>
              {isBackendConnected ? 'Hệ Thống Thực (SQLite / DB Engine)' : 'Chưa Kết Nối Máy Chủ'}
            </Badge>
          </div>
          <p style={{ color: '#71717a', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            Quản lý tài khoản thành viên, hạn mức tín dụng, cơ chế khóa bảo mật và chống tấn công leo thang đặc quyền
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} loading={loading}>
            <HiOutlineArrowPath size={16} style={{ marginRight: 6 }} />
            Làm Mới
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <HiOutlineUserPlus size={16} style={{ marginRight: 6 }} />
            Tạo Người Dùng Mới
          </Button>
        </div>
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {statusMessage.type === 'success' ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationTriangle size={20} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Real Statistics Cards */}
      <UsersStatsCards stats={stats} />

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Input
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo Mã KH (#10001), họ tên, email hoặc User ID..."
            />
          </div>

          <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
            <Select
              options={roleFilterOptions}
              value={filterRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
            <Select
              options={statusFilterOptions}
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Real User Data Table */}
      <Card>
        <Table
          rowKey={(u: UserDto) => u.id}
          columns={columns}
          data={users}
          loading={loading}
          emptyText="Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại"
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
            Hiển thị <strong>{users.length}</strong> / <strong>{totalCount}</strong> thành viên (Trang {page} / {totalPages})
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

      {/* Modal 1: Create / Edit User */}
      <UserFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        editingUser={editingUser}
        roles={roles}
        onSuccess={loadData}
        setStatusMessage={setStatusMessage}
        onUserCreatedWithPassword={handleUserCreatedWithPassword}
      />

      {/* Modal 2: Adjust Credit */}
      <CreditAdjustModal
        open={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        targetUser={creditTargetUser}
        onSuccess={loadData}
        setStatusMessage={setStatusMessage}
      />

      {/* Modal 3: Lock / Unlock User Account */}
      <UserLockModal
        open={showLockModal}
        onClose={() => setShowLockModal(false)}
        targetUser={lockTargetUser}
        onSuccess={loadData}
        setStatusMessage={setStatusMessage}
      />

      {/* Modal 4: Reset Password */}
      <PasswordResetModal
        open={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setRevealedNewPassword(null);
        }}
        targetUser={resetTargetUser}
        initialRevealedPassword={revealedNewPassword}
        onSuccess={loadData}
        setStatusMessage={setStatusMessage}
      />

      {/* Modal 5: User Details & Security Audit Trail */}
      <UserDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        userId={detailTargetUser?.id || null}
        userFullName={detailTargetUser?.fullName}
      />
    </div>
  );
};

export default UsersPage;
