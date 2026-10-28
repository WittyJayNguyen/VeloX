import { useState, useEffect } from 'react';
import {
  HiOutlineBuildingLibrary,
  HiOutlineQrCode,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineEye,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import apiClient from '@modules/core/lib/apiClient';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  branch: string;
  is_default: boolean;
  qr_enabled: boolean;
  is_active: boolean;
}

const COMMON_BANKS = [
  { name: 'MBBank (Ngân hàng Quân Đội)', code: 'MB' },
  { name: 'Vietcombank (Ngoại Thương Việt Nam)', code: 'VCB' },
  { name: 'Techcombank (Kỹ Thương Việt Nam)', code: 'TCB' },
  { name: 'VietinBank (Công Thương Việt Nam)', code: 'CTG' },
  { name: 'BIDV (Đầu Tư và Phát Triển)', code: 'BIDV' },
  { name: 'ACB (Á Châu)', code: 'ACB' },
  { name: 'VPBank (Việt Nam Thịnh Vượng)', code: 'VPB' },
  { name: 'TPBank (Tiên Phong)', code: 'TPB' },
  { name: 'Sacombank (Sài Gòn Thương Tín)', code: 'STB' },
  { name: 'VIB (Quốc Tế)', code: 'VIB' },
  { name: 'OCB (Phương Đông)', code: 'OCB' },
  { name: 'MSB (Hàng Hải)', code: 'MSB' },
  { name: 'Agribank (Nông Nghiệp & PTNT)', code: 'VARB' },
];

const BankingPage = () => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Bank Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBankOption, setSelectedBankOption] = useState(COMMON_BANKS[0].code);
  const [formName, setFormName] = useState(COMMON_BANKS[0].name);
  const [formCode, setFormCode] = useState(COMMON_BANKS[0].code);
  const [formNumber, setFormNumber] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  // SePay Sync Modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [sepayToken, setSepayToken] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // QR Preview Modal state
  const [previewBank, setPreviewBank] = useState<BankAccount | null>(null);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/billing/banks');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setBanks(data);
        localStorage.setItem('velox_banks', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleBankPresetChange = (code: string) => {
    setSelectedBankOption(code);
    const found = COMMON_BANKS.find((b) => b.code === code);
    if (found) {
      setFormName(found.name);
      setFormCode(found.code);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumber.trim()) return;

    try {
      await apiClient.post('/billing/banks', {
        bank_name: formName.trim(),
        bank_code: formCode.trim().toUpperCase(),
        account_number: formNumber.trim(),
        account_holder: formHolder.trim().toUpperCase(),
        branch: formBranch.trim(),
        is_default: formIsDefault,
        qr_enabled: true,
        is_active: true,
      });
      setShowAddModal(false);
      setFormNumber('');
      setFormHolder('');
      setFormBranch('');
      fetchBanks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thêm tài khoản thất bại.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) return;
    try {
      await apiClient.delete(`/billing/banks/${id}`);
      fetchBanks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa thất bại.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.put(`/billing/banks/${id}`, { is_default: true });
      fetchBanks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đặt mặc định thất bại.');
    }
  };

  const handleToggleQR = async (b: BankAccount) => {
    try {
      await apiClient.put(`/billing/banks/${b.id}`, { qr_enabled: !b.qr_enabled });
      fetchBanks();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cập nhật trạng thái QR thất bại.');
    }
  };

  const handleSyncSepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sepayToken.trim()) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiClient.post('/billing/banks/sync-sepay', {
        sepay_token: sepayToken.trim(),
      });
      setSyncMessage(res.data?.message || 'Đồng bộ tài khoản thành công!');
      fetchBanks();
      setTimeout(() => {
        setShowSyncModal(false);
        setSyncMessage(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đồng bộ từ SePay thất bại. Vui lòng kiểm tra lại Token.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredBanks = banks.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.bank_name.toLowerCase().includes(q) ||
      b.account_number.toLowerCase().includes(q) ||
      b.account_holder.toLowerCase().includes(q) ||
      b.bank_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.moduleContainer}>
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên ngân hàng, số tài khoản, chủ tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.actionButtonGroup} style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSyncModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <HiOutlineArrowPath size={16} /> Đồng Bộ Từ SePay
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <HiOutlinePlus size={16} /> Thêm Tài Khoản
          </Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <h3>Tài Khoản Ngân Hàng & VietQR (SePay Hub)</h3>
          <span className={styles.countBadge}>{banks.length} Tài khoản</span>
        </div>
        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Ngân Hàng</th>
              <th>Mã VietQR</th>
              <th>Số Tài Khoản</th>
              <th>Chủ Tài Khoản</th>
              <th>Chi Nhánh</th>
              <th>Mặc Định</th>
              <th>VietQR</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && banks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#71717a' }}>
                  Đang tải danh sách tài khoản ngân hàng...
                </td>
              </tr>
            ) : filteredBanks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                  Chưa có tài khoản ngân hàng nào. Bạn có thể nhấn <strong>"Đồng Bộ Từ SePay"</strong> hoặc{' '}
                  <strong>"+ Thêm Tài Khoản"</strong> để bắt đầu.
                </td>
              </tr>
            ) : (
              filteredBanks.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#fafafa' }}>
                    <HiOutlineBuildingLibrary size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6366f1' }} />
                    {b.bank_name}
                  </td>
                  <td>
                    <span style={{ background: '#27272a', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                      {b.bank_code}
                    </span>
                  </td>
                  <td>
                    <code style={{ background: '#18181b', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.85rem', color: '#e4e4e7', border: '1px solid #27272a' }}>
                      {b.account_number}
                    </code>
                  </td>
                  <td style={{ color: '#fafafa', fontWeight: 500 }}>{b.account_holder}</td>
                  <td style={{ color: '#71717a', fontSize: '0.8rem' }}>{b.branch || '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleSetDefault(b.id)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: b.is_default ? 'rgba(16,185,129,0.15)' : 'rgba(113,113,122,0.12)',
                        color: b.is_default ? '#10b981' : '#71717a',
                      }}
                    >
                      {b.is_default ? '★ Mặc định' : 'Đặt mặc định'}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleQR(b)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: 9999,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: b.qr_enabled ? 'rgba(99,102,241,0.15)' : 'rgba(113,113,122,0.12)',
                        color: b.qr_enabled ? '#818cf8' : '#71717a',
                      }}
                    >
                      <HiOutlineQrCode size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {b.qr_enabled ? 'Bật QR' : 'Tắt'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className={styles.iconActionBtn}
                        onClick={() => setPreviewBank(b)}
                        title="Xem mã VietQR"
                        style={{ color: '#38bdf8' }}
                      >
                        <HiOutlineEye size={15} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.actionDelete}`}
                        onClick={() => handleDelete(b.id)}
                        title="Xóa tài khoản"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Thêm Tài Khoản Ngân Hàng */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h2>Thêm Tài Khoản Ngân Hàng</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Chọn Ngân Hàng Phổ Biến</label>
                  <select
                    value={selectedBankOption}
                    onChange={(e) => handleBankPresetChange(e.target.value)}
                    style={{
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#fafafa',
                      width: '100%',
                    }}
                  >
                    {COMMON_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Mã Ngân Hàng (VietQR Code)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: MB, VCB, TCB"
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label>Số Tài Khoản</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="Nhập chính xác số tài khoản ngân hàng"
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label>Tên Chủ Tài Khoản (In hoa không dấu)</label>
                  <input
                    type="text"
                    value={formHolder}
                    onChange={(e) => setFormHolder(e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label>Chi Nhánh (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    placeholder="VD: Hội Sở Chính, CN Hà Nội"
                  />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isDefaultCheckbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                  />
                  <label htmlFor="isDefaultCheckbox" style={{ color: '#fafafa', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Đặt làm tài khoản mặc định nhận chuyển khoản
                  </label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit">
                  Lưu Tài Khoản
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đồng Bộ Từ SePay */}
      {showSyncModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2>Đồng Bộ Tài Khoản Từ SePay</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowSyncModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSyncSepay}>
              <div className={styles.modalBody}>
                <p style={{ color: '#a1a1aa', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '16px' }}>
                  Hệ thống sẽ kết nối trực tiếp đến SePay API để tự động tải toàn bộ danh sách tài khoản ngân hàng đã liên kết trên SePay về VeloX.
                </p>
                <div className={styles.formField}>
                  <label>SePay User API Token</label>
                  <input
                    type="password"
                    value={sepayToken}
                    onChange={(e) => setSepayToken(e.target.value)}
                    placeholder="Dán mã API Token của SePay vào đây"
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: '6px', lineHeight: '1.4', display: 'block' }}>
                    * Cách lấy: Đăng nhập <strong>my.sepay.vn</strong> &rarr; Menu bên trái chọn <strong>Cấu hình Công ty</strong> &rarr; <strong>API Access</strong> &rarr; Nhấn <strong>+ Thêm API</strong> để tạo và sao chép mã Token.
                  </span>
                </div>

                {syncMessage && (
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid #10b981',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#10b981',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '12px',
                    }}
                  >
                    <HiOutlineCheckCircle size={18} />
                    {syncMessage}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowSyncModal(false)} disabled={syncing}>
                  Đóng
                </Button>
                <Button variant="primary" type="submit" disabled={syncing}>
                  {syncing ? 'Đang đồng bộ...' : 'Bắt Đầu Đồng Bộ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem Trước VietQR */}
      {previewBank && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className={styles.modalHeader}>
              <h2>Mã VietQR Thanh Toán</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setPreviewBank(null)}>
                <HiOutlineXMark />
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <img
                  src={`https://qr.sepay.vn/img?bank=${encodeURIComponent(previewBank.bank_code)}&acc=${encodeURIComponent(previewBank.account_number)}&template=compact&amount=100000&des=VELOX%20TEST`}
                  alt="VietQR Preview"
                  style={{ width: '220px', height: 'auto', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/${previewBank.bank_code}-${previewBank.account_number}-compact2.png?amount=100000&addInfo=VELOX%20TEST&accountName=${encodeURIComponent(previewBank.account_holder)}`;
                  }}
                />
              </div>
              <div style={{ marginTop: '16px', textAlign: 'left', background: '#18181b', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <p style={{ margin: '4px 0', color: '#a1a1aa' }}>
                  Ngân hàng: <strong style={{ color: '#fafafa' }}>{previewBank.bank_name}</strong>
                </p>
                <p style={{ margin: '4px 0', color: '#a1a1aa' }}>
                  Số tài khoản: <strong style={{ color: '#38bdf8' }}>{previewBank.account_number}</strong>
                </p>
                <p style={{ margin: '4px 0', color: '#a1a1aa' }}>
                  Chủ tài khoản: <strong style={{ color: '#fafafa' }}>{previewBank.account_holder}</strong>
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={() => setPreviewBank(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingPage;
