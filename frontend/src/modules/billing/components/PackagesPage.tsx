import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface ServicePkg { id: string; name: string; models_included: string[]; credit_limit: number; price_vnd: number; is_active: boolean; }

const initialPkgs: ServicePkg[] = [
  { id: 'sp1', name: 'Starter Package', models_included: ['gpt-4o-mini', 'dall-e-3'], credit_limit: 50000, price_vnd: 50000, is_active: true },
  { id: 'sp2', name: 'Pro Package', models_included: ['gpt-4o', 'claude-3.5', 'midjourney-v6'], credit_limit: 250000, price_vnd: 200000, is_active: true },
  { id: 'sp3', name: 'Enterprise Suite', models_included: ['gpt-4o', 'claude-3.5', 'midjourney-v6', 'gen-3-alpha', 'deepseek-chat'], credit_limit: 3000000, price_vnd: 2000000, is_active: true },
];

const PackagesPage = () => {
  const [pkgs, setPkgs] = useState<ServicePkg[]>(() => { const s = localStorage.getItem('velox_svc_pkgs'); return s ? JSON.parse(s) : initialPkgs; });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServicePkg | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(100000);
  const [limit, setLimit] = useState(100000);
  const [models, setModels] = useState('');

  const save = (d: ServicePkg[]) => { setPkgs(d); localStorage.setItem('velox_svc_pkgs', JSON.stringify(d)); };

  const openAdd = () => { setEditing(null); setName(''); setPrice(100000); setLimit(100000); setModels(''); setShowModal(true); };
  const openEdit = (p: ServicePkg) => { setEditing(p); setName(p.name); setPrice(p.price_vnd); setLimit(p.credit_limit); setModels(p.models_included.join(', ')); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const mList = models.split(',').map((m) => m.trim()).filter(Boolean);
    if (editing) {
      save(pkgs.map((p) => p.id === editing.id ? { ...p, name, price_vnd: price, credit_limit: limit, models_included: mList } : p));
    } else {
      save([...pkgs, { id: `sp_${Date.now()}`, name, models_included: mList, credit_limit: limit, price_vnd: price, is_active: true }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm('Xoá gói này?')) save(pkgs.filter((p) => p.id !== id)); };
  const handleToggle = (id: string) => save(pkgs.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p));

  return (
    <div className={styles.moduleContainer}>
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}><div className={styles.searchInput}><HiOutlineMagnifyingGlass size={16} /><input type="text" placeholder="Tìm gói dịch vụ..." /></div></div>
        <div className={styles.actionButtonGroup}><Button variant="primary" size="md" onClick={openAdd}><HiOutlinePlus size={16} /> Thêm Gói</Button></div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}><h3>Cấu Hình Dịch Vụ & Gói</h3><span className={styles.countBadge}>{pkgs.length} Gói</span></div>
        <table className={styles.velzonTable}>
          <thead><tr><th>Tên Gói</th><th>Models</th><th>Credit Limit</th><th>Giá (VNĐ)</th><th>Status</th><th>Thao Tác</th></tr></thead>
          <tbody>
            {pkgs.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: '#fafafa' }}>{p.name}</td>
                <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{p.models_included.map((m, i) => (<span key={i} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: 5 }}>{m}</span>))}</div></td>
                <td style={{ color: '#a1a1aa' }}>{p.credit_limit.toLocaleString()}</td>
                <td style={{ fontWeight: 600, color: '#10b981' }}>{p.price_vnd.toLocaleString()} ₫</td>
                <td><button type="button" onClick={() => handleToggle(p.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: p.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', color: p.is_active ? '#10b981' : '#f43f5e' }}>{p.is_active ? '● Active' : '○ Off'}</button></td>
                <td><div className={styles.actionCell}>
                  <button type="button" className={`${styles.iconActionBtn} ${styles.actionEdit}`} onClick={() => openEdit(p)}><HiOutlinePencilSquare size={16} /></button>
                  <button type="button" className={`${styles.iconActionBtn} ${styles.actionDelete}`} onClick={() => handleDelete(p.id)}><HiOutlineTrash size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (<div className={styles.modalOverlay}><div className={styles.modalCard}>
        <div className={styles.modalHeader}><h2>{editing ? 'Sửa Gói' : 'Thêm Gói Dịch Vụ'}</h2><button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}><HiOutlineXMark /></button></div>
        <form onSubmit={handleSave}><div className={styles.modalBody}>
          <div className={styles.formField}><label>Tên Gói</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className={styles.formField}><label>Giá (VNĐ)</label><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
          <div className={styles.formField}><label>Credit Limit</label><input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></div>
          <div className={styles.formField}><label>Models (phân cách bởi dấu phẩy)</label><input type="text" value={models} onChange={(e) => setModels(e.target.value)} placeholder="gpt-4o, claude-3.5" /></div>
        </div><div className={styles.modalFooter}><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" type="submit">Lưu</Button></div></form>
      </div></div>)}
    </div>
  );
};
export default PackagesPage;
