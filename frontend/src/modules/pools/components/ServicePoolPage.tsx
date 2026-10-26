import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineSignal,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

export interface PoolKeyItem {
  id: string;
  name: string;
  keyVal: string;
  recapToken?: string;
  isActive: boolean;
  requestsCount: number;
  detectedModels: string[];
}

export interface PoolItem {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Midjourney' | 'Runway' | 'DeepSeek' | 'Google';
  authType: 'API_KEY' | 'TOKEN_ACCOUNT';
  routingStrategy: 'ROUND_ROBIN' | 'LEAST_USED' | 'WEIGHTED';
  keys: PoolKeyItem[];
  isActive: boolean;
  rateLimitPerMin: number;
}

const initialPools: PoolItem[] = [
  {
    id: 'pool_openai_01',
    name: 'OpenAI Enterprise Key Pool',
    provider: 'OpenAI',
    authType: 'API_KEY',
    routingStrategy: 'ROUND_ROBIN',
    isActive: true,
    rateLimitPerMin: 1000,
    keys: [
      {
        id: 'k_oai_1',
        name: 'OpenAI Pro Key #1',
        keyVal: 'sk-proj-9818...abc4',
        isActive: true,
        requestsCount: 14205,
        detectedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
      },
      {
        id: 'k_oai_2',
        name: 'OpenAI Team Key #2',
        keyVal: 'sk-proj-7712...xy89',
        isActive: true,
        requestsCount: 9840,
        detectedModels: ['gpt-4o', 'gpt-4o-mini'],
      },
    ],
  },
  {
    id: 'pool_anthropic_01',
    name: 'Anthropic Claude Sonnet Pool',
    provider: 'Anthropic',
    authType: 'API_KEY',
    routingStrategy: 'LEAST_USED',
    isActive: true,
    rateLimitPerMin: 800,
    keys: [
      {
        id: 'k_ant_1',
        name: 'Claude Key #1',
        keyVal: 'sk-ant-api03...x2f',
        isActive: true,
        requestsCount: 8750,
        detectedModels: ['claude-3-5-sonnet', 'claude-3-haiku'],
      },
    ],
  },
  {
    id: 'pool_midjourney_01',
    name: 'Midjourney Account Token Pool',
    provider: 'Midjourney',
    authType: 'TOKEN_ACCOUNT',
    routingStrategy: 'LEAST_USED',
    isActive: true,
    rateLimitPerMin: 300,
    keys: [
      {
        id: 'k_mj_1',
        name: 'Discord Acc Token 1',
        keyVal: 'MTA2...k9x1',
        recapToken: 'recap_cf_turnstile_bypass_token_99182',
        isActive: true,
        requestsCount: 4210,
        detectedModels: ['midjourney-v6', 'midjourney-niji'],
      },
    ],
  },
  {
    id: 'pool_runway_01',
    name: 'Runway Video Account Pool',
    provider: 'Runway',
    authType: 'TOKEN_ACCOUNT',
    routingStrategy: 'LEAST_USED',
    isActive: true,
    rateLimitPerMin: 150,
    keys: [
      {
        id: 'k_run_1',
        name: 'Runway Team Token 1',
        keyVal: 'rw_token_771...3x',
        recapToken: 'recaptcha_v3_session_token_3311',
        isActive: true,
        requestsCount: 1890,
        detectedModels: ['gen-3-alpha', 'gen-3-turbo'],
      },
    ],
  },
  {
    id: 'pool_luma_01',
    name: 'Luma Dream Machine Pool (Hết Key!)',
    provider: 'Runway',
    authType: 'TOKEN_ACCOUNT',
    routingStrategy: 'ROUND_ROBIN',
    isActive: false,
    rateLimitPerMin: 50,
    keys: [],
  },
];

// Export helper so KeysPage can share the same data
export const getPoolsFromStorage = (): PoolItem[] => {
  const saved = localStorage.getItem('velox_pools');
  return saved ? JSON.parse(saved) : initialPools;
};

export const savePoolsToStorage = (pools: PoolItem[]) => {
  localStorage.setItem('velox_pools', JSON.stringify(pools));
};

const ServicePoolPage = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('ALL');

  // Pool Modal
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<PoolItem['provider']>('OpenAI');
  const [formAuthType, setFormAuthType] = useState<PoolItem['authType']>('API_KEY');
  const [formRouting, setFormRouting] = useState<PoolItem['routingStrategy']>('ROUND_ROBIN');
  const [formRateLimit, setFormRateLimit] = useState(500);

  const savePools = (updated: PoolItem[]) => {
    setPools(updated);
    savePoolsToStorage(updated);
  };

  const handleOpenAddPool = () => {
    setEditingPool(null);
    setFormName('');
    setFormProvider('OpenAI');
    setFormAuthType('API_KEY');
    setFormRouting('ROUND_ROBIN');
    setFormRateLimit(500);
    setShowPoolModal(true);
  };

  const handleOpenEditPool = (p: PoolItem) => {
    setEditingPool(p);
    setFormName(p.name);
    setFormProvider(p.provider);
    setFormAuthType(p.authType);
    setFormRouting(p.routingStrategy);
    setFormRateLimit(p.rateLimitPerMin);
    setShowPoolModal(true);
  };

  const handleSavePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPool) {
      const updated = pools.map((p) =>
        p.id === editingPool.id
          ? { ...p, name: formName, provider: formProvider, authType: formAuthType, routingStrategy: formRouting, rateLimitPerMin: formRateLimit }
          : p
      );
      savePools(updated);
    } else {
      const newPool: PoolItem = {
        id: `pool_${Date.now()}`,
        name: formName,
        provider: formProvider,
        authType: formAuthType,
        routingStrategy: formRouting,
        isActive: true,
        rateLimitPerMin: formRateLimit,
        keys: [],
      };
      savePools([...pools, newPool]);
    }
    setShowPoolModal(false);
  };

  const handleDeletePool = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá Pool này?')) {
      savePools(pools.filter((p) => p.id !== id));
    }
  };

  const handleTogglePool = (id: string) => {
    savePools(pools.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const filtered = pools.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'ALL' || p.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  const totalKeys = pools.reduce((acc, p) => acc + p.keys.length, 0);
  const activePools = pools.filter((p) => p.isActive).length;
  const depletedPools = pools.filter((p) => p.keys.length === 0).length;

  return (
    <div className={styles.moduleContainer}>
      {/* Alert */}
      {depletedPools > 0 && (
        <div className={`${styles.alertBanner} ${styles.danger}`}>
          <HiOutlineExclamationTriangle size={20} />
          <span>
            <strong>CẢNH BÁO:</strong> Có {depletedPools} Pool đang cạn/hết API Key! Hãy bổ sung key ngay.
          </span>
        </div>
      )}

      {/* KPI Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Tổng Pool', value: pools.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Đang Hoạt Động', value: activePools, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Tổng API Keys', value: totalKeys, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
          { label: 'Pool Hết Key', value: depletedPools, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#18181b', border: '1px solid #27272a', borderRadius: 12,
            padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              <HiOutlineSignal />
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
            <input
              type="text"
              placeholder="Tìm kiếm pool..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className={styles.selectFilter} value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
            <option value="ALL">Tất cả NCC</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Midjourney">Midjourney</option>
            <option value="Runway">Runway</option>
            <option value="DeepSeek">DeepSeek</option>
            <option value="Google">Google</option>
          </select>
        </div>
        <div className={styles.actionButtonGroup}>
          <Button variant="outline" size="md" onClick={() => navigate('/admin/keys')}>
            <HiOutlineKey size={16} /> Quản Lý Keys
          </Button>
          <Button variant="primary" size="md" onClick={handleOpenAddPool}>
            <HiOutlinePlus size={16} /> Thêm Pool
          </Button>
        </div>
      </div>

      {/* Pools Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <h3>Danh Sách Service Pool</h3>
          <span className={styles.countBadge}>{filtered.length} Pools</span>
        </div>
        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Tên Pool</th>
              <th>Nhà Cung Cấp</th>
              <th>Loại Xác Thực</th>
              <th>Điều Phối</th>
              <th>Rate Limit</th>
              <th>Keys</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pool) => {
              const isDepleted = pool.keys.length === 0;
              return (
                <tr key={pool.id}>
                  <td>
                    <div>
                      <strong style={{ color: '#fafafa', display: 'block' }}>{pool.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{pool.id}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.55rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1',
                    }}>
                      {pool.provider}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: pool.authType === 'API_KEY' ? 'rgba(6,182,212,0.12)' : 'rgba(245,158,11,0.12)',
                      color: pool.authType === 'API_KEY' ? '#06b6d4' : '#f59e0b',
                    }}>
                      {pool.authType === 'API_KEY' ? 'API Key' : 'Token + Recap'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{pool.routingStrategy}</td>
                  <td style={{ fontWeight: 600, color: '#a1a1aa' }}>{pool.rateLimitPerMin}/min</td>
                  <td>
                    {isDepleted ? (
                      <span style={{ color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <HiOutlineExclamationTriangle size={14} /> 0 Key
                      </span>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                        {pool.keys.length} Keys
                      </span>
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => handleTogglePool(pool.id)} style={{
                      padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                      backgroundColor: pool.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: pool.isActive ? '#10b981' : '#f43f5e',
                    }}>
                      {pool.isActive ? '● Active' : '○ Paused'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button type="button" className={`${styles.iconActionBtn} ${styles.actionEdit}`} onClick={() => handleOpenEditPool(pool)} title="Edit">
                        <HiOutlinePencilSquare size={17} />
                      </button>
                      <button type="button" className={`${styles.iconActionBtn} ${styles.actionDelete}`} onClick={() => handleDeletePool(pool.id)} title="Delete">
                        <HiOutlineTrash size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Add/Edit Pool */}
      {showPoolModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{editingPool ? 'Chỉnh Sửa Pool' : 'Thêm Pool Dịch Vụ Mới'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowPoolModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSavePool}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tên Pool</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: OpenAI GPT-4o Key Pool" required />
                </div>
                <div className={styles.formField}>
                  <label>Nhà Cung Cấp</label>
                  <select value={formProvider} onChange={(e) => setFormProvider(e.target.value as PoolItem['provider'])}>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic (Claude)</option>
                    <option value="Midjourney">Midjourney</option>
                    <option value="Runway">Runway</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Google">Google Gemini</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Hình Thức Xác Thực</label>
                  <select value={formAuthType} onChange={(e) => setFormAuthType(e.target.value as PoolItem['authType'])}>
                    <option value="API_KEY">API Key Chính Thức</option>
                    <option value="TOKEN_ACCOUNT">Token Account + Recap</option>
                  </select>
                  <span className={styles.hint}>Token từ account hỗ trợ nạp mã recap captcha.</span>
                </div>
                <div className={styles.formField}>
                  <label>Thuật Toán Điều Phối</label>
                  <select value={formRouting} onChange={(e) => setFormRouting(e.target.value as PoolItem['routingStrategy'])}>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAST_USED">Least Used</option>
                    <option value="WEIGHTED">Weighted</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Rate Limit (req/min)</label>
                  <input type="number" value={formRateLimit} onChange={(e) => setFormRateLimit(Number(e.target.value))} min={1} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowPoolModal(false)}>Hủy</Button>
                <Button variant="primary" type="submit">Lưu Pool</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePoolPage;
