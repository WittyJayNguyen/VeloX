import { useState } from 'react';
import { HiOutlineBuildingLibrary, HiOutlineQrCode, HiOutlinePlus, HiOutlineXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
  is_default: boolean;
  qr_enabled: boolean;
}

const initialBanks: BankAccount[] = [
  { id: 'b1', bank_name: 'Vietcombank', account_number: '0071000****89', account_holder: 'NGUYEN LE HAI', branch: 'CN TP.HCM', is_default: true, qr_enabled: true },
  { id: 'b2', bank_name: 'MB Bank', account_number: '0388****1234', account_holder: 'NGUYEN LE HAI', branch: 'PGD Tan Binh', is_default: false, qr_enabled: true },
  { id: 'b3', bank_name: 'Techcombank', account_number: '1902****5678', account_holder: 'VELOX TECH JSC', branch: 'CN Ha Noi', is_default: false, qr_enabled: false },
];

const BankingPage = () => {
  const [banks, setBanks] = useState<BankAccount[]>(() => {
    const s = localStorage.getItem('velox_banks');
    return s ? JSON.parse(s) : initialBanks;
  });
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [formBranch, setFormBranch] = useState('');

  const save = (data: BankAccount[]) => { setBanks(data); localStorage.setItem('velox_banks', JSON.stringify(data)); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNumber.trim()) return;
    save([...banks, { id: `b_${Date.now()}`, bank_name: formName, account_number: formNumber, account_holder: formHolder, branch: formBranch, is_default: false, qr_enabled: false }]);
    setShowModal(false);
    setFormName(''); setFormNumber(''); setFormHolder(''); setFormBranch('');
  };

  const handleDelete = (id: string) => { if (confirm('Xoá tài khoản này?')) save(banks.filter((b) => b.id !== id)); };
  const handleSetDefault = (id: string) => save(banks.map((b) => ({ ...b, is_default: b.id === id })));
  const handleToggleQR = (id: string) => save(banks.map((b) => b.id === id ? { ...b, qr_enabled: !b.qr_enabled } : b));

  return (
    <div className={styles.moduleContainer}>
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input type="text" placeholder="Tìm tài khoản..." />
          </div>
        </div>
        <div className={styles.actionButtonGroup}>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <HiOutlinePlus size={16} /> Thêm Tài Khoản
          </Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <h3>Tài Khoản Ngân Hàng & QR</h3>
          <span className={styles.countBadge}>{banks.length} Tài khoản</span>
        </div>
        <table className={styles.velzonTable}>
          <thead><tr><th>Ngân Hàng</th><th>Số Tài Khoản</th><th>Chủ Tài Khoản</th><th>Chi Nhánh</th><th>Mặc Định</th><th>QR</th><th>Thao Tác</th></tr></thead>
          <tbody>
            {banks.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600, color: '#fafafa' }}><HiOutlineBuildingLibrary size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{b.bank_name}</td>
                <td><code style={{ background: '#27272a', padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: '0.78rem', color: '#a1a1aa' }}>{b.account_number}</code></td>
                <td style={{ color: '#a1a1aa' }}>{b.account_holder}</td>
                <td style={{ color: '#71717a', fontSize: '0.8rem' }}>{b.branch}</td>
                <td>
                  <button type="button" onClick={() => handleSetDefault(b.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: b.is_default ? 'rgba(16,185,129,0.12)' : 'rgba(113,113,122,0.12)', color: b.is_default ? '#10b981' : '#71717a' }}>
                    {b.is_default ? '★ Mặc định' : 'Đặt mặc định'}
                  </button>
                </td>
                <td>
                  <button type="button" onClick={() => handleToggleQR(b.id)} style={{ padding: '0.2rem 0.5rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: b.qr_enabled ? 'rgba(99,102,241,0.12)' : 'rgba(113,113,122,0.12)', color: b.qr_enabled ? '#6366f1' : '#71717a' }}>
                    <HiOutlineQrCode size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />{b.qr_enabled ? 'Bật' : 'Tắt'}
                  </button>
                </td>
                <td>
                  <button type="button" className={`${styles.iconActionBtn} ${styles.actionDelete}`} onClick={() => handleDelete(b.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}><div className={styles.modalCard}>
          <div className={styles.modalHeader}><h2>Thêm Tài Khoản Ngân Hàng</h2><button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}><HiOutlineXMark /></button></div>
          <form onSubmit={handleAdd}><div className={styles.modalBody}>
            <div className={styles.formField}><label>Tên Ngân Hàng</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Vietcombank" required /></div>
            <div className={styles.formField}><label>Số Tài Khoản</label><input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} placeholder="Nhập số tài khoản" required /></div>
            <div className={styles.formField}><label>Tên Chủ Tài Khoản</label><input type="text" value={formHolder} onChange={(e) => setFormHolder(e.target.value)} placeholder="NGUYEN VAN A" /></div>
            <div className={styles.formField}><label>Chi Nhánh</label><input type="text" value={formBranch} onChange={(e) => setFormBranch(e.target.value)} placeholder="CN TP.HCM" /></div>
          </div><div className={styles.modalFooter}><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" type="submit">Thêm</Button></div></form>
        </div></div>
      )}
    </div>
  );
};
export default BankingPage;
