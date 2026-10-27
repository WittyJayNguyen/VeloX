import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineKey,
  HiOutlineSignal,
  HiOutlineServerStack,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowPath,
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
import {
  poolService,
  type PoolItem,
  type PoolKeyItem,
  type KeyAuthType,
  type KeyStatus,
  type PlanTier,
  type ProviderType,
  type RoutingStrategy,
} from '../services/poolService';

// Re-export types for backward compatibility
export type { KeyAuthType, KeyStatus, PlanTier, ProviderType, RoutingStrategy, PoolKeyItem, PoolItem };

// Backward compat stubs if any component imports them
export const getPoolsFromStorage = (): PoolItem[] => [];
export const savePoolsToStorage = (_p: PoolItem[]) => {};

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
  const [pools, setPools] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Pool Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<ProviderType>('OpenAI');
  const [formBaseUrl, setFormBaseUrl] = useState('https://api.openai.com/v1');
  const [formAuth, setFormAuth] = useState<PoolItem['auth_type']>('HYBRID');
  const [formRouting, setFormRouting] = useState<RoutingStrategy>('PRIORITY');
  const [formRateLimit, setFormRateLimit] = useState(2500);
  const [formTimeout, setFormTimeout] = useState(30000);
  const [formDesc, setFormDesc] = useState('');

  // Fetch from DB API
  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await poolService.getPools();
      setPools(data);
    } catch (err: any) {
      console.error('Failed to fetch pools:', err);
      setError(err?.response?.data?.detail || 'Không thể tải danh sách Service Pools từ database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

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
    setFormBaseUrl(p.base_url || 'https://api.openai.com/v1');
    setFormAuth(p.auth_type);
    setFormRouting(p.routing_strategy);
    setFormRateLimit(p.rate_limit_per_min);
    setFormTimeout(p.timeout_ms || 30000);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    try {
      if (editingPool) {
        await poolService.updatePool(editingPool.id, {
          name: formName,
          provider: formProvider,
          base_url: formBaseUrl,
          auth_type: formAuth,
          routing_strategy: formRouting,
          rate_limit_per_min: formRateLimit,
          timeout_ms: formTimeout,
          description: formDesc,
        });
      } else {
        await poolService.createPool({
          name: formName,
          provider: formProvider,
          base_url: formBaseUrl,
          auth_type: formAuth,
          routing_strategy: formRouting,
          is_active: true,
          rate_limit_per_min: formRateLimit,
          timeout_ms: formTimeout,
          description: formDesc,
        });
      }
      setShowModal(false);
      await fetchPools();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu Service Pool');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá cụm Service Pool này? Toàn bộ Keys trong Pool này sẽ bị xoá vĩnh viễn.')) {
      try {
        await poolService.deletePool(id);
        await fetchPools();
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Không thể xoá pool');
      }
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await poolService.togglePool(id);
      await fetchPools();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không thể thay đổi trạng thái pool');
    }
  };

  // Stats calculation
  const totalKeys = pools.reduce((acc, p) => acc + (p.keys?.length || 0), 0);
  const activeKeys = pools.reduce((acc, p) => acc + (p.keys || []).filter((k) => k.status === 'ACTIVE').length, 0);
  const openAiPools = pools.filter((p) => p.provider === 'OpenAI' || (p.base_url && p.base_url.includes('openai'))).length;
  const avgRpm = pools.length > 0 ? Math.round(pools.reduce((acc, p) => acc + p.rate_limit_per_min, 0) / pools.length) : 0;

  // Filter
  const filtered = pools.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.base_url || '').toLowerCase().includes(searchTerm.toLowerCase());
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
            <code style={{ color: '#a1a1aa' }}>{p.base_url}</code>
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
      key: 'auth_type',
      header: 'Cơ Chế Xác Thực',
      render: (p) => (
        <span style={{ fontSize: '0.75rem', color: '#e4e4e7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {p.auth_type === 'HYBRID' ? (
            <Badge variant="purple" size="sm">Hybrid (Key + Token)</Badge>
          ) : p.auth_type === 'API_KEY' ? (
            <Badge variant="info" size="sm">API Key</Badge>
          ) : (
            <Badge variant="warning" size="sm">Session Token</Badge>
          )}
        </span>
      ),
    },
    {
      key: 'routing_strategy',
      header: 'Chiến Lược Điều Phối',
      render: (p) => {
        const labels: Record<RoutingStrategy, string> = {
          PRIORITY: 'Priority & Điểm',
          ROUND_ROBIN: 'Round Robin',
          LEAST_USED: 'Least Used',
          WEIGHTED: 'Weighted',
        };
        return <Badge variant="neutral" size="sm">{labels[p.routing_strategy] || p.routing_strategy}</Badge>;
      },
    },
    {
      key: 'keys',
      header: 'Tài Khoản / Keys',
      align: 'center',
      render: (p) => {
        const count = p.keys?.length || 0;
        const activeCount = (p.keys || []).filter((k) => k.status === 'ACTIVE').length;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Badge variant="primary" size="md">
              <HiOutlineKey size={13} style={{ marginRight: 3 }} /> {count} Keys
            </Badge>
            <span style={{ fontSize: '0.68rem', color: activeCount > 0 ? '#34d399' : '#71717a' }}>
              {activeCount} active
            </span>
          </div>
        );
      },
    },
    {
      key: 'rate_limit_per_min',
      header: 'Giới Hạn Gọi (RPM)',
      align: 'right',
      render: (p) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
            {p.rate_limit_per_min.toLocaleString()}
          </span>
          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>req/phút</div>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Trạng Thái',
      align: 'center',
      render: (p) => (
        <Badge variant={p.is_active ? 'success' : 'neutral'} size="sm" dot>
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
            {p.is_active ? 'Hoạt động' : 'Tắt'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (p) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
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
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineServerStack style={{ color: '#6366f1' }} />
            Quản Lý Cụm Service Pool (Gateway)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
            Điều phối và cân bằng tải API Key, Session Token, Token Web Pool theo chuẩn OpenAI Reverse Proxy
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={fetchPools} disabled={loading}>
            <HiOutlineArrowPath size={16} className={loading ? 'spin' : ''} />
            Làm Mới
          </Button>
          <Button variant="primary" onClick={handleOpenAdd}>
            <HiOutlinePlus size={16} />
            Thêm Cụm Pool Mới
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
        <StatCard
          title="Tổng Cụm Pool"
          value={pools.length}
          trend={{ value: `${openAiPools} cụm OpenAI`, positive: true }}
          icon={<HiOutlineServerStack size={22} />}
        />
        <StatCard
          title="Tổng Keys / Tokens"
          value={totalKeys}
          trend={{ value: `${activeKeys} đang sẵn sàng`, positive: true }}
          icon={<HiOutlineKey size={22} />}
        />
        <StatCard
          title="Tỉ Lệ Keys Khả Dụng"
          value={totalKeys > 0 ? `${Math.round((activeKeys / totalKeys) * 100)}%` : '0%'}
          trend={{ value: 'Tự động luân chuyển', positive: true }}
          icon={<HiOutlineSignal size={22} />}
        />
        <StatCard
          title="Throughput Trung Bình"
          value={`${avgRpm.toLocaleString()} RPM`}
          trend={{ value: 'Tối ưu độ trễ thấp', positive: true }}
          icon={<HiOutlineBolt size={22} />}
        />
      </div>

      {/* Filter & Table Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '240px', maxWidth: '600px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <SearchInput
                placeholder="Tìm kiếm theo tên pool, Base URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
              <Select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                options={[{ value: 'ALL', label: 'Tất cả Provider' }, ...PROVIDER_OPTIONS]}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
            Hiển thị <strong>{filtered.length}</strong> / {pools.length} cụm pool
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
          page={page}
          pageSize={10}
          onPageChange={setPage}
          emptyText={loading ? 'Đang tải dữ liệu từ database...' : 'Không tìm thấy cụm Service Pool nào phù hợp'}
        />
      </Card>

      {/* Modal Add / Edit Pool */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPool ? `Chỉnh Sửa Pool: ${editingPool.name}` : 'Thêm Cụm Service Pool Mới'}
        size="lg"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Tên Cụm Service Pool <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: OpenAI Enterprise Gateway Pool, Claude 3.5 Sonnet Fast..."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Provider / Nhà Cung Cấp
              </label>
              <Select
                value={formProvider}
                onChange={(e) => handleProviderPreset(e.target.value as ProviderType)}
                options={PROVIDER_OPTIONS}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Cơ Chế Xác Thực (Auth Mode)
              </label>
              <Select
                value={formAuth}
                onChange={(e) => setFormAuth(e.target.value as any)}
                options={AUTH_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Base URL Gateway Tương Thích <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <Input
              value={formBaseUrl}
              onChange={(e) => setFormBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2, display: 'block' }}>
              VeloX sẽ forward các yêu cầu chat/completions, embeddings, images đến Base URL này theo format chuẩn OpenAI.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Chiến Lược Điều Phối (Routing)
              </label>
              <Select
                value={formRouting}
                onChange={(e) => setFormRouting(e.target.value as RoutingStrategy)}
                options={ROUTING_OPTIONS}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Tải Tối Đa (RPM)
              </label>
              <Input
                type="number"
                value={formRateLimit}
                onChange={(e) => setFormRateLimit(Number(e.target.value))}
                min={10}
                max={50000}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Timeout (ms)
              </label>
              <Input
                type="number"
                value={formTimeout}
                onChange={(e) => setFormTimeout(Number(e.target.value))}
                min={1000}
                max={300000}
                step={1000}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Mô Tả Cụm Pool
            </label>
            <Input
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Ghi chú về SLA, đối tượng phục vụ, chính sách fallback..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Huỷ Bỏ
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu vào DB...' : editingPool ? 'Cập Nhật Cụm Pool' : 'Tạo Cụm Pool'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServicePoolPage;
