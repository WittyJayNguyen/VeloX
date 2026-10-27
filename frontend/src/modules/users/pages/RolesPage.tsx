import { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineKey,
  HiOutlineUsers,
  HiOutlineServerStack,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';
import {
  userManagementService,
  type RoleDto,
  type PermissionNode,
  FALLBACK_PERMISSION_TREE,
} from '../services/userManagementService';
import treeStyles from '@assets/scss/admin/roles-tree.module.scss';

const RolesPage = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>(FALLBACK_PERMISSION_TREE);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  // Accordion Mode: Mở cái này thì đóng cái kia (mặc định mở module đầu tiên)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    gateway: true,
  });

  // Load Data from Backend
  const loadData = async () => {
    try {
      const [fetchedRoles, fetchedTree] = await Promise.all([
        userManagementService.getRoles(),
        userManagementService.getPermissionTree(),
      ]);
      setRoles(fetchedRoles);
      setPermissionTree(fetchedTree);
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Collect all leaf permission IDs from tree
  const allPermissionIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (nodes: PermissionNode[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        } else {
          ids.push(node.id);
        }
      }
    };
    traverse(permissionTree);
    return ids;
  }, [permissionTree]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setSelectedPermissions([]);
    setExpandedCategories({ [permissionTree[0]?.id || 'gateway']: true });
    setShowModal(true);
  };

  const handleOpenEdit = (r: RoleDto) => {
    setEditingRole(r);
    setFormName(r.name);
    setFormCode(r.code || r.id);
    setFormDescription(r.description || '');
    setSelectedPermissions(r.permissions.includes('ALL') ? allPermissionIds : r.permissions);
    setExpandedCategories({ [permissionTree[0]?.id || 'gateway']: true });
    setShowModal(true);
  };

  // Accordion mode: mở cái này thì đóng cái kia
  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => {
      if (prev[catId]) {
        // Nếu đang mở mà nhấn vào thì thu gọn lại
        return {};
      }
      // Mở mục vừa bấm, đóng tất cả các mục còn lại
      return { [catId]: true };
    });
  };

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {};
    permissionTree.forEach((n) => {
      map[n.id] = true;
    });
    setExpandedCategories(map);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  // Toggle single permission
  const handleTogglePerm = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Toggle all permissions under a specific module or sub-group
  const handleToggleGroup = (node: PermissionNode) => {
    const groupPermIds: string[] = [];
    const collectIds = (n: PermissionNode) => {
      if (n.children && n.children.length > 0) {
        n.children.forEach(collectIds);
      } else {
        groupPermIds.push(n.id);
      }
    };
    collectIds(node);

    const isAllChecked = groupPermIds.every((id) => selectedPermissions.includes(id));
    if (isAllChecked) {
      // Uncheck all in this group
      setSelectedPermissions((prev) => prev.filter((id) => !groupPermIds.includes(id)));
    } else {
      // Check all in this group
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupPermIds])));
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(allPermissionIds);
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  // Save Role
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || (!editingRole && !formCode.trim())) return;

    try {
      if (editingRole) {
        await userManagementService.updateRole(editingRole.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          permissions: selectedPermissions,
        });
      } else {
        const cleanCode = formCode.trim().toUpperCase().startsWith('ROLE_')
          ? formCode.trim().toUpperCase()
          : `ROLE_${formCode.trim().toUpperCase()}`;

        await userManagementService.createRole({
          id: cleanCode,
          name: formName.trim(),
          description: formDescription.trim(),
          permissions: selectedPermissions,
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu vai trò';
      alert(errorMsg);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (roleId === 'ROLE_SUPER_ADMIN') {
      alert('Không thể xóa vai trò Super Admin mặc định');
      return;
    }
    if (confirm('Bạn có chắc muốn xoá vai trò này?')) {
      try {
        await userManagementService.deleteRole(roleId);
        await loadData();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể xóa vai trò này';
        alert(errorMsg);
      }
    }
  };

  // Filter
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsersCount = roles.reduce((acc, r) => acc + (r.user_count || 0), 0);

  const columns: TableColumn<RoleDto>[] = [
    {
      key: 'name',
      header: 'Tên Vai Trò & Mã Hệ Thống',
      render: (r) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ color: '#fafafa' }}>{r.name}</strong>
            <Badge
              variant={
                r.code === 'ROLE_SUPER_ADMIN'
                  ? 'danger'
                  : r.code === 'ROLE_ADMIN'
                  ? 'primary'
                  : r.code === 'ROLE_OPERATOR'
                  ? 'success'
                  : 'neutral'
              }
              size="sm"
            >
              {r.code}
            </Badge>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2 }}>
            {r.description || 'Chưa có mô tả'}
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Quyền Hạn Được Cấp',
      render: (r) => {
        const isSuper = r.permissions.includes('ALL');
        if (isSuper) {
          return (
            <Badge variant="danger" size="md">
              <HiOutlineKey size={13} style={{ marginRight: 4 }} /> TOÀN BỘ QUYỀN (Full Access)
            </Badge>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant="purple" size="md">
              <HiOutlineShieldCheck size={13} style={{ marginRight: 4 }} /> {r.permissions.length} quyền
            </Badge>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 280 }}>
              {r.permissions.slice(0, 3).map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#818cf8',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {p}
                </span>
              ))}
              {r.permissions.length > 3 && (
                <span style={{ fontSize: '0.68rem', color: '#71717a' }}>
                  +{r.permissions.length - 3}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'user_count',
      header: 'Thành Viên',
      align: 'center',
      render: (r) => (
        <Badge variant="neutral" size="md">
          <HiOutlineUsers size={13} style={{ marginRight: 4 }} /> {(r.user_count || 0).toLocaleString()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            title="Sửa vai trò & Cấu hình Cây Phân Quyền"
            onClick={() => handleOpenEdit(r)}
          >
            <HiOutlinePencilSquare size={16} />
          </Button>
          {r.code !== 'ROLE_SUPER_ADMIN' && (
            <Button
              variant="ghost"
              size="sm"
              title="Xóa vai trò"
              onClick={() => handleDelete(r.id)}
            >
              <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title="Tổng Số Vai Trò" value={roles.length} icon={<HiOutlineShieldCheck size={22} />} change="Phân cấp RBAC chuẩn" changeType="up" />
        <StatCard title="Thành Viên Đã Phân Quyền" value={totalUsersCount.toLocaleString()} icon={<HiOutlineUsers size={22} />} change="Phủ sóng toàn hệ thống" changeType="up" />
        <StatCard title="Số Quyền Trong Cây" value={`${allPermissionIds.length} node`} icon={<HiOutlineKey size={22} />} change="Kiểm soát chi tiết" changeType="neutral" />
        <StatCard
          title="Kết Nối Backend API"
          value={isBackendConnected ? 'Backend Live' : 'Local Fallback'}
          icon={<HiOutlineServerStack size={22} />}
          change={isBackendConnected ? 'Đồng bộ FastAPI 8000' : 'Chế độ an toàn'}
          changeType={isBackendConnected ? 'up' : 'neutral'}
        />
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <SearchInput
            placeholder="Tìm theo tên vai trò, mã role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <HiOutlinePlus size={16} /> Thêm Vai Trò Mới
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card
        title="Danh Sách Vai Trò & Phân Quyền RBAC"
        subtitle={`Quản lý ${filteredRoles.length} vai trò với phân cấp quyền truy cập bảo mật`}
        headerRight={<HiOutlineShieldCheck size={20} style={{ color: '#6366f1' }} />}
        padding="none"
      >
        <Table columns={columns} data={filteredRoles} rowKey={(r) => r.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal Cây Phân Quyền */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? `Cấu Hình Cây Phân Quyền: ${editingRole.name}` : 'Tạo Vai Trò & Thiết Lập Cây Phân Quyền'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingRole ? 'Lưu Cấu Hình Quyền' : 'Tạo Vai Trò'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'fit-content' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Tên Vai Trò"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Quản Trị Viên Kỹ Thuật"
              required
              fullWidth
            />
            <Input
              label="Mã Vai Trò (System Role Code)"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="ROLE_TECH_ADMIN"
              disabled={!!editingRole}
              required
              fullWidth
            />
          </div>

          <Input
            label="Mô Tả Nhiệm Vụ Của Vai Trò"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Chịu trách nhiệm giám sát gateway, quản lý pool và điều tra sự cố SLA..."
            fullWidth
          />

          {/* CÂY PHÂN QUYỀN (Permission Tree) */}
          <div>
            <div className={treeStyles.treeToolbar}>
              <div className={treeStyles.counter}>
                Đã chọn <strong>{selectedPermissions.length}</strong> / {allPermissionIds.length} quyền hạn trong cây
              </div>
              <div className={treeStyles.quickActions}>
                <Button type="button" variant="ghost" size="sm" onClick={handleExpandAll}>
                  Mở Rộng Hết
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleCollapseAll}>
                  Thu Gọn Hết
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                  Chọn Tất Cả
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Bỏ Chọn Hết
                </Button>
              </div>
            </div>

            <div className={treeStyles.treeContainer}>
              {permissionTree.map((rootNode) => {
                const isExpanded = !!expandedCategories[rootNode.id];

                // Check group status
                const groupPerms: string[] = [];
                const collectPerms = (n: PermissionNode) => {
                  if (n.children && n.children.length > 0) {
                    n.children.forEach(collectPerms);
                  } else {
                    groupPerms.push(n.id);
                  }
                };
                collectPerms(rootNode);

                const checkedCount = groupPerms.filter((id) => selectedPermissions.includes(id)).length;
                const isGroupAllChecked = groupPerms.length > 0 && checkedCount === groupPerms.length;

                return (
                  <div
                    key={rootNode.id}
                    className={`${treeStyles.categoryGroup} ${isExpanded ? treeStyles.expanded : ''}`}
                  >
                    {/* Header Group */}
                    <div
                      className={treeStyles.categoryHeader}
                      onClick={() => toggleCategoryExpand(rootNode.id)}
                    >
                      <div className={treeStyles.categoryTitle}>
                        <span className={treeStyles.iconChevron}>
                          {isExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                        </span>
                        <h4>{rootNode.name}</h4>
                        {rootNode.description && (
                          <span className={treeStyles.categoryDesc}>• {rootNode.description}</span>
                        )}
                      </div>

                      <div
                        className={treeStyles.categoryCheck}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleGroup(rootNode);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isGroupAllChecked}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = checkedCount > 0 && checkedCount < groupPerms.length;
                            }
                          }}
                          onChange={() => handleToggleGroup(rootNode)}
                        />
                        <span>
                          {checkedCount}/{groupPerms.length}
                        </span>
                      </div>
                    </div>

                    {/* Subcategories & Granular Permissions */}
                    {isExpanded && (
                      <div>
                        {rootNode.children?.map((subNode) => (
                          <div key={subNode.id} className={treeStyles.subCategoryGroup}>
                            <div className={treeStyles.subCategoryTitle}>
                              <strong>{subNode.name}</strong>
                              <button
                                type="button"
                                onClick={() => handleToggleGroup(subNode)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#6366f1',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  padding: '0 4px',
                                }}
                              >
                                [Chọn tất cả]
                              </button>
                            </div>

                            <div className={treeStyles.permissionsList}>
                              {subNode.children?.map((perm) => {
                                const isChecked = selectedPermissions.includes(perm.id);
                                return (
                                  <label
                                    key={perm.id}
                                    className={`${treeStyles.permissionItem} ${isChecked ? treeStyles.checked : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePerm(perm.id)}
                                    />
                                    <div className={treeStyles.itemMeta}>
                                      <span className={treeStyles.itemTitle}>{perm.name}</span>
                                      <span className={treeStyles.itemCode}>{perm.id}</span>
                                      {perm.description && (
                                        <span className={treeStyles.itemDesc}>{perm.description}</span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPage;
