import { useState } from 'react';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import styles from '@assets/scss/admin/common-admin.module.scss';

interface WalletTx { id: string; type: 'TOPUP' | 'CONSUME' | 'REFUND'; amount: number; balance_after: number; description: string; date: string; }

const mockTx: WalletTx[] = [
  { id: 'wt1', type: 'TOPUP', amount: 500000, balance_after: 1500000, description: 'Nạp VietQR - TX-88219', date: '2026-10-26 21:40' },
  { id: 'wt2', type: 'CONSUME', amount: -12500, balance_after: 1487500, description: 'GPT-4o x50 req', date: '2026-10-26 21:35' },
  { id: 'wt3', type: 'CONSUME', amount: -48000, balance_after: 1439500, description: 'Midjourney x6 images', date: '2026-10-26 20:10' },
  { id: 'wt4', type: 'TOPUP', amount: 200000, balance_after: 1639500, description: 'Nạp MoMo - TX-88218', date: '2026-10-26 20:15' },
  { id: 'wt5', type: 'REFUND', amount: 50000, balance_after: 1689500, description: 'Hoàn tiền lỗi 503', date: '2026-10-26 18:00' },
];

const WalletPage = () => {
  const [transactions] = useState<WalletTx[]>(mockTx);
  const [search, setSearch] = useState('');
  const filtered = transactions.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));

  const totalIn = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const totalOut = Math.abs(transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0));

  return (
    <div className={styles.moduleContainer}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Số Dư Hiện Tại', value: '1,689,500 ₫', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Tổng Nạp Vào', value: `${totalIn.toLocaleString()} ₫`, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Tổng Chi Tiêu', value: `${totalOut.toLocaleString()} ₫`, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>₫</div>
            <div><div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div><div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa' }}>{s.value}</div></div>
          </div>
        ))}
      </div>

      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}><HiOutlineMagnifyingGlass size={16} /><input type="text" placeholder="Tìm giao dịch..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}><h3>Lịch Sử Dòng Tiền</h3><span className={styles.countBadge}>{filtered.length} giao dịch</span></div>
        <table className={styles.velzonTable}>
          <thead><tr><th>Loại</th><th>Số Tiền</th><th>Số Dư Sau</th><th>Mô Tả</th><th>Thời Gian</th></tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td><span style={{ padding: '0.15rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600, backgroundColor: t.type === 'TOPUP' ? 'rgba(16,185,129,0.12)' : t.type === 'REFUND' ? 'rgba(99,102,241,0.12)' : 'rgba(244,63,94,0.12)', color: t.type === 'TOPUP' ? '#10b981' : t.type === 'REFUND' ? '#6366f1' : '#f43f5e' }}>
                  {t.type === 'TOPUP' ? '↑ Nạp' : t.type === 'REFUND' ? '↩ Hoàn' : '↓ Chi'}
                </span></td>
                <td style={{ fontWeight: 700, color: t.amount > 0 ? '#10b981' : '#f43f5e' }}>
                  {t.amount > 0 ? <HiOutlineArrowTrendingUp size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> : <HiOutlineArrowTrendingDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                  {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} ₫
                </td>
                <td style={{ color: '#a1a1aa' }}>{t.balance_after.toLocaleString()} ₫</td>
                <td style={{ color: '#e4e4e7', fontSize: '0.82rem' }}>{t.description}</td>
                <td style={{ color: '#71717a', fontSize: '0.78rem' }}>{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default WalletPage;
