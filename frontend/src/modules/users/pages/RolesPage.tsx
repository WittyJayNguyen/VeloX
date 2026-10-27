import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface Role { id: string; name: string; code: string; permissions: string[]; user_count: number; }

const initialRoles: Role[] = [
  { id: 'r1', name: 'Super Admin', code: 'ROLE_SUPER_ADMIN', permissions: ['ALL'], user_count: 1 },
  { id: 'r2', name: 'Admin', code: 'ROLE_ADMIN', permissions: ['users.manage', 'billing.manage', 'pools.manage', 'models.manage', 'logs.view'], user_count: 2 },
  { id: 'r3', name: 'Operator', code: 'ROLE_OPERATOR', permissions: ['pools.view', 'models.view', 'logs.view'], user_count: 3 },
  { id: 'r4', name: 'User', code: 'ROLE_USER', permissions: ['api.access', 'billing.topup'], user_count: 12450 },
];

const allPermissions = ['ALL', 'users.manage', 'users.view', 'billing.manage', 'billing.topup', 'pools.manage', 'pools.view', 'models.manage', 'models.view', 'logs.view', 'logs.export', 'settings.manage', 'api.access'];

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>(() => { const s = localStorage.getItem('velox_roles'); return s ? JSON.parse(s) : initialRoles; });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [perms, setPerms] = useState<string[]>([]);

  const save = (d: Role[]) => { setRoles(d); localStorage.setItem('velox_roles', JSON.stringify(d)); };
  const openAdd = () => { setEditing(null); setName(''); setCode(''); setPerms([]); setShowModal(true); };
  const openEdit = (r: Role) => { setEditing(r); setName(r.name); setCode(r.code); setPerms(r.permissions); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) { save(roles.map((r) => r.id === editing.id ? { ...r, name, code, permissions: perms } : r)); }
    else { save([...roles, { id: `r_${Date.now()}`, name, code, permissions: perms, user_count: 0 }]); }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm('Xoá role này?')) save(roles.filter((r) => r.id !== id)); };
  const togglePerm = (p: string) => setPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  return (
    <div className={styles.moduleContainer}>
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}><div className={styles.searchInput}><HiOutlineMagnifyingGlass size={16} /><input type="text" placeholder="Tìm role..." /></div></div>
        <div className={styles.actionButtonGroup}><Button variant="primary" size="md" onClick={openAdd}><HiOutlinePlus size={16} /> Thêm Role</Button></div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}><h3>Phân Quyền & Vai Trò</h3><span className={styles.countBadge}>{roles.length} Roles</span></div>
        <table className={styles.velzonTable}>
          <thead><tr><th>Tên Role</th><th>Mã</th><th>Quyền</th><th>Người Dùng</th><th>Thao Tác</th></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: '#fafafa' }}>{r.name}</td>
                <td><code style={{ background: '#27272a', padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: '0.75rem', color: '#818cf8' }}>{r.code}</code></td>
                <td><div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{r.permissions.slice(0, 4).map((p, i) => (<span key={i} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.6rem', padding: '0.08rem 0.3rem', borderRadius: 4 }}>{p}</span>))}{r.permissions.length > 4 && <span style={{ fontSize: '0.6rem', color: '#71717a' }}>+{r.permissions.length - 4}</span>}</div></td>
                <td style={{ fontWeight: 600, color: '#a1a1aa' }}>{r.user_count.toLocaleString()}</td>
                <td><div className={styles.actionCell}>
                  <button type="button" className={`${styles.iconActionBtn} ${styles.actionEdit}`} onClick={() => openEdit(r)}><HiOutlinePencilSquare size={16} /></button>
                  {r.code !== 'ROLE_SUPER_ADMIN' && <button type="button" className={`${styles.iconActionBtn} ${styles.actionDelete}`} onClick={() => handleDelete(r.id)}><HiOutlineTrash size={16} /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (<div className={styles.modalOverlay}><div className={styles.modalCard}>
        <div className={styles.modalHeader}><h2>{editing ? 'Sửa Role' : 'Thêm Role Mới'}</h2><button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}><HiOutlineXMark /></button></div>
        <form onSubmit={handleSave}><div className={styles.modalBody}>
          <div className={styles.formField}><label>Tên Role</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className={styles.formField}><label>Mã Role</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ROLE_CUSTOM" required /></div>
          <div className={styles.formField}><label>Quyền Hạn</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{allPermissions.map((p) => (
              <button key={p} type="button" onClick={() => togglePerm(p)} style={{ padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', borderColor: perms.includes(p) ? '#6366f1' : '#27272a', backgroundColor: perms.includes(p) ? 'rgba(99,102,241,0.12)' : 'transparent', color: perms.includes(p) ? '#6366f1' : '#71717a' }}>{p}</button>
            ))}</div>
          </div>
        </div><div className={styles.modalFooter}><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" type="submit">Lưu</Button></div></form>
      </div></div>)}
    </div>
  );
};
export default RolesPage;
