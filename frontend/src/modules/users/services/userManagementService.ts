import apiClient from '@modules/core/lib/apiClient';

export interface PermissionNode {
  id: string;
  name: string;
  description?: string;
  children?: PermissionNode[];
}

export interface RoleDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  user_count: number;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  creditBalance: number;
  isActive: boolean;
  registeredDate: string;
  vccTopupTotal: number;
}

// Fallback Default Tree if backend is offline
export const FALLBACK_PERMISSION_TREE: PermissionNode[] = [
  {
    id: 'gateway',
    name: 'Gateway & Service Pools',
    description: 'Quản lý cụm điều phối, API Keys và Recaptcha',
    children: [
      {
        id: 'pools',
        name: 'Service Pools',
        children: [
          { id: 'pools.view', name: 'Xem danh sách Pools', description: 'Xem chi tiết các pool và trạng thái' },
          { id: 'pools.create', name: 'Tạo Pool mới', description: 'Thêm cụm pool chuẩn OpenAI/nhà cung cấp' },
          { id: 'pools.edit', name: 'Cập nhật Pool', description: 'Chỉnh sửa routing, rate limit, endpoint' },
          { id: 'pools.delete', name: 'Xóa Pool', description: 'Gỡ bỏ cụm pool khỏi hệ thống' },
        ],
      },
      {
        id: 'keys',
        name: 'API Keys & Session Tokens',
        children: [
          { id: 'keys.view', name: 'Xem danh sách Keys', description: 'Xem keys và quota sử dụng' },
          { id: 'keys.reveal', name: 'Xem giá trị Secret Key', description: 'Hiện toàn bộ sk-xxx / session token' },
          { id: 'keys.create', name: 'Thêm Key / Token', description: 'Thêm key mới kèm cookie và quota' },
          { id: 'keys.quota_edit', name: 'Cấu hình Hạn mức Quota', description: 'Chỉnh sửa daily/monthly quota và priority' },
          { id: 'keys.delete', name: 'Xóa Key / Token', description: 'Xóa key khỏi cụm điều phối' },
        ],
      },
      {
        id: 'recaptcha',
        name: 'Tự Giải Recaptcha',
        children: [
          { id: 'recaptcha.view', name: 'Xem cấu hình Solvers', description: 'Xem số dư và tốc độ giải' },
          { id: 'recaptcha.manage', name: 'Quản lý Solvers', description: 'Thêm/sửa/xóa tài khoản solver captcha' },
          { id: 'recaptcha.test', name: 'Thử giải Captcha', description: 'Gửi request giải thử nghiệm' },
        ],
      },
    ],
  },
  {
    id: 'models',
    name: 'Quản Lý Models AI',
    description: 'Quản lý danh mục mô hình, bảng giá credit và routing',
    children: [
      {
        id: 'models_catalog',
        name: 'Danh Mục Models',
        children: [
          { id: 'models.view', name: 'Xem danh mục Models', description: 'Xem chi tiết các model AI' },
          { id: 'models.create', name: 'Thêm Model mới', description: 'Đăng ký model code vào hệ thống' },
          { id: 'models.pricing', name: 'Cấu hình Giá Bán Credit', description: 'Thay đổi tỷ lệ quy đổi credit cho model' },
          { id: 'models.delete', name: 'Xóa Model', description: 'Gỡ bỏ model khỏi danh mục' },
        ],
      },
    ],
  },
  {
    id: 'packages',
    name: 'Dịch Vụ & Gói Credit',
    description: 'Quản lý các gói tín dụng bán cho người dùng',
    children: [
      {
        id: 'credit_packages',
        name: 'Gói Tín Dụng',
        children: [
          { id: 'packages.view', name: 'Xem danh sách Gói', description: 'Xem các gói credit đang bán' },
          { id: 'packages.create', name: 'Tạo Gói mới', description: 'Thêm gói credit, ưu đãi, bonus' },
          { id: 'packages.edit', name: 'Sửa Gói', description: 'Thay đổi giá, số credit và models cấp phép' },
          { id: 'packages.delete', name: 'Xóa Gói', description: 'Gỡ bỏ gói khỏi kệ bán' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Tài Chính & Thanh Toán',
    description: 'Quản lý ví, dòng tiền và tài khoản nhận thanh toán',
    children: [
      {
        id: 'wallet_billing',
        name: 'Ví & Thanh Toán',
        children: [
          { id: 'wallet.view', name: 'Xem Ví & Lịch sử nạp', description: 'Xem biến động dòng tiền và đơn nạp' },
          { id: 'wallet.topup_manual', name: 'Cộng Tiền / Nạp Thủ Công', description: 'Tạo lệnh nạp tiền thủ công cho khách' },
          { id: 'banking.manage', name: 'Quản lý Ngân Hàng & QR', description: 'Thêm/sửa tài khoản ngân hàng và mã VietQR' },
        ],
      },
    ],
  },
  {
    id: 'users_system',
    name: 'Quản Trị Người Dùng & Phân Quyền',
    description: 'Quản lý tài khoản thành viên, vai trò và cây phân quyền',
    children: [
      {
        id: 'members',
        name: 'Thành Viên & Vai Trò',
        children: [
          { id: 'users.view', name: 'Xem danh sách Người dùng', description: 'Xem thông tin thành viên' },
          { id: 'users.create', name: 'Tạo Người dùng mới', description: 'Thêm tài khoản vào hệ thống' },
          { id: 'users.edit', name: 'Sửa thông tin & Đổi Role', description: 'Chỉnh sửa họ tên, email, gán vai trò' },
          { id: 'users.adjust_credit', name: 'Điều chỉnh Số dư Credit', description: 'Cộng hoặc trừ credit trực tiếp' },
          { id: 'users.lock', name: 'Khóa / Mở khóa Tài khoản', description: 'Thay đổi trạng thái hoạt động' },
          { id: 'roles.manage', name: 'Quản lý Cây Phân Quyền', description: 'Thêm, sửa vai trò và phân bổ quyền' },
        ],
      },
    ],
  },
  {
    id: 'monitoring',
    name: 'Nhật Ký & Giám Sát SLA',
    description: 'Theo dõi lỗi sự cố và xuất báo cáo hệ thống',
    children: [
      {
        id: 'system_logs',
        name: 'Nhật Ký Hệ Thống',
        children: [
          { id: 'logs.view', name: 'Xem Nhật ký Sự cố SLA', description: 'Xem log lỗi gateway và uptime' },
          { id: 'logs.export', name: 'Xuất Báo Cáo', description: 'Tải dữ liệu log ra định dạng CSV/JSON' },
        ],
      },
    ],
  },
];

export const userManagementService = {
  // ── Permission Tree ──
  async getPermissionTree(): Promise<PermissionNode[]> {
    try {
      const res = await apiClient.get('/permissions/tree');
      if (res.data?.data) return res.data.data;
    } catch {
      // Backend offline fallback
    }
    return FALLBACK_PERMISSION_TREE;
  },

  // ── Roles ──
  async getRoles(): Promise<RoleDto[]> {
    try {
      const res = await apiClient.get('/roles');
      if (res.data?.data) {
        localStorage.setItem('velox_roles_cache', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // Backend offline fallback
    }
    const cached = localStorage.getItem('velox_roles_cache') || localStorage.getItem('velox_roles');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [
      { id: 'ROLE_SUPER_ADMIN', name: 'Super Admin', code: 'ROLE_SUPER_ADMIN', description: 'Toàn quyền quản trị hệ thống VeloX', permissions: ['ALL'], user_count: 1 },
      { id: 'ROLE_ADMIN', name: 'Admin Quản Trị', code: 'ROLE_ADMIN', description: 'Quản lý nghiệp vụ, gateway và người dùng', permissions: ['pools.view', 'pools.create', 'pools.edit', 'keys.view', 'keys.create', 'keys.quota_edit', 'recaptcha.view', 'recaptcha.manage', 'models.view', 'models.create', 'models.pricing', 'packages.view', 'packages.create', 'packages.edit', 'wallet.view', 'wallet.topup_manual', 'banking.manage', 'users.view', 'users.create', 'users.edit', 'users.adjust_credit', 'users.lock', 'logs.view'], user_count: 2 },
      { id: 'ROLE_OPERATOR', name: 'Operator Vận Hành', code: 'ROLE_OPERATOR', description: 'Giám sát pool, model và sự cố SLA', permissions: ['pools.view', 'keys.view', 'models.view', 'packages.view', 'wallet.view', 'logs.view'], user_count: 3 },
      { id: 'ROLE_USER', name: 'Khách Hàng / Developer', code: 'ROLE_USER', description: 'Truy cập API và nạp credit', permissions: ['pools.view', 'keys.view', 'packages.view', 'wallet.view'], user_count: 12450 },
    ];
  },

  async createRole(data: { id: string; name: string; description?: string; permissions: string[] }): Promise<void> {
    try {
      await apiClient.post('/roles', data);
    } catch (err: unknown) {
      // Local fallback
      const roles = await this.getRoles();
      const updated = [...roles, { ...data, code: data.id, user_count: 0 }];
      localStorage.setItem('velox_roles_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  async updateRole(id: string, data: { name: string; description?: string; permissions: string[] }): Promise<void> {
    try {
      await apiClient.put(`/roles/${id}`, data);
    } catch (err: unknown) {
      // Local fallback
      const roles = await this.getRoles();
      const updated = roles.map((r) => (r.id === id ? { ...r, ...data, permissions: data.permissions } : r));
      localStorage.setItem('velox_roles_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (err: unknown) {
      // Local fallback
      const roles = await this.getRoles();
      const updated = roles.filter((r) => r.id !== id);
      localStorage.setItem('velox_roles_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  // ── Users ──
  async getUsers(): Promise<UserDto[]> {
    try {
      const res = await apiClient.get('/users');
      if (res.data?.data) {
        localStorage.setItem('velox_users_cache', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // Backend offline fallback
    }
    const cached = localStorage.getItem('velox_users_cache') || localStorage.getItem('velox_managed_users');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return [
      { id: 'u_1', fullName: 'Admin VeloX (Quản Trị)', email: 'admin@velox.ai', role: 'ROLE_SUPER_ADMIN', creditBalance: 9999999, isActive: true, registeredDate: '2026-01-10', vccTopupTotal: 0 },
      { id: 'u_2', fullName: 'Hai Nguyen Studio', email: 'studio.vn@gmail.com', role: 'ROLE_USER', creditBalance: 450200, isActive: true, registeredDate: '2026-03-15', vccTopupTotal: 1500000 },
      { id: 'u_3', fullName: 'Le Quoc Operator', email: 'operator@velox.ai', role: 'ROLE_OPERATOR', creditBalance: 50000, isActive: true, registeredDate: '2026-05-20', vccTopupTotal: 0 },
      { id: 'u_4', fullName: 'Dev Agency Global', email: 'dev@agency.io', role: 'ROLE_USER', creditBalance: 1250000, isActive: true, registeredDate: '2026-08-01', vccTopupTotal: 4000000 },
    ];
  },

  async createUser(data: { email: string; full_name: string; role_id: string; credit_balance?: number; password?: string }): Promise<void> {
    try {
      await apiClient.post('/users', data);
    } catch (err: unknown) {
      // Local fallback
      const users = await this.getUsers();
      const newUser: UserDto = {
        id: `u_${Date.now()}`,
        fullName: data.full_name,
        email: data.email,
        role: data.role_id,
        creditBalance: data.credit_balance || 50000,
        isActive: true,
        registeredDate: new Date().toISOString().split('T')[0],
        vccTopupTotal: 0,
      };
      localStorage.setItem('velox_users_cache', JSON.stringify([...users, newUser]));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  async updateUser(id: string, data: { full_name: string; email: string; role_id: string; is_active: boolean }): Promise<void> {
    try {
      await apiClient.put(`/users/${id}`, data);
    } catch (err: unknown) {
      // Local fallback
      const users = await this.getUsers();
      const updated = users.map((u) => (u.id === id ? { ...u, fullName: data.full_name, email: data.email, role: data.role_id, isActive: data.is_active } : u));
      localStorage.setItem('velox_users_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (err: unknown) {
      // Local fallback
      const users = await this.getUsers();
      const updated = users.filter((u) => u.id !== id);
      localStorage.setItem('velox_users_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },

  async adjustCredit(id: string, delta: number): Promise<void> {
    try {
      await apiClient.post(`/users/${id}/credits`, { delta });
    } catch (err: unknown) {
      // Local fallback
      const users = await this.getUsers();
      const updated = users.map((u) => (u.id === id ? { ...u, creditBalance: Math.max(0, u.creditBalance + delta) } : u));
      localStorage.setItem('velox_users_cache', JSON.stringify(updated));
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      if (axiosErr?.response?.data?.detail) {
        throw new Error(axiosErr.response.data.detail);
      }
    }
  },
};
