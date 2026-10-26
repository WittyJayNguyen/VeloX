import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from 'react-icons/hi2';
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
    keys: [], // Empty pool -> Alert!
  },
];

const ServicePoolPage = () => {
  const [pools, setPools] = useState<PoolItem[]>(() => {
    const saved = localStorage.getItem('velox_pools');
    return saved ? JSON.parse(saved) : initialPools;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('ALL');

  // Modal State
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolItem | null>(null);

  // Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyVal, setNewKeyVal] = useState('');
  const [newRecapToken, setNewRecapToken] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Form State for Pool
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<PoolItem['provider']>('OpenAI');
  const [formAuthType, setFormAuthType] = useState<PoolItem['authType']>('API_KEY');
  const [formRouting, setFormRouting] = useState<PoolItem['routingStrategy']>('ROUND_ROBIN');

  const savePools = (updated: PoolItem[]) => {
    setPools(updated);
    localStorage.setItem('velox_pools', JSON.stringify(updated));
  };

  const handleOpenAddPool = () => {
    setEditingPool(null);
    setFormName('');
    setFormProvider('OpenAI');
    setFormAuthType('API_KEY');
    setFormRouting('ROUND_ROBIN');
    setShowPoolModal(true);
  };

  const handleOpenEditPool = (p: PoolItem) => {
    setEditingPool(p);
    setFormName(p.name);
    setFormProvider(p.provider);
    setFormAuthType(p.authType);
    setFormRouting(p.routingStrategy);
    setShowPoolModal(true);
  };

  const handleSavePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPool) {
      const updated = pools.map((p) =>
        p.id === editingPool.id
          ? {
              ...p,
              name: formName,
              provider: formProvider,
              authType: formAuthType,
              routingStrategy: formRouting,
            }
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
        rateLimitPerMin: 500,
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
    const updated = pools.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    savePools(updated);
  };

  // Keys Management
  const handleOpenAddKey = (poolId: string) => {
    setSelectedPoolId(poolId);
    setNewKeyName('');
    setNewKeyVal('');
    setNewRecapToken('');
    setShowKeyModal(true);
  };

  const handleAutoDetectModels = () => {
    setAutoDetecting(true);
    setTimeout(() => {
      setAutoDetecting(false);
      alert('Đã tự động nhận diện models từ nhà cung cấp: GPT-4o, GPT-4o-mini, DALL-E-3');
    }, 800);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoolId || !newKeyVal.trim()) return;

    const newKey: PoolKeyItem = {
      id: `key_${Date.now()}`,
      name: newKeyName || 'Khóa ' + (pools.find((p) => p.id === selectedPoolId)?.keys.length ?? 0 + 1),
      keyVal: newKeyVal,
      recapToken: newRecapToken || undefined,
      isActive: true,
      requestsCount: 0,
      detectedModels: ['gpt-4o', 'claude-3.5', 'auto-detected'],
    };

    const updated = pools.map((p) => {
      if (p.id === selectedPoolId) {
        return { ...p, keys: [...p.keys, newKey] };
      }
      return p;
    });

    savePools(updated);
    setShowKeyModal(false);
  };

  const handleDeleteKey = (poolId: string, keyId: string) => {
    const updated = pools.map((p) => {
      if (p.id === poolId) {
        return { ...p, keys: p.keys.filter((k) => k.id !== keyId) };
      }
      return p;
    });
    savePools(updated);
  };

  // Filtered pools
  const filtered = pools.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'ALL' || p.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className={styles.moduleContainer}>
      {/* Alert Banner if any pool has 0 keys */}
      {pools.some((p) => p.keys.length === 0) && (
        <div className={`${styles.alertBanner} ${styles.danger}`}>
          <HiOutlineExclamationTriangle size={20} />
          <span>
            <strong>CẢNH BÁO QUAN TRỌNG:</strong> Có Pool đang cạn/hết API Key hoặc Token! Hãy bổ sung key ngay để tránh lỗi 503 cho người dùng.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm pool theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFilter}
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="ALL">Tất cả Nhà Cung Cấp</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic (Claude)</option>
            <option value="Midjourney">Midjourney</option>
            <option value="Runway">Runway</option>
            <option value="DeepSeek">DeepSeek</option>
          </select>
        </div>

        <div className={styles.actionButtonGroup}>
          <Button variant="primary" size="md" onClick={handleOpenAddPool}>
            <HiOutlinePlus size={16} /> Thêm Pool Mới
          </Button>
        </div>
      </div>

      {/* Pools Table & Key Management */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <h3>Danh Sách Pool Dịch Vụ & Nhóm Khóa NCC</h3>
          <span className={styles.countBadge}>{filtered.length} Pools Hoạt Động</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Tên Pool</th>
              <th>Nhà Cung Cấp</th>
              <th>Loại Xác Thực</th>
              <th>Thuật Toán Điều Phối</th>
              <th>Số Lượng Khóa / Token</th>
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
                      <strong style={{ color: '#212529', display: 'block' }}>{pool.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#878a99' }}>{pool.id}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#405189' }}>{pool.provider}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: pool.authType === 'API_KEY' ? '#eef3fd' : '#fef8ee',
                        color: pool.authType === 'API_KEY' ? '#3577f1' : '#f7b84b',
                      }}
                    >
                      {pool.authType === 'API_KEY' ? 'API Key NCC' : 'Account Token + Recap'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#495057' }}>{pool.routingStrategy}</span>
                  </td>
                  <td>
                    {isDepleted ? (
                      <span style={{ color: '#f06548', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <HiOutlineExclamationTriangle size={14} /> 0 Key (Hết Pool!)
                      </span>
                    ) : (
                      <span style={{ color: '#0ab39c', fontWeight: 600 }}>
                        {pool.keys.length} Khóa / Tokens
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleTogglePool(pool.id)}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 9999,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: pool.isActive ? '#e6f7f5' : '#fef0ed',
                        color: pool.isActive ? '#0ab39c' : '#f06548',
                      }}
                    >
                      {pool.isActive ? 'Đang Bật' : 'Tạm Dừng'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.iconActionBtn}
                        onClick={() => handleOpenAddKey(pool.id)}
                        title="Quản lý Key/Token"
                      >
                        <HiOutlineKey size={17} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.actionEdit}`}
                        onClick={() => handleOpenEditPool(pool)}
                        title="Chỉnh sửa Pool"
                      >
                        <HiOutlinePencilSquare size={17} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.actionDelete}`}
                        onClick={() => handleDeletePool(pool.id)}
                        title="Xoá Pool"
                      >
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

      {/* Sub-table: Keys Inside Selected Pool */}
      <div className={styles.tableContainer} style={{ marginTop: '0.5rem' }}>
        <div className={styles.tableHeaderBar}>
          <h3>Chi Tiết Các Khóa / Account Token Trong Các Pool</h3>
          <span style={{ fontSize: '0.8rem', color: '#878a99' }}>Bao gồm cấu hình mã Recap và Auto nhận diện model</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Tên Khóa / Account</th>
              <th>Thuộc Pool</th>
              <th>Giá Trị Khóa / Token</th>
              <th>Mã Recap Token (Bypass)</th>
              <th>Models Tự Nhận Diện</th>
              <th>Lượt Req</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {pools.flatMap((p) =>
              p.keys.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600 }}>{k.name}</td>
                  <td>{p.name}</td>
                  <td>
                    <code style={{ background: '#f3f6f9', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.75rem' }}>
                      {k.keyVal}
                    </code>
                  </td>
                  <td>
                    {k.recapToken ? (
                      <span style={{ color: '#0ab39c', fontSize: '0.75rem', fontWeight: 600 }}>
                        <HiOutlineShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                        Đã nạp Recap Token
                      </span>
                    ) : (
                      <span style={{ color: '#878a99', fontSize: '0.75rem' }}>Không áp dụng</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {k.detectedModels.map((m, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#eef3fd',
                            color: '#3577f1',
                            fontSize: '0.6875rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: 3,
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{k.requestsCount.toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.iconActionBtn} ${styles.actionDelete}`}
                      onClick={() => handleDeleteKey(p.id, k.id)}
                      title="Xoá Key"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Thêm / Sửa Pool */}
      {showPoolModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{editingPool ? 'Chỉnh Sửa Pool' : 'Thêm Pool Dịch Vụ Mới'}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowPoolModal(false)}
              >
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSavePool}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tên Pool</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: OpenAI GPT-4o Key Pool"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Nhà Cung Cấp (Provider)</label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value as PoolItem['provider'])}
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic (Claude)</option>
                    <option value="Midjourney">Midjourney</option>
                    <option value="Runway">Runway</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Google">Google Gemini</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Hình Thức Xác Thực (Auth Type)</label>
                  <select
                    value={formAuthType}
                    onChange={(e) => setFormAuthType(e.target.value as PoolItem['authType'])}
                  >
                    <option value="API_KEY">API Key Chính Thức từ NCC</option>
                    <option value="TOKEN_ACCOUNT">Token từ Account (Session/Recap)</option>
                  </select>
                  <span className={styles.hint}>
                    Token từ account hỗ trợ nạp mã recap captcha để tự động lấy model.
                  </span>
                </div>

                <div className={styles.formField}>
                  <label>Thuật Toán Điều Phối (Routing Strategy)</label>
                  <select
                    value={formRouting}
                    onChange={(e) => setFormRouting(e.target.value as PoolItem['routingStrategy'])}
                  >
                    <option value="ROUND_ROBIN">Round Robin (Xoay vòng đều)</option>
                    <option value="LEAST_USED">Least Used (Ưu tiên key ít dùng nhất)</option>
                    <option value="WEIGHTED">Weighted (Trọng số định mức)</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowPoolModal(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" type="submit">
                  Lưu Pool
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm API Key / Token vào Pool */}
      {showKeyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Thêm Khóa / Account Token Vào Pool</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowKeyModal(false)}
              >
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSaveKey}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tên Gợi Nhớ Cho Khóa</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="VD: OpenAI Key Dự Phòng #3"
                  />
                </div>

                <div className={styles.formField}>
                  <label>Giá Trị API Key / Account Token</label>
                  <textarea
                    rows={3}
                    value={newKeyVal}
                    onChange={(e) => setNewKeyVal(e.target.value)}
                    placeholder="Dán API Key hoặc session token tại đây..."
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Khẩu Mã Recap (Dành cho Account Token)</label>
                  <input
                    type="text"
                    value={newRecapToken}
                    onChange={(e) => setNewRecapToken(e.target.value)}
                    placeholder="VD: cf_turnstile_token / recaptcha_token..."
                  />
                  <span className={styles.hint}>
                    Cần thiết để bypass captcha lấy danh sách modal tự động theo tài khoản.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleAutoDetectModels}
                    loading={autoDetecting}
                  >
                    <HiOutlineSparkles size={16} /> Auto Nhận Diện Model NCC
                  </Button>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowKeyModal(false)}>
                  Hủy Bỏ
                </Button>
                <Button variant="primary" type="submit">
                  Thêm Khóa Vào Pool
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePoolPage;
