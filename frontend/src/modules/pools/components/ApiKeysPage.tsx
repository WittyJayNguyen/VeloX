import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineKey,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';
import { getPoolsFromStorage, savePoolsToStorage } from './ServicePoolPage';
import type { PoolItem, PoolKeyItem } from './ServicePoolPage';

const ApiKeysPage = () => {
  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState('ALL');

  // Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyVal, setNewKeyVal] = useState('');
  const [newRecapToken, setNewRecapToken] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  const savePools = (updated: PoolItem[]) => {
    setPools(updated);
    savePoolsToStorage(updated);
  };

  const handleOpenAddKey = (poolId?: string) => {
    setSelectedPoolId(poolId || (pools.length > 0 ? pools[0].id : null));
    setNewKeyName('');
    setNewKeyVal('');
    setNewRecapToken('');
    setShowKeyModal(true);
  };

  const handleAutoDetectModels = () => {
    setAutoDetecting(true);
    setTimeout(() => {
      setAutoDetecting(false);
      alert('Đã tự động nhận diện models: GPT-4o, GPT-4o-mini, DALL-E-3');
    }, 800);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId || !newKeyVal.trim()) return;

    const newKey: PoolKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName || `Key #${Date.now().toString(36)}`,
      keyVal: newKeyVal,
      recapToken: newRecapToken || undefined,
      isActive: true,
      requestsCount: 0,
      detectedModels: ['gpt-4o', 'claude-3.5', 'auto-detected'],
    };

    const updated = pools.map((p) =>
      p.id === selectedPoolId ? { ...p, keys: [...p.keys, newKey] } : p
    );
    savePools(updated);
    setShowKeyModal(false);
  };

  const handleDeleteKey = (poolId: string, keyId: string) => {
    const updated = pools.map((p) =>
      p.id === poolId ? { ...p, keys: p.keys.filter((k) => k.id !== keyId) } : p
    );
    savePools(updated);
  };

  const handleToggleKey = (poolId: string, keyId: string) => {
    const updated = pools.map((p) =>
      p.id === poolId
        ? { ...p, keys: p.keys.map((k) => (k.id === keyId ? { ...k, isActive: !k.isActive } : k)) }
        : p
    );
    savePools(updated);
  };

  // Flatten all keys with pool info
  const allKeys = pools.flatMap((p) => p.keys.map((k) => ({ ...k, poolName: p.name, poolId: p.id, poolProvider: p.provider, poolAuthType: p.authType })));
  const filteredKeys = allKeys.filter((k) => {
    const matchSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) || k.keyVal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPool = filterPool === 'ALL' || k.poolId === filterPool;
    return matchSearch && matchPool;
  });

  const totalReqs = allKeys.reduce((acc, k) => acc + k.requestsCount, 0);
  const activeKeys = allKeys.filter((k) => k.isActive).length;

  return (
    <div className={styles.moduleContainer}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Tổng API Keys', value: allKeys.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Đang Active', value: activeKeys, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Tổng Requests', value: totalReqs.toLocaleString(), color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
          { label: 'Số Pool', value: pools.length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#18181b', border: '1px solid #27272a', borderRadius: 12,
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              <HiOutlineKey />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fafafa' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input type="text" placeholder="Tìm key, token..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className={styles.selectFilter} value={filterPool} onChange={(e) => setFilterPool(e.target.value)}>
            <option value="ALL">Tất cả Pools</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.actionButtonGroup}>
          <Button variant="primary" size="md" onClick={() => handleOpenAddKey()}>
            <HiOutlinePlus size={16} /> Thêm Key / Token
          </Button>
        </div>
      </div>

      {/* Keys Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <h3>Quản Lý API Keys & Account Tokens</h3>
          <span className={styles.countBadge}>{filteredKeys.length} Keys</span>
        </div>
        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Tên Key</th>
              <th>Pool</th>
              <th>Giá Trị</th>
              <th>Recap Token</th>
              <th>Models</th>
              <th>Requests</th>
              <th>Status</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🔑</span>
                    <span className={styles.emptyText}>Chưa có API Key / Token nào. Hãy thêm key mới.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredKeys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600, color: '#fafafa' }}>{k.name}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: 6, backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {k.poolProvider}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: 2 }}>{k.poolName}</div>
                  </td>
                  <td>
                    <code style={{ background: '#27272a', padding: '0.2rem 0.45rem', borderRadius: 6, fontSize: '0.75rem', color: '#a1a1aa' }}>
                      {k.keyVal}
                    </code>
                  </td>
                  <td>
                    {k.recapToken ? (
                      <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <HiOutlineShieldCheck size={14} /> Đã nạp
                      </span>
                    ) : (
                      <span style={{ color: '#71717a', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                      {k.detectedModels.map((m, idx) => (
                        <span key={idx} style={{
                          backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8',
                          fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: 5,
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fafafa' }}>{k.requestsCount.toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={() => handleToggleKey(k.poolId, k.id)} style={{
                      padding: '0.2rem 0.5rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                      backgroundColor: k.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: k.isActive ? '#10b981' : '#f43f5e',
                    }}>
                      {k.isActive ? '● Active' : '○ Disabled'}
                    </button>
                  </td>
                  <td>
                    <button type="button" className={`${styles.iconActionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteKey(k.poolId, k.id)} title="Xoá">
                      <HiOutlineTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Key */}
      {showKeyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Thêm API Key / Account Token</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowKeyModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSaveKey}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Chọn Pool</label>
                  <select value={selectedPoolId || ''} onChange={(e) => setSelectedPoolId(e.target.value)}>
                    {pools.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.provider})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Tên Gợi Nhớ</label>
                  <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="VD: OpenAI Key Dự Phòng #3" />
                </div>
                <div className={styles.formField}>
                  <label>Giá Trị API Key / Token</label>
                  <textarea rows={3} value={newKeyVal} onChange={(e) => setNewKeyVal(e.target.value)} placeholder="Dán API Key hoặc session token..." required />
                </div>
                <div className={styles.formField}>
                  <label>Mã Recap Token (cho Account Token)</label>
                  <input type="text" value={newRecapToken} onChange={(e) => setNewRecapToken(e.target.value)} placeholder="cf_turnstile / recaptcha token..." />
                  <span className={styles.hint}>Cần để bypass captcha lấy danh sách model tự động.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" type="button" onClick={handleAutoDetectModels} loading={autoDetecting}>
                    <HiOutlineSparkles size={16} /> Auto Nhận Diện Model
                  </Button>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowKeyModal(false)}>Hủy</Button>
                <Button variant="primary" type="submit">Thêm Key</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
