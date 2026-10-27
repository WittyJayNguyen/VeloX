import { useState, useEffect } from 'react';
import {
  HiOutlineUserPlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineBanknotes,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineServerStack,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput, Avatar, StatCard } from '@modules/core/design-system/Components';
import {
  userManagementService,
  type UserDto,
  type RoleDto,
} from '../services/userManagementService';

const roleColors: Record<string, string> = {
  ROLE_SUPER_ADMIN: '#f43f5e',
  ROLE_ADMIN: '#6366f1',
  ROLE_OPERATOR: '#10b981',
  ROLE_USER: '#71717a',
};

const roleBadgeVariant = (r: string) => {
  if (r === 'ROLE_SUPER_ADMIN') return 'danger';
  if (r === 'ROLE_ADMIN') return 'primary';
  if (r === 'ROLE_OPERATOR') return 'success';
  return 'neutral' as const;
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [page, setPage] = useState(1);

  // User Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('ROLE_USER');
  const [formInitialCredit, setFormInitialCredit] = useState(50000);

  // Credit Adjust Modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UserDto | null>(null);
  const [creditDelta, setCreditDelta] = useState(50000);

  // Load Data
  const loadData = async () => {
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        userManagementService.getUsers(),
        userManagementService.getRoles(),
      ]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole(roles.length > 0 ? roles[roles.length - 1].code : 'ROLE_USER');
    setFormInitialCredit(50000);
    setShowModal(true);
  };

  const handleOpenEdit = (u: UserDto) => {
    setEditingUser(u);
    setFormName(u.fullName);
    setFormEmail(u.email);
    setFormRole(u.role);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    try {
      if (editingUser) {
        await userManagementService.updateUser(editingUser.id, {
          full_name: formName.trim(),
          email: formEmail.trim(),
          role_id: formRole,
          is_active: editingUser.isActive,
        });
      } else {
        await userManagementService.createUser({
          full_name: formName.trim(),
          email: formEmail.trim(),
          role_id: formRole,
          credit_balance: Number(formInitialCredit),
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu người dùng';
      alert(errorMsg);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá người dùng này?')) {
      try {
        await userManagementService.deleteUser(id);
        await loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể xóa người dùng này';
        alert(errorMsg);
      }
    }
  };

  const handleToggleActive = async (u: UserDto) => {
    try {
      await userManagementService.updateUser(u.id, {
        full_name: u.fullName,
        email: u.email,
        role_id: u.role,
        is_active: !u.isActive,
      });
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái';
      alert(errorMsg);
    }
  };

  const handleOpenCreditModal = (u: UserDto) => {
    setTargetUser(u);
    setCreditDelta(50000);
    setShowCreditModal(true);
  };

  const handleApplyCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    try {
      await userManagementService.adjustCredit(targetUser.id, Number(creditDelta));
      setShowCreditModal(false);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể điều chỉnh credit';
      alert(errorMsg);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (filterRole === 'ALL' || u.role === filterRole);
  });

  // Stats
  const activeCount = users.filter((u) => u.isActive).length;
  const totalCredits = users.reduce((acc, u) => acc + (u.creditBalance || 0), 0);

  const roleFilterOptions = [
    { value: 'ALL', label: 'Tất cả vai trò' },
    ...roles.map((r) => ({ value: r.code, label: `${r.name} (${r.code})` })),
  ];

  const columns: TableColumn<UserDto>[] = [
    {
      key: 'fullName',
      header: 'Họ Tên & Email',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={u.fullName} color={roleColors[u.role] || '#6366f1'} size="md" />
          <div>
            <strong style={{ color: '#fafafa', display: 'block' }}>{u.fullName}</strong>
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Vai Trò RBAC',
      render: (u) => {
        const matchingRole = roles.find((r) => r.code === u.role);
        return (
          <Badge variant={roleBadgeVariant(u.role)} size="sm" dot>
            <HiOutlineShieldCheck size={12} style={{ marginRight: 3 }} />
            {matchingRole ? matchingRole.name : u.role}
          </Badge>
        );
      },
    },
    {
      key: 'creditBalance',
      header: 'Số Dư Tín Dụng',
      align: 'right',
      render: (u) => (
        <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>
          {(u.creditBalance || 0).toLocaleString()} pts
        </strong>
      ),
    },
    {
      key: 'registeredDate',
      header: 'Ngày Đăng Ký',
      render: (u) => (
        <span style={{ color: '#71717a', fontSize: '0.78rem' }}>
          {u.registeredDate}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      align: 'center',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
          <button
            type="button"
            onClick={() => handleToggleActive(u)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
            title="Bấm để bật/tắt hoạt động"
          >
            {u.isActive ? 'Hoạt Động' : 'Đã Khóa'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenCreditModal(u)}
            title="Nạp / Trừ Credit"
          >
            <HiOutlineBanknotes size={16} style={{ color: '#fbbf24' }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(u)}
            title="Sửa thông tin & Đổi vai trò"
          >
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(u.id)}
            title="Xoá thành viên"
          >
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title="Tổng Thành Viên" value={users.length} icon={<HiOutlineUsers size={22} />} change="Đồng bộ Backend API" changeType="up" />
        <StatCard title="Đang Hoạt Động" value={`${activeCount} / ${users.length}`} icon={<HiOutlineCheckCircle size={22} />} change={`${users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0}% tài khoản mở`} changeType="up" />
        <StatCard title="Tổng Credit Người Dùng" value={`${totalCredits.toLocaleString()} pts`} icon={<HiOutlineBanknotes size={22} />} change="Khả dụng sử dụng model" changeType="up" />
        <StatCard
          title="Kết Nối Backend API"
          value={isBackendConnected ? 'Backend Live' : 'Offline Storage'}
          icon={<HiOutlineServerStack size={22} />}
          change={isBackendConnected ? 'FastAPI 127.0.0.1:8000' : 'Chế độ an toàn'}
          changeType={isBackendConnected ? 'up' : 'neutral'}
        />
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
            <SearchInput
              placeholder="Tìm theo tên thành viên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
            <Select options={roleFilterOptions} value={filterRole} onChange={(e) => setFilterRole(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="md" onClick={loadData} title="Làm mới dữ liệu từ BE">
              <HiOutlineArrowPath size={16} /> Đồng Bộ BE
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              <HiOutlineUserPlus size={16} /> Thêm Người Dùng
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card
        title="Quản Trị Người Dùng & Phân Vai Trò"
        subtitle={`Đang quản lý ${filteredUsers.length} thành viên với phân quyền trực tiếp từ Backend`}
        headerRight={<HiOutlineUsers size={20} style={{ color: '#10b981' }} />}
        padding="none"
      >
        <Table columns={columns} data={filteredUsers} rowKey={(u) => u.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal Add / Edit User */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng Mới'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveUser}>
              {editingUser ? 'Lưu Thông Tin' : 'Tạo Người Dùng'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Họ và Tên"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
            required
            fullWidth
          />
          <Input
            label="Địa Chỉ Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="client@velox.ai"
            required
            fullWidth
          />
          <Select
            label="Gán Vai Trò (Role)"
            options={roles.map((r) => ({ value: r.code, label: `${r.name} (${r.code})` }))}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
            fullWidth
          />
          {!editingUser && (
            <Input
              label="Số Dư Credit Ban Đầu"
              type="number"
              value={formInitialCredit}
              onChange={(e) => setFormInitialCredit(Number(e.target.value))}
              hint="Mặc định cấp 50,000 credits cho tài khoản mới"
              fullWidth
            />
          )}
        </form>
      </Modal>

      {/* Modal Điều Chỉnh Credit */}
      <Modal
        open={showCreditModal && !!targetUser}
        onClose={() => setShowCreditModal(false)}
        title={`Điều Chỉnh Credit: ${targetUser?.fullName || ''}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleApplyCredit}>
              Cập Nhật Credit
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              padding: '0.85rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              color: '#a1a1aa',
            }}
          >
            Số dư hiện tại:{' '}
            <strong style={{ color: '#10b981', fontSize: '1rem' }}>
              {(targetUser?.creditBalance || 0).toLocaleString()} Credits
            </strong>
          </div>
          <Input
            label="Số Credits Điều Chỉnh (+ hoặc -)"
            type="number"
            value={creditDelta}
            onChange={(e) => setCreditDelta(Number(e.target.value))}
            hint="Nhập số dương để cộng (vd: 50000), số âm để trừ (vd: -20000)"
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
