import { useState } from 'react';
import {
  HiOutlineUserPlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineBanknotes,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

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
  {
    id: 'u_1',
    fullName: 'Admin VeloX (Quản Trị)',
    email: 'admin@velox.ai',
    role: 'ROLE_SUPER_ADMIN',
    creditBalance: 9999999,
    isActive: true,
    registeredDate: '2026-01-10',
    vccTopupTotal: 0,
  },
  {
    id: 'u_2',
    fullName: 'Hai Nguyen Studio',
    email: 'studio.vn@gmail.com',
    role: 'ROLE_USER',
    creditBalance: 450200,
    isActive: true,
    registeredDate: '2026-03-15',
    vccTopupTotal: 1500000,
  },
  {
    id: 'u_3',
    fullName: 'Le Quoc Operator',
    email: 'operator@velox.ai',
    role: 'ROLE_OPERATOR',
    creditBalance: 50000,
    isActive: true,
    registeredDate: '2026-05-20',
    vccTopupTotal: 0,
  },
  {
    id: 'u_4',
    fullName: 'Dev Agency Global',
    email: 'dev@agency.io',
    role: 'ROLE_USER',
    creditBalance: 1250000,
    isActive: true,
    registeredDate: '2026-08-01',
    vccTopupTotal: 4000000,
  },
];

const UsersPage = () => {
  const [users, setUsers] = useState<UserManagementItem[]>(() => {
    const saved = localStorage.getItem('velox_managed_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

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

  const saveUsers = (updated: UserManagementItem[]) => {
    setUsers(updated);
    localStorage.setItem('velox_managed_users', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('ROLE_USER');
    setShowModal(true);
  };

  const handleOpenEdit = (u: UserManagementItem) => {
    setEditingUser(u);
    setFormName(u.fullName);
    setFormEmail(u.email);
    setFormRole(u.role);
    setShowModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUser) {
      const updated = users.map((u) =>
        u.id === editingUser.id
          ? { ...u, fullName: formName, email: formEmail, role: formRole }
          : u
      );
      saveUsers(updated);
    } else {
      const newUser: UserManagementItem = {
        id: `u_${Date.now()}`,
        fullName: formName,
        email: formEmail,
        role: formRole,
        creditBalance: 20000, // Free welcome credits
        isActive: true,
        registeredDate: new Date().toISOString().split('T')[0],
        vccTopupTotal: 0,
      };
      saveUsers([...users, newUser]);
    }
    setShowModal(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Xoá người dùng này khỏi hệ thống?')) {
      saveUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u));
    saveUsers(updated);
  };

  const handleOpenCreditModal = (u: UserManagementItem) => {
    setTargetUser(u);
    setCreditDelta(50000);
    setShowCreditModal(true);
  };

  const handleApplyCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    const updated = users.map((u) => {
      if (u.id === targetUser.id) {
        return {
          ...u,
          creditBalance: Math.max(0, u.creditBalance + Number(creditDelta)),
        };
      }
      return u;
    });
    saveUsers(updated);
    setShowCreditModal(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={styles.moduleContainer}>
      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFilter}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">Tất cả phân quyền</option>
            <option value="ROLE_SUPER_ADMIN">Super Admin</option>
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_OPERATOR">Operator</option>
            <option value="ROLE_USER">User Thường</option>
          </select>
        </div>

        <div className={styles.actionButtonGroup}>
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <HiOutlineUserPlus size={16} /> Thêm Người Dùng Mới
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3>Quản Lý Thành Viên & Cấp Phân Quyền</h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Theo dõi lịch sử mua hàng, nạp từ VCC và số dư credits
            </span>
          </div>
          <span className={styles.countBadge}>{filteredUsers.length} Người Dùng</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Họ Tên & Email</th>
              <th>Cấp Phân Quyền</th>
              <th>Số Dư Credit Hiện Tại</th>
              <th>Tổng Nạp Từ VCC / Thẻ</th>
              <th>Ngày Tham Gia</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ color: '#fafafa', display: 'block' }}>{user.fullName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor:
                        user.role === 'ROLE_SUPER_ADMIN'
                          ? 'rgba(139,92,246,0.12)'
                          : user.role === 'ROLE_ADMIN'
                          ? 'rgba(99,102,241,0.12)'
                          : user.role === 'ROLE_OPERATOR'
                          ? 'rgba(16,185,129,0.12)'
                          : '#27272a',
                      color:
                        user.role === 'ROLE_SUPER_ADMIN'
                          ? '#8b5cf6'
                          : user.role === 'ROLE_ADMIN'
                          ? '#6366f1'
                          : user.role === 'ROLE_OPERATOR'
                          ? '#10b981'
                          : '#a1a1aa',
                    }}
                  >
                    <HiOutlineShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {user.role}
                  </span>
                </td>
                <td>
                  <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>
                    {user.creditBalance.toLocaleString()} cr
                  </strong>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#6366f1' }}>
                    {user.vccTopupTotal.toLocaleString()} ₫
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#71717a' }}>{user.registeredDate}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(user.id)}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: 9999,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: user.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: user.isActive ? '#10b981' : '#f43f5e',
                    }}
                  >
                    {user.isActive ? 'Đang Hoạt Động' : 'Đã Khóa'}
                  </button>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => handleOpenCreditModal(user)}
                      title="Nạp / Trừ Credit thủ công"
                    >
                      <HiOutlineBanknotes size={17} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconActionBtn} ${styles.actionEdit}`}
                      onClick={() => handleOpenEdit(user)}
                      title="Chỉnh sửa thông tin"
                    >
                      <HiOutlinePencilSquare size={17} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconActionBtn} ${styles.actionDelete}`}
                      onClick={() => handleDeleteUser(user.id)}
                      title="Xoá người dùng"
                    >
                      <HiOutlineTrash size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Thêm / Sửa Người Dùng */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng Mới'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Họ và Tên</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Địa Chỉ Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Cấp Phân Quyền (Permission Role)</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserManagementItem['role'])}
                  >
                    <option value="ROLE_USER">ROLE_USER (Người dùng thông thường)</option>
                    <option value="ROLE_OPERATOR">ROLE_OPERATOR (Vận hành / Kiểm duyệt log)</option>
                    <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên)</option>
                    <option value="ROLE_SUPER_ADMIN">ROLE_SUPER_ADMIN (Toàn quyền)</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" type="submit">
                  Lưu Thông Tin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cộng / Trừ Credit Thủ Công */}
      {showCreditModal && targetUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Điều Chỉnh Số Dư Credit: {targetUser.fullName}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowCreditModal(false)}
              >
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleApplyCredit}>
              <div className={styles.modalBody}>
                <div style={{ backgroundColor: '#18181b', padding: '0.85rem', borderRadius: 6, fontSize: '0.85rem' }}>
                  Số dư hiện tại:{' '}
                  <strong style={{ color: '#10b981', fontSize: '1rem' }}>
                    {targetUser.creditBalance.toLocaleString()} Credits
                  </strong>
                </div>

                <div className={styles.formField}>
                  <label>Số Credits Cần Điều Chỉnh (+ hoặc -)</label>
                  <input
                    type="number"
                    value={creditDelta}
                    onChange={(e) => setCreditDelta(Number(e.target.value))}
                    required
                  />
                  <span className={styles.hint}>
                    Nhập số dương (VD: 50000) để cộng thêm, nhập số âm (VD: -20000) để thu hồi.
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowCreditModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit">
                  Cập Nhật Số Dư
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
