import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineSignal,
  HiOutlineServerStack,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';
import poolStyles from '@assets/scss/admin/pools-admin.module.scss';

// ── Types ──
export type KeyAuthType = 'API_KEY' | 'SESSION_TOKEN';
export type KeyStatus = 'ACTIVE' | 'PAUSED' | 'QUOTA_EXCEEDED' | 'ERROR';
export type PlanTier = 'Free' | 'Plus' | 'Pro' | 'Team' | 'Enterprise';
export type ProviderType = 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek' | 'Midjourney' | 'Runway' | 'OpenRouter' | 'Custom';
export type RoutingStrategy = 'ROUND_ROBIN' | 'PRIORITY' | 'LEAST_USED' | 'WEIGHTED';

export interface PoolKeyItem {
  id: string;
  name: string;
  authType: KeyAuthType;
  keyVal: string;
  recapToken?: string;
  cookies?: string;
  metadataJson?: string;
  quotaDaily: number;
  quotaDailyUsed: number;
  quotaMonthly: number;
  quotaMonthlyUsed: number;
  points: number;
  priority: number; // 1 - 10
  planBadge: PlanTier;
  status: KeyStatus;
  requestsCount: number;
  detectedModels: string[];
  lastCheckedAt?: string;
  quotaRemainingUsd?: number;
  notes?: string;
}

export interface PoolItem {
  id: string;
  name: string;
  provider: ProviderType;
  baseUrl: string;
  authType: 'API_KEY' | 'TOKEN_ACCOUNT' | 'HYBRID';
  routingStrategy: RoutingStrategy;
  keys: PoolKeyItem[];
  isActive: boolean;
  rateLimitPerMin: number;
  maxTokensPerMin?: number;
  timeoutMs?: number;
  description?: string;
}

const initialPools: PoolItem[] = [
  {
    id: 'pool_openai_01',
    name: 'OpenAI Enterprise Gateway Pool',
    provider: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authType: 'HYBRID',
    routingStrategy: 'PRIORITY',
    isActive: true,
    rateLimitPerMin: 3500,
    timeoutMs: 30000,
    description: 'Cụm điều phối chính OpenAI tương thích chuẩn API v1, hỗ trợ cả API Key và Web Session Token',
    keys: [
      {
        id: 'k_oai_1',
        name: 'OpenAI Org Master #1',
        authType: 'API_KEY',
        keyVal: 'sk-proj-9818ab934c990234125a',
        quotaDaily: 20000,
        quotaDailyUsed: 4210,
        quotaMonthly: 500000,
        quotaMonthlyUsed: 124500,
        points: 50000,
        priority: 10,
        planBadge: 'Enterprise',
        status: 'ACTIVE',
        requestsCount: 28420,
        detectedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'text-embedding-3-large'],
        lastCheckedAt: '2026-10-27 08:00',
        quotaRemainingUsd: 1250.0,
      },
      {
        id: 'k_oai_2',
        name: 'OpenAI Web Session #1 (Plus)',
        authType: 'SESSION_TOKEN',
        keyVal: 'sess-8812ae9901f4c39120',
        recapToken: '2cap_auto_solver_acc01',
        cookies: '__Secure-next-auth.session-token=sess-8812...; cf_clearance=cf_9921_x3',
        quotaDaily: 2000,
        quotaDailyUsed: 1650,
        quotaMonthly: 40000,
        quotaMonthlyUsed: 29800,
        points: 15000,
        priority: 8,
        planBadge: 'Plus',
        status: 'ACTIVE',
        requestsCount: 14200,
        detectedModels: ['gpt-4o', 'gpt-4o-mini', 'dall-e-3'],
        lastCheckedAt: '2026-10-27 07:45',
        quotaRemainingUsd: 45.0,
      },
      {
        id: 'k_oai_3',
        name: 'OpenAI Team Shared Key #2',
        authType: 'API_KEY',
        keyVal: 'sk-proj-7712bb45601cde99',
        quotaDaily: 10000,
        quotaDailyUsed: 980,
        quotaMonthly: 250000,
        quotaMonthlyUsed: 42000,
        points: 30000,
        priority: 7,
        planBadge: 'Team',
        status: 'ACTIVE',
        requestsCount: 8900,
        detectedModels: ['gpt-4o', 'gpt-4o-mini', 'whisper-1'],
        lastCheckedAt: '2026-10-26 22:15',
        quotaRemainingUsd: 480.0,
      },
    ],
  },
  {
    id: 'pool_deepseek_01',
    name: 'DeepSeek V3 / R1 OpenAI-Compatible Pool',
    provider: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    authType: 'API_KEY',
    routingStrategy: 'ROUND_ROBIN',
    isActive: true,
    rateLimitPerMin: 2000,
    timeoutMs: 45000,
    description: 'Cụm mô hình suy luận tốc độ cao DeepSeek chuẩn OpenAI tương thích',
    keys: [
      {
        id: 'k_ds_1',
        name: 'DeepSeek Official Key #1',
        authType: 'API_KEY',
        keyVal: 'sk-ds-998811223344',
        quotaDaily: 30000,
        quotaDailyUsed: 5200,
        quotaMonthly: 800000,
        quotaMonthlyUsed: 145000,
        points: 40000,
        priority: 9,
        planBadge: 'Pro',
        status: 'ACTIVE',
        requestsCount: 19500,
        detectedModels: ['deepseek-chat', 'deepseek-reasoner'],
        lastCheckedAt: '2026-10-27 07:30',
        quotaRemainingUsd: 320.0,
      },
    ],
  },
  {
    id: 'pool_anthropic_01',
    name: 'Anthropic Claude High-Tier Pool',
    provider: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    authType: 'API_KEY',
    routingStrategy: 'LEAST_USED',
    isActive: true,
    rateLimitPerMin: 1200,
    timeoutMs: 60000,
    description: 'Cụm Claude 3.5 Sonnet & Opus chịu tải cao',
    keys: [
      {
        id: 'k_ant_1',
        name: 'Claude Pro Tier Key',
        authType: 'API_KEY',
        keyVal: 'sk-ant-aa129988776655',
        quotaDaily: 5000,
        quotaDailyUsed: 1200,
        quotaMonthly: 100000,
        quotaMonthlyUsed: 34500,
        points: 25000,
        priority: 8,
        planBadge: 'Pro',
        status: 'ACTIVE',
        requestsCount: 11200,
        detectedModels: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
        lastCheckedAt: '2026-10-27 06:15',
        quotaRemainingUsd: 190.0,
      },
    ],
  },
  {
    id: 'pool_mj_01',
    name: 'Midjourney Session Token Pool',
    provider: 'Midjourney',
    baseUrl: 'https://discord.com/api/v9',
    authType: 'TOKEN_ACCOUNT',
    routingStrategy: 'ROUND_ROBIN',
    isActive: true,
    rateLimitPerMin: 250,
    timeoutMs: 90000,
    description: 'Cụm tài khoản vẽ ảnh Midjourney qua Discord Session & Recaptcha Solver',
    keys: [
      {
        id: 'k_mj_1',
        name: 'MJ Discord Account #1 (Relaxed)',
        authType: 'SESSION_TOKEN',
        keyVal: 'tok_mj_9901aa8823',
        recapToken: '2cap_mj_solver_node1',
        cookies: '__cf_bm=mj_cook_1; __Secure-token=tok_mj_9901',
        quotaDaily: 500,
        quotaDailyUsed: 420,
        quotaMonthly: 12000,
        quotaMonthlyUsed: 11200,
        points: 8000,
        priority: 6,
        planBadge: 'Plus',
        status: 'ACTIVE',
        requestsCount: 3120,
        detectedModels: ['midjourney-v6', 'midjourney-niji'],
        lastCheckedAt: '2026-10-27 05:00',
        quotaRemainingUsd: 30.0,
      },
    ],
  },
];

export const getPoolsFromStorage = (): PoolItem[] => {
  const s = localStorage.getItem('velox_pools_v2');
  if (s) {
    try {
      return JSON.parse(s);
    } catch {
      // fallback
    }
  }
  return initialPools;
};

export const savePoolsToStorage = (p: PoolItem[]) => {
  localStorage.setItem('velox_pools_v2', JSON.stringify(p));
};

const PROVIDER_OPTIONS = [
  { value: 'OpenAI', label: 'OpenAI (Chuẩn v1)' },
  { value: 'DeepSeek', label: 'DeepSeek (Chuẩn OpenAI)' },
  { value: 'Anthropic', label: 'Anthropic Claude' },
  { value: 'Google', label: 'Google Gemini' },
  { value: 'OpenRouter', label: 'OpenRouter Gateway' },
  { value: 'Midjourney', label: 'Midjourney' },
  { value: 'Runway', label: 'Runway Gen-3' },
  { value: 'Custom', label: 'Custom OpenAI-Compatible' },
];

const AUTH_OPTIONS = [
  { value: 'HYBRID', label: 'Hybrid (API Key + Session Token)' },
  { value: 'API_KEY', label: 'Chỉ API Key' },
  { value: 'TOKEN_ACCOUNT', label: 'Chỉ Session Token (Account)' },
];

const ROUTING_OPTIONS = [
  { value: 'PRIORITY', label: 'Ưu tiên Điểm & Priority (Mặc định)' },
  { value: 'ROUND_ROBIN', label: 'Round Robin (Vòng tròn đều)' },
  { value: 'LEAST_USED', label: 'Least Used (Tải thấp nhất)' },
  { value: 'WEIGHTED', label: 'Weighted (Phân bổ trọng số)' },
];

const ServicePoolPage = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Pool Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<ProviderType>('OpenAI');
  const [formBaseUrl, setFormBaseUrl] = useState('https://api.openai.com/v1');
  const [formAuth, setFormAuth] = useState<PoolItem['authType']>('HYBRID');
  const [formRouting, setFormRouting] = useState<RoutingStrategy>('PRIORITY');
  const [formRateLimit, setFormRateLimit] = useState(2500);
  const [formTimeout, setFormTimeout] = useState(30000);
  const [formDesc, setFormDesc] = useState('');

  const savePools = (u: PoolItem[]) => {
    setPools(u);
    savePoolsToStorage(u);
  };

  const handleOpenAdd = () => {
    setEditingPool(null);
    setFormName('');
    setFormProvider('OpenAI');
    setFormBaseUrl('https://api.openai.com/v1');
    setFormAuth('HYBRID');
    setFormRouting('PRIORITY');
    setFormRateLimit(2500);
    setFormTimeout(30000);
    setFormDesc('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: PoolItem) => {
    setEditingPool(p);
    setFormName(p.name);
    setFormProvider(p.provider);
    setFormBaseUrl(p.baseUrl || 'https://api.openai.com/v1');
    setFormAuth(p.authType);
    setFormRouting(p.routingStrategy);
    setFormRateLimit(p.rateLimitPerMin);
    setFormTimeout(p.timeoutMs || 30000);
    setFormDesc(p.description || '');
    setShowModal(true);
  };

  const handleProviderPreset = (prov: ProviderType) => {
    setFormProvider(prov);
    if (prov === 'OpenAI') setFormBaseUrl('https://api.openai.com/v1');
    else if (prov === 'DeepSeek') setFormBaseUrl('https://api.deepseek.com/v1');
    else if (prov === 'OpenRouter') setFormBaseUrl('https://openrouter.ai/api/v1');
    else if (prov === 'Anthropic') setFormBaseUrl('https://api.anthropic.com/v1');
    else if (prov === 'Google') setFormBaseUrl('https://generativelanguage.googleapis.com/v1beta');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPool) {
      savePools(
        pools.map((p) =>
          p.id === editingPool.id
            ? {
                ...p,
                name: formName,
                provider: formProvider,
                baseUrl: formBaseUrl,
                authType: formAuth,
                routingStrategy: formRouting,
                rateLimitPerMin: formRateLimit,
                timeoutMs: formTimeout,
                description: formDesc,
              }
            : p
        )
      );
    } else {
      const newPool: PoolItem = {
        id: `pool_${Date.now()}`,
        name: formName,
        provider: formProvider,
        baseUrl: formBaseUrl,
        authType: formAuth,
        routingStrategy: formRouting,
        isActive: true,
        rateLimitPerMin: formRateLimit,
        timeoutMs: formTimeout,
        description: formDesc,
        keys: [],
      };
      savePools([...pools, newPool]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá cụm Service Pool này? Các keys thuộc pool sẽ bị gỡ bỏ.')) {
      savePools(pools.filter((p) => p.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    savePools(pools.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  // Stats calculation
  const totalKeys = pools.reduce((acc, p) => acc + p.keys.length, 0);
  const activeKeys = pools.reduce((acc, p) => acc + p.keys.filter((k) => k.status === 'ACTIVE').length, 0);
  const openAiPools = pools.filter((p) => p.provider === 'OpenAI' || p.baseUrl.includes('openai')).length;
  const avgRpm = pools.length > 0 ? Math.round(pools.reduce((acc, p) => acc + p.rateLimitPerMin, 0) / pools.length) : 0;

  // Filter
  const filtered = pools.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.baseUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProv = providerFilter === 'ALL' || p.provider === providerFilter;
    return matchSearch && matchProv;
  });

  const columns: TableColumn<PoolItem>[] = [
    {
      key: 'name',
      header: 'Tên Cụm Pool & Base URL',
      render: (p) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ color: '#fafafa' }}>{p.name}</strong>
            {p.provider === 'OpenAI' && (
              <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.7rem' }} title="Chuẩn OpenAI Gateway">
                <RiOpenaiFill size={14} /> OpenAI Standard
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <code style={{ color: '#a1a1aa' }}>{p.baseUrl}</code>
            <span style={{ color: '#52525b' }}>• {p.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (p) => {
        let variant: 'primary' | 'success' | 'warning' | 'info' | 'neutral' = 'primary';
        if (p.provider === 'OpenAI') variant = 'success';
        else if (p.provider === 'Anthropic') variant = 'primary';
        else if (p.provider === 'DeepSeek') variant = 'info';
        else if (p.provider === 'Midjourney') variant = 'warning';
        return (
          <Badge variant={variant} size="sm">
            {p.provider === 'OpenAI' && <RiOpenaiFill size={12} style={{ marginRight: 3 }} />}
            {p.provider}
          </Badge>
        );
      },
    },
    {
      key: 'authType',
      header: 'Cơ Chế Xác Thực',
      render: (p) => (
        <span style={{ fontSize: '0.75rem', color: '#e4e4e7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {p.authType === 'HYBRID' ? (
            <Badge variant="purple" size="sm">Hybrid (Key + Token)</Badge>
          ) : p.authType === 'API_KEY' ? (
            <Badge variant="info" size="sm">API Key</Badge>
          ) : (
            <Badge variant="warning" size="sm">Session Token</Badge>
          )}
        </span>
      ),
    },
    {
      key: 'routingStrategy',
      header: 'Chiến Lược Điều Phối',
      render: (p) => {
        const labels: Record<RoutingStrategy, string> = {
          PRIORITY: 'Priority & Điểm',
          ROUND_ROBIN: 'Round Robin',
          LEAST_USED: 'Least Used',
          WEIGHTED: 'Weighted',
        };
        return <Badge variant="neutral" size="sm">{labels[p.routingStrategy] || p.routingStrategy}</Badge>;
      },
    },
    {
      key: 'keys',
      header: 'Tài Khoản / Keys',
      align: 'center',
      render: (p) => {
        const activeCount = p.keys.filter((k) => k.status === 'ACTIVE').length;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Badge variant="primary" size="md">
              <HiOutlineKey size={13} style={{ marginRight: 3 }} /> {p.keys.length} Keys
            </Badge>
            <span style={{ fontSize: '0.68rem', color: activeCount > 0 ? '#34d399' : '#71717a' }}>
              {activeCount} active
            </span>
          </div>
        );
      },
    },
    {
      key: 'rateLimitPerMin',
      header: 'Giới Hạn Gọi (RPM)',
      align: 'right',
      render: (p) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
            {p.rateLimitPerMin.toLocaleString()}
          </span>
          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>req/phút</div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      align: 'center',
      render: (p) => (
        <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm" dot>
          <button
            type="button"
            onClick={() => handleToggle(p.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          >
            {p.isActive ? 'Hoạt động' : 'Tắt'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (p) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            title="Xem & Thêm Keys cho Pool này"
            onClick={() => navigate(`/admin/keys?pool=${p.id}`)}
          >
            <HiOutlineArrowTopRightOnSquare size={16} style={{ color: '#38bdf8' }} />
          </Button>
          <Button variant="ghost" size="sm" title="Chỉnh sửa pool" onClick={() => handleOpenEdit(p)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Xóa pool" onClick={() => handleDelete(p.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top StatCards */}
      <div className={poolStyles.statsGrid}>
        <StatCard title="Tổng Cụm Service Pools" value={pools.length} icon={<HiOutlineServerStack size={22} />} change="Khả dụng cao" changeType="up" />
        <StatCard title="Chuẩn OpenAI Gateway" value={openAiPools} icon={<RiOpenaiFill size={22} />} change="Tương thích 100%" changeType="up" />
        <StatCard title="Tổng Keys & Session Tokens" value={`${activeKeys} / ${totalKeys}`} icon={<HiOutlineKey size={22} />} change="Đang điều phối" changeType="neutral" />
        <StatCard title="Tải Giới Hạn Trung Bình" value={`${avgRpm.toLocaleString()} RPM`} icon={<HiOutlineCpuChip size={22} />} change="Tự động cân bằng tải" changeType="up" />
      </div>

      {/* Toolbar Filter */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <SearchInput placeholder="Tìm tên pool, endpoint base URL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả Provider' },
                { value: 'OpenAI', label: 'OpenAI' },
                { value: 'DeepSeek', label: 'DeepSeek' },
                { value: 'Anthropic', label: 'Anthropic' },
                { value: 'Google', label: 'Google' },
                { value: 'Midjourney', label: 'Midjourney' },
              ]}
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="md" onClick={() => navigate('/admin/keys')}>
              <HiOutlineKey size={16} /> Quản Lý Keys & Tokens ({totalKeys})
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              <HiOutlinePlus size={16} /> Thêm Pool Chuẩn OpenAI
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card
        title="Quản Lý Service Pools Điều Phối"
        subtitle={`Đang hiển thị ${filtered.length} cụm pool dịch vụ kết nối AI`}
        headerRight={<HiOutlineSignal size={20} style={{ color: '#6366f1' }} />}
        padding="none"
      >
        <Table columns={columns} data={filtered} rowKey={(p) => p.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal Thêm / Chỉnh sửa Service Pool */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPool ? 'Cập Nhật Cụm Service Pool' : 'Thêm Cụm Service Pool Chuẩn OpenAI'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingPool ? 'Cập Nhật Pool' : 'Tạo Pool Mới'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={poolStyles.formSectionTitle}>
            <RiOpenaiFill /> Thông Tin Cụm Pool & Chuẩn Gateway
          </div>

          <div className={poolStyles.formGrid2}>
            <Input
              label="Tên Cụm Pool"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: OpenAI Enterprise Production Pool"
              required
              fullWidth
            />
            <Select
              label="Nhà Cung Cấp (Provider)"
              options={PROVIDER_OPTIONS}
              value={formProvider}
              onChange={(e) => handleProviderPreset(e.target.value as ProviderType)}
              fullWidth
            />
          </div>

          <Input
            label="Base URL Endpoint (Chuẩn OpenAI / Provider)"
            value={formBaseUrl}
            onChange={(e) => setFormBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            hint="Hỗ trợ chuẩn endpoint OpenAI v1 hoặc custom reverse proxy"
            required
            fullWidth
          />

          <div className={poolStyles.formSectionTitle}>
            <HiOutlineBolt /> Cơ Chế Điều Phối & Giới Hạn Tải
          </div>

          <div className={poolStyles.formGrid2}>
            <Select
              label="Loại Xác Thực Hỗ Trợ"
              options={AUTH_OPTIONS}
              value={formAuth}
              onChange={(e) => setFormAuth(e.target.value as PoolItem['authType'])}
              fullWidth
            />
            <Select
              label="Chiến Lược Điều Phối (Routing)"
              options={ROUTING_OPTIONS}
              value={formRouting}
              onChange={(e) => setFormRouting(e.target.value as RoutingStrategy)}
              fullWidth
            />
          </div>

          <div className={poolStyles.formGrid2}>
            <Input
              label="Giới Hạn Tải (RPM - Requests/phút)"
              type="number"
              value={formRateLimit}
              onChange={(e) => setFormRateLimit(Number(e.target.value))}
              hint="Ngưỡng bảo vệ rate-limit cho cả cụm pool"
              fullWidth
            />
            <Input
              label="Timeout Kết Nối (ms)"
              type="number"
              value={formTimeout}
              onChange={(e) => setFormTimeout(Number(e.target.value))}
              hint="Mặc định: 30,000ms"
              fullWidth
            />
          </div>

          <Input
            label="Mô Tả / Ghi Chú Pool"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Ghi chú về mục đích sử dụng, SLA hoặc cụm hạ tầng..."
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
};

export default ServicePoolPage;
