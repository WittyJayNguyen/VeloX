import apiClient from '@modules/core/lib/apiClient';

export interface PermissionNode {
  id: string;
  name: string;
  description?: string;
  children?: PermissionNode[];
}

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
  tier?: string;
  creditBalance: number;
  isActive: boolean;
  registeredDate: string;
  lastLoginAt?: string;
  vccTopupTotal?: number;
}

export interface UserDetailDto extends UserDto {
  roles: string[];
  isVerified: boolean;
  lastLoginIp?: string;
  failedLoginAttempts?: number;
}

export interface UserAuditLogDto {
  id: string;
  action: string;
  actorEmail: string;
  details?: string;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface CreditAuditLogDto {
  id: string;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  actorEmail: string;
  createdAt: string;
}

export interface UsersResponse {
  items: UserDto[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    totalCredits: number;
  };
}

export interface SystemUserAuditItem {
  id: string;
  action: string;
  actorEmail: string;
  actorId?: string;
  targetUserId: string;
  targetEmail: string;
  targetName: string;
  details?: string;
  reason?: string;
  ipAddress: string;
  createdAt: string;
}

export interface SystemUserAuditResponse {
  items: SystemUserAuditItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    totalEvents: number;
    securityLockouts: number;
    passwordResets: number;
  };
}

export interface SystemCreditAuditItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  actorEmail: string;
  actorId?: string;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  ipAddress: string;
  createdAt: string;
}

export interface SystemCreditAuditResponse {
  items: SystemCreditAuditItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    totalAdjustments: number;
    totalCredited: number;
    totalDeducted: number;
  };
}

export const userManagementService = {
  // ── Roles & Permission Tree ──
  async getPermissionTree(): Promise<PermissionNode[]> {
    try {
      const res = await apiClient.get('/permissions/tree');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải cây phân quyền');
    }
  },

  async getRoles(): Promise<RoleDto[]> {
    try {
      const res = await apiClient.get('/roles');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải danh sách vai trò');
    }
  },

  async createRole(data: { id: string; name: string; description?: string; permissions: string[] }): Promise<void> {
    try {
      await apiClient.post('/roles', data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tạo vai trò mới');
    }
  },

  async updateRole(id: string, data: { name: string; description?: string; permissions: string[] }): Promise<void> {
    try {
      await apiClient.put(`/roles/${id}`, data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể cập nhật vai trò');
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể xóa vai trò này');
    }
  },

  // ── Users Management ──
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UsersResponse> {
    try {
      const res = await apiClient.get('/users', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 10,
          search: params?.search || undefined,
          role: params?.role || 'ALL',
          status: params?.status || 'ALL',
        },
      });

      const data = res.data?.data || res.data;
      if (data && Array.isArray(data.items)) {
        return data as UsersResponse;
      }

      // If array returned directly
      if (Array.isArray(data)) {
        return {
          items: data,
          pagination: { total: data.length, page: 1, pageSize: data.length, totalPages: 1 },
          stats: {
            totalUsers: data.length,
            activeUsers: data.filter((u: UserDto) => u.isActive).length,
            lockedUsers: data.filter((u: UserDto) => !u.isActive).length,
            totalCredits: data.reduce((acc: number, u: UserDto) => acc + (u.creditBalance || 0), 0),
          },
        };
      }

      throw new Error('Dữ liệu người dùng trả về không hợp lệ');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể kết nối đến máy chủ quản lý người dùng');
    }
  },

  async getUserDetail(id: string): Promise<UserDetailDto> {
    try {
      const res = await apiClient.get(`/users/${id}`);
      return (res.data?.data || res.data) as UserDetailDto;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể lấy thông tin chi tiết người dùng');
    }
  },

  async createUser(data: {
    email: string;
    full_name: string;
    role_id: string;
    credit_balance?: number;
    password?: string;
    tier?: string;
  }): Promise<{ id: string; email: string; generated_password?: string }> {
    try {
      const res = await apiClient.post('/users', data);
      return (res.data?.data || res.data) as { id: string; email: string; generated_password?: string };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tạo người dùng mới');
    }
  },

  async updateUser(id: string, data: {
    full_name: string;
    email: string;
    role_id: string;
    is_active: boolean;
    tier?: string;
  }): Promise<void> {
    try {
      await apiClient.put(`/users/${id}`, data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể cập nhật người dùng');
    }
  },

  async toggleUserStatus(id: string, isActive: boolean, reason: string): Promise<void> {
    try {
      await apiClient.patch(`/users/${id}/status`, { is_active: isActive, reason });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể thay đổi trạng thái tài khoản');
    }
  },

  async adjustCredit(id: string, delta: number, reason: string): Promise<{ credit_balance: number }> {
    try {
      const res = await apiClient.post(`/users/${id}/credits`, { delta, reason });
      return (res.data?.data || res.data) as { credit_balance: number };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể điều chỉnh credit');
    }
  },

  async resetPassword(id: string, newPassword?: string, autoGenerate?: boolean): Promise<{ temporary_password?: string }> {
    try {
      const res = await apiClient.post(`/users/${id}/reset-password`, {
        new_password: newPassword || undefined,
        auto_generate: autoGenerate || false,
      });
      return (res.data?.data || res.data) as { temporary_password?: string };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể đặt lại mật khẩu');
    }
  },

  async getUserAuditLogs(id: string): Promise<UserAuditLogDto[]> {
    try {
      const res = await apiClient.get(`/users/${id}/audit-logs`);
      return (res.data?.data || res.data) as UserAuditLogDto[];
    } catch {
      return [];
    }
  },

  async getUserCreditLogs(id: string): Promise<CreditAuditLogDto[]> {
    try {
      const res = await apiClient.get(`/users/${id}/credit-logs`);
      return (res.data?.data || res.data) as CreditAuditLogDto[];
    } catch {
      return [];
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể xóa người dùng');
    }
  },

  async getSystemUserAudits(params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    search?: string;
  }): Promise<SystemUserAuditResponse> {
    try {
      const res = await apiClient.get('/audit/users', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 20,
          action: params?.action || 'ALL',
          search: params?.search || undefined,
        },
      });
      return (res.data?.data || res.data) as SystemUserAuditResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải nhật ký kiểm toán IAM');
    }
  },

  async getSystemCreditAudits(params?: {
    page?: number;
    pageSize?: number;
    deltaType?: string;
    search?: string;
  }): Promise<SystemCreditAuditResponse> {
    try {
      const res = await apiClient.get('/audit/credits', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 20,
          delta_type: params?.deltaType || 'ALL',
          search: params?.search || undefined,
        },
      });
      return (res.data?.data || res.data) as SystemCreditAuditResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải sổ cái kiểm toán tín dụng');
    }
  },

  async getIpRules(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<IpRuleListResponse> {
    try {
      const res = await apiClient.get('/ip-rules', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 20,
          status: params?.status || 'ALL',
          search: params?.search || undefined,
        },
      });
      return (res.data?.data || res.data) as IpRuleListResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tải danh sách IP giám sát');
    }
  },

  async banIp(payload: {
    ip_address: string;
    reason: string;
    action_type?: string;
    banned_until?: string;
  }): Promise<void> {
    try {
      await apiClient.post('/ip-rules/ban', payload);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể thực hiện chặn IP');
    }
  },

  async unbanIp(ip_address: string): Promise<void> {
    try {
      await apiClient.post('/ip-rules/unban', { ip_address });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể gỡ chặn IP');
    }
  },

  async batchLockIp(payload: { ip_address: string; reason: string }): Promise<void> {
    try {
      await apiClient.post('/ip-rules/batch-lock', payload);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể khóa tài khoản thuộc IP này');
    }
  },

  async batchRevokeCreditsIp(payload: { ip_address: string; reason: string }): Promise<void> {
    try {
      await apiClient.post('/ip-rules/batch-revoke-credits', payload);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      throw new Error(axiosErr?.response?.data?.detail || 'Không thể tịch thu credit của IP này');
    }
  },
};

export interface IpLinkedAccount {
  email: string;
  isActive: boolean;
  creditBalance: number;
}

export interface IpRuleDto {
  id: string;
  ipAddress: string;
  status: 'BANNED' | 'SUSPICIOUS' | 'ALLOWED';
  reason: string;
  actionType: string;
  bannedBy: string;
  bannedUntil?: string | null;
  accountCount: number;
  totalCreditsHeld: number;
  lastActive?: string | null;
  linkedAccounts?: IpLinkedAccount[];
}

export interface IpRuleListResponse {
  items: IpRuleDto[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    totalTrackedIps: number;
    bannedIps: number;
    suspiciousIps: number;
    farmedCreditsAtRisk: number;
  };
}

export default userManagementService;

