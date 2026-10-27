import { useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineKey, HiOutlineSignal } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput } from '@modules/core/design-system/Components';

export interface PoolKeyItem { id: string; name: string; keyVal: string; recapToken?: string; isActive: boolean; requestsCount: number; detectedModels: string[]; }
export interface PoolItem { id: string; name: string; provider: 'OpenAI' | 'Anthropic' | 'Midjourney' | 'Runway' | 'DeepSeek' | 'Google'; authType: 'API_KEY' | 'TOKEN_ACCOUNT'; routingStrategy: 'ROUND_ROBIN' | 'LEAST_USED' | 'WEIGHTED'; keys: PoolKeyItem[]; isActive: boolean; rateLimitPerMin: number; }

const initialPools: PoolItem[] = [
  { id: 'pool_openai_01', name: 'OpenAI Enterprise Key Pool', provider: 'OpenAI', authType: 'API_KEY', routingStrategy: 'ROUND_ROBIN', isActive: true, rateLimitPerMin: 1000,
    keys: [
      { id: 'k_oai_1', name: 'OpenAI Pro Key #1', keyVal: 'sk-proj-9818...abc4', isActive: true, requestsCount: 14205, detectedModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'] },
      { id: 'k_oai_2', name: 'OpenAI Team Key #2', keyVal: 'sk-proj-7712...xy89', isActive: true, requestsCount: 9840, detectedModels: ['gpt-4o', 'dall-e-3'] },
    ],
  },
  { id: 'pool_anthropic_01', name: 'Anthropic Claude Key Pool', provider: 'Anthropic', authType: 'API_KEY', routingStrategy: 'LEAST_USED', isActive: true, rateLimitPerMin: 600,
    keys: [{ id: 'k_ant_1', name: 'Anthropic Main Key', keyVal: 'sk-ant-aa12...zz34', isActive: true, requestsCount: 6780, detectedModels: ['claude-3-5-sonnet', 'claude-3-haiku'] }],
  },
  { id: 'pool_mj_01', name: 'Midjourney Token Pool', provider: 'Midjourney', authType: 'TOKEN_ACCOUNT', routingStrategy: 'ROUND_ROBIN', isActive: true, rateLimitPerMin: 200,
    keys: [{ id: 'k_mj_1', name: 'MJ Account #1', keyVal: 'tok_mj_889a...f3c1', recapToken: 'recap_2cap_xxx', isActive: true, requestsCount: 3120, detectedModels: ['midjourney-v6'] }],
  },
];

export const getPoolsFromStorage = (): PoolItem[] => { const s = localStorage.getItem('velox_pools'); return s ? JSON.parse(s) : initialPools; };
export const savePoolsToStorage = (p: PoolItem[]) => localStorage.setItem('velox_pools', JSON.stringify(p));

const PROVIDER_OPTIONS = ['OpenAI', 'Anthropic', 'Midjourney', 'Runway', 'DeepSeek', 'Google'].map((p) => ({ value: p, label: p }));
const AUTH_OPTIONS = [{ value: 'API_KEY', label: 'API Key' }, { value: 'TOKEN_ACCOUNT', label: 'Token Account' }];
const ROUTING_OPTIONS = [{ value: 'ROUND_ROBIN', label: 'Round Robin' }, { value: 'LEAST_USED', label: 'Least Used' }, { value: 'WEIGHTED', label: 'Weighted' }];

const ServicePoolPage = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Pool Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPool, setEditingPool] = useState<PoolItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('OpenAI');
  const [formAuth, setFormAuth] = useState<PoolItem['authType']>('API_KEY');
  const [formRouting, setFormRouting] = useState<PoolItem['routingStrategy']>('ROUND_ROBIN');
  const [formRateLimit, setFormRateLimit] = useState(1000);

  const savePools = (u: PoolItem[]) => { setPools(u); savePoolsToStorage(u); };

  const handleOpenAdd = () => { setEditingPool(null); setFormName(''); setFormProvider('OpenAI'); setFormAuth('API_KEY'); setFormRouting('ROUND_ROBIN'); setFormRateLimit(1000); setShowModal(true); };
  const handleOpenEdit = (p: PoolItem) => { setEditingPool(p); setFormName(p.name); setFormProvider(p.provider); setFormAuth(p.authType); setFormRouting(p.routingStrategy); setFormRateLimit(p.rateLimitPerMin); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (editingPool) { savePools(pools.map((p) => p.id === editingPool.id ? { ...p, name: formName, provider: formProvider as PoolItem['provider'], authType: formAuth, routingStrategy: formRouting, rateLimitPerMin: formRateLimit } : p)); }
    else { savePools([...pools, { id: `pool_${Date.now()}`, name: formName, provider: formProvider as PoolItem['provider'], authType: formAuth, routingStrategy: formRouting, isActive: true, rateLimitPerMin: formRateLimit, keys: [] }]); }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm('Xoá pool này?')) savePools(pools.filter((p) => p.id !== id)); };
  const handleToggle = (id: string) => savePools(pools.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));

  const filtered = pools.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const columns: TableColumn<PoolItem>[] = [
    { key: 'name', header: 'Pool Name', render: (p) => (<div><strong style={{ color: '#fafafa' }}>{p.name}</strong><div style={{ fontSize: '0.7rem', color: '#71717a' }}>{p.id}</div></div>) },
    { key: 'provider', header: 'Provider', render: (p) => <Badge variant="primary" size="sm">{p.provider}</Badge> },
    { key: 'authType', header: 'Auth', render: (p) => <Badge variant={p.authType === 'API_KEY' ? 'info' : 'warning'} size="sm">{p.authType}</Badge> },
    { key: 'routingStrategy', header: 'Routing', render: (p) => <span style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>{p.routingStrategy}</span> },
    { key: 'keys', header: 'Keys', align: 'center', render: (p) => <Badge variant="neutral" size="md"><HiOutlineKey size={12} /> {p.keys.length}</Badge> },
    { key: 'rateLimitPerMin', header: 'Rate Limit', align: 'right', render: (p) => <span style={{ fontWeight: 600, color: '#f59e0b' }}>{p.rateLimitPerMin}/min</span> },
    { key: 'isActive', header: 'Trạng Thái', render: (p) => <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm" dot><button type="button" onClick={() => handleToggle(p.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }}>{p.isActive ? 'Active' : 'Off'}</button></Badge> },
    { key: 'actions', header: 'Thao Tác', align: 'center', render: (p) => (<div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}><Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}><HiOutlinePencilSquare size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><HiOutlineTrash size={16} /></Button></div>) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <SearchInput placeholder="Tìm pool..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" size="md" onClick={() => navigate('/admin/keys')}><HiOutlineKey size={16} /> Quản Lý Keys</Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}><HiOutlinePlus size={16} /> Thêm Pool</Button>
          </div>
        </div>
      </Card>

      <Card title="Quản Lý Service Pools" subtitle={`${filtered.length} pools`} headerRight={<HiOutlineSignal size={20} style={{ color: '#6366f1' }} />} padding="none">
        <Table columns={columns} data={filtered} rowKey={(p) => p.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingPool ? 'Cập Nhật Pool' : 'Thêm Pool Mới'} size="md"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSave}>Lưu</Button></>}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên Pool" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="OpenAI Main Pool" required fullWidth />
          <Select label="Provider" options={PROVIDER_OPTIONS} value={formProvider} onChange={(e) => setFormProvider(e.target.value)} fullWidth />
          <Select label="Loại Xác Thực" options={AUTH_OPTIONS} value={formAuth} onChange={(e) => setFormAuth(e.target.value as PoolItem['authType'])} fullWidth />
          <Select label="Chiến Lược Routing" options={ROUTING_OPTIONS} value={formRouting} onChange={(e) => setFormRouting(e.target.value as PoolItem['routingStrategy'])} fullWidth />
          <Input label="Rate Limit (/phút)" type="number" value={formRateLimit} onChange={(e) => setFormRateLimit(Number(e.target.value))} fullWidth />
        </form>
      </Modal>
    </div>
  );
};

export default ServicePoolPage;
