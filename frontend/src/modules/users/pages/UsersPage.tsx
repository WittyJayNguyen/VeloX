import { useState } from 'react';
import { HiOutlineUserPlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBanknotes, HiOutlineShieldCheck } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput, Avatar } from '@modules/core/design-system/Components';

export interface UserManagementItem {
  id: string;
  fullName: string;
  email: string;
  role: 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_OPERATOR' | 'ROLE_USER';
  creditBalance: number;
  isActive: boolean;
  registeredDate: string;
  vccTopupTotal: number;
}

const initialUsers: UserManagementItem[] = [
  { id: 'u_1', fullName: 'Admin VeloX (Quản Trị)', email: 'admin@velox.ai', role: 'ROLE_SUPER_ADMIN', creditBalance: 9999999, isActive: true, registeredDate: '2026-01-10', vccTopupTotal: 0 },
  { id: 'u_2', fullName: 'Hai Nguyen Studio', email: 'studio.vn@gmail.com', role: 'ROLE_USER', creditBalance: 450200, isActive: true, registeredDate: '2026-03-15', vccTopupTotal: 1500000 },
  { id: 'u_3', fullName: 'Le Quoc Operator', email: 'operator@velox.ai', role: 'ROLE_OPERATOR', creditBalance: 50000, isActive: true, registeredDate: '2026-05-20', vccTopupTotal: 0 },
  { id: 'u_4', fullName: 'Dev Agency Global', email: 'dev@agency.io', role: 'ROLE_USER', creditBalance: 1250000, isActive: true, registeredDate: '2026-08-01', vccTopupTotal: 4000000 },
];

const roleColors: Record<string, string> = { ROLE_SUPER_ADMIN: '#f43f5e', ROLE_ADMIN: '#6366f1', ROLE_OPERATOR: '#10b981', ROLE_USER: '#71717a' };
const roleBadgeVariant = (r: string) => r === 'ROLE_SUPER_ADMIN' ? 'danger' : r === 'ROLE_ADMIN' ? 'primary' : r === 'ROLE_OPERATOR' ? 'success' : 'neutral' as const;

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả phân quyền' },
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_OPERATOR', label: 'Operator' },
  { value: 'ROLE_USER', label: 'User Thường' },
];

const FORM_ROLE_OPTIONS = [
  { value: 'ROLE_USER', label: 'ROLE_USER (Người dùng thông thường)' },
  { value: 'ROLE_OPERATOR', label: 'ROLE_OPERATOR (Vận hành)' },
  { value: 'ROLE_ADMIN', label: 'ROLE_ADMIN (Quản trị viên)' },
  { value: 'ROLE_SUPER_ADMIN', label: 'ROLE_SUPER_ADMIN (Toàn quyền)' },
];

const UsersPage = () => {
  const [users, setUsers] = useState<UserManagementItem[]>(() => {
    const saved = localStorage.getItem('velox_managed_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [page, setPage] = useState(1);

  // User Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserManagementItem['role']>('ROLE_USER');

  // Credit Adjust Modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [targetUser, setTargetUser] = useState<UserManagementItem | null>(null);
  const [creditDelta, setCreditDelta] = useState(50000);

  const saveUsers = (updated: UserManagementItem[]) => { setUsers(updated); localStorage.setItem('velox_managed_users', JSON.stringify(updated)); };

  const handleOpenAdd = () => { setEditingUser(null); setFormName(''); setFormEmail(''); setFormRole('ROLE_USER'); setShowModal(true); };
  const handleOpenEdit = (u: UserManagementItem) => { setEditingUser(u); setFormName(u.fullName); setFormEmail(u.email); setFormRole(u.role); setShowModal(true); };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    if (editingUser) {
      saveUsers(users.map((u) => u.id === editingUser.id ? { ...u, fullName: formName, email: formEmail, role: formRole } : u));
    } else {
      saveUsers([...users, { id: `u_${Date.now()}`, fullName: formName, email: formEmail, role: formRole, creditBalance: 20000, isActive: true, registeredDate: new Date().toISOString().split('T')[0], vccTopupTotal: 0 }]);
    }
    setShowModal(false);
  };

  const handleDeleteUser = (id: string) => { if (confirm('Xoá người dùng này?')) saveUsers(users.filter((u) => u.id !== id)); };
  const handleToggleActive = (id: string) => saveUsers(users.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
  const handleOpenCreditModal = (u: UserManagementItem) => { setTargetUser(u); setCreditDelta(50000); setShowCreditModal(true); };

  const handleApplyCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    saveUsers(users.map((u) => u.id === targetUser.id ? { ...u, creditBalance: Math.max(0, u.creditBalance + Number(creditDelta)) } : u));
    setShowCreditModal(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (filterRole === 'ALL' || u.role === filterRole);
  });

  const columns: TableColumn<UserManagementItem>[] = [
    {
      key: 'fullName', header: 'Họ Tên & Email',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={u.fullName} color={roleColors[u.role]} size="md" />
          <div>
            <strong style={{ color: '#fafafa', display: 'block' }}>{u.fullName}</strong>
            <span style={{ fontSize: '0.72rem', color: '#71717a' }}>{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Phân Quyền',
      render: (u) => <Badge variant={roleBadgeVariant(u.role)} size="sm" dot><HiOutlineShieldCheck size={12} /> {u.role}</Badge>,
    },
    {
      key: 'creditBalance', header: 'Số Dư Credit', align: 'right',
      render: (u) => <strong style={{ color: '#10b981' }}>{u.creditBalance.toLocaleString()} cr</strong>,
    },
    {
      key: 'vccTopupTotal', header: 'Tổng Nạp VCC', align: 'right',
      render: (u) => <span style={{ fontWeight: 600, color: '#6366f1' }}>{u.vccTopupTotal.toLocaleString()} ₫</span>,
    },
    { key: 'registeredDate', header: 'Ngày Tham Gia', render: (u) => <span style={{ color: '#71717a', fontSize: '0.78rem' }}>{u.registeredDate}</span> },
    {
      key: 'isActive', header: 'Trạng Thái',
      render: (u) => (
        <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
          <button type="button" onClick={() => handleToggleActive(u.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }}>
            {u.isActive ? 'Hoạt Động' : 'Đã Khóa'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions', header: 'Thao Tác', align: 'center',
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenCreditModal(u)} title="Nạp/Trừ Credit"><HiOutlineBanknotes size={16} /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(u)} title="Sửa"><HiOutlinePencilSquare size={16} /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} title="Xoá"><HiOutlineTrash size={16} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <SearchInput placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
            <Select options={ROLE_OPTIONS} value={filterRole} onChange={(e) => setFilterRole(e.target.value)} />
          </div>
          <Button variant="primary" size="md" onClick={handleOpenAdd}><HiOutlineUserPlus size={16} /> Thêm Người Dùng</Button>
        </div>
      </Card>

      {/* Table */}
      <Card title="Quản Lý Thành Viên & Phân Quyền" subtitle={`${filteredUsers.length} người dùng`} padding="none">
        <Table columns={columns} data={filteredUsers} rowKey={(u) => u.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal: Add/Edit User */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng Mới'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSaveUser}>Lưu Thông Tin</Button></>}
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Họ và Tên" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Nguyễn Văn A" required fullWidth />
          <Input label="Địa Chỉ Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" required fullWidth />
          <Select label="Cấp Phân Quyền" options={FORM_ROLE_OPTIONS} value={formRole} onChange={(e) => setFormRole(e.target.value as UserManagementItem['role'])} fullWidth />
        </form>
      </Modal>

      {/* Modal: Credit Adjust */}
      <Modal open={showCreditModal && !!targetUser} onClose={() => setShowCreditModal(false)} title={`Điều Chỉnh Credit: ${targetUser?.fullName || ''}`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowCreditModal(false)}>Hủy</Button><Button variant="primary" onClick={handleApplyCredit}>Cập Nhật</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#18181b', padding: '0.85rem', borderRadius: 8, fontSize: '0.85rem', color: '#a1a1aa' }}>
            Số dư hiện tại: <strong style={{ color: '#10b981', fontSize: '1rem' }}>{targetUser?.creditBalance.toLocaleString()} Credits</strong>
          </div>
          <Input label="Số Credits Điều Chỉnh (+ hoặc -)" type="number" value={creditDelta} onChange={(e) => setCreditDelta(Number(e.target.value))} hint="Nhập dương để cộng, âm để trừ" fullWidth />
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
