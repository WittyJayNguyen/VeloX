import { useState } from 'react';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCalculator } from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { Tabs } from '@modules/core/design-system/Tabs';
import { SearchInput } from '@modules/core/design-system/Components';

export interface ModelCatalogItem {
  id: string; name: string; modelCode: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ';
  provider: string; costPerReqOr1kTok: number; sellingCreditPrice: number;
  isActive: boolean; poolId: string;
}

const initialModels: ModelCatalogItem[] = [
  { id: 'm_chat_1', name: 'OpenAI GPT-4o Omni', modelCode: 'gpt-4o', category: 'CHAT', provider: 'OpenAI', costPerReqOr1kTok: 0.5, sellingCreditPrice: 250, isActive: true, poolId: 'pool_openai_01' },
  { id: 'm_chat_2', name: 'Claude 3.5 Sonnet', modelCode: 'claude-3-5-sonnet-20241022', category: 'CHAT', provider: 'Anthropic', costPerReqOr1kTok: 0.6, sellingCreditPrice: 320, isActive: true, poolId: 'pool_openai_01' },
  { id: 'm_chat_3', name: 'DeepSeek-V3 Reasoning', modelCode: 'deepseek-chat', category: 'CHAT', provider: 'DeepSeek', costPerReqOr1kTok: 0.08, sellingCreditPrice: 80, isActive: true, poolId: 'pool_openai_01' },
  { id: 'm_img_1', name: 'DALL-E 3 HD', modelCode: 'dall-e-3', category: 'IMAGE', provider: 'OpenAI', costPerReqOr1kTok: 4.0, sellingCreditPrice: 2000, isActive: true, poolId: 'pool_openai_01' },
  { id: 'm_img_2', name: 'Midjourney v6.1', modelCode: 'midjourney-v6', category: 'IMAGE', provider: 'Midjourney', costPerReqOr1kTok: 3.2, sellingCreditPrice: 1600, isActive: true, poolId: 'pool_mj_01' },
  { id: 'm_vid_1', name: 'Runway Gen-3 Alpha Turbo', modelCode: 'gen3-alpha-turbo', category: 'VIDEO', provider: 'Runway', costPerReqOr1kTok: 10.0, sellingCreditPrice: 6000, isActive: true, poolId: 'pool_runway_01' },
  { id: 'm_vid_2', name: 'Luma Dream Machine Video', modelCode: 'luma-dream-v1', category: 'VIDEO', provider: 'Runway', costPerReqOr1kTok: 8.0, sellingCreditPrice: 5000, isActive: true, poolId: 'pool_luma_01' },
  { id: 'm_dev_1', name: 'Claude Code Automated Engine', modelCode: 'claude-code-agent', category: 'DEV_REQ', provider: 'Anthropic', costPerReqOr1kTok: 1.5, sellingCreditPrice: 1500, isActive: true, poolId: 'pool_openai_01' },
  { id: 'm_dev_2', name: 'Cursor AI Backend Engine', modelCode: 'cursor-backend-agent', category: 'DEV_REQ', provider: 'OpenAI', costPerReqOr1kTok: 1.0, sellingCreditPrice: 1000, isActive: true, poolId: 'pool_openai_01' },
];

const catBadge = (c: string) => c === 'CHAT' ? 'primary' : c === 'IMAGE' ? 'success' : c === 'VIDEO' ? 'warning' : 'info' as const;
const CATEGORY_OPTIONS = [{ value: 'CHAT', label: 'Chat' }, { value: 'IMAGE', label: 'Image' }, { value: 'VIDEO', label: 'Video' }, { value: 'DEV_REQ', label: 'Dev Req' }];
const PROVIDER_OPTIONS = ['OpenAI', 'Anthropic', 'DeepSeek', 'Midjourney', 'Runway', 'Google', 'Stability'].map((p) => ({ value: p, label: p }));

const ModelsPage = () => {
  const [models, setModels] = useState<ModelCatalogItem[]>(() => { const s = localStorage.getItem('velox_models'); return s ? JSON.parse(s) : initialModels; });
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelCatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<ModelCatalogItem['category']>('CHAT');
  const [formProvider, setFormProvider] = useState('OpenAI');
  const [formCost, setFormCost] = useState(0.5);
  const [formPrice, setFormPrice] = useState(250);

  const saveModels = (u: ModelCatalogItem[]) => { setModels(u); localStorage.setItem('velox_models', JSON.stringify(u)); };

  const handleOpenAdd = () => { setEditingModel(null); setFormName(''); setFormCode(''); setFormCategory('CHAT'); setFormProvider('OpenAI'); setFormCost(0.5); setFormPrice(250); setShowModal(true); };
  const handleOpenEdit = (m: ModelCatalogItem) => { setEditingModel(m); setFormName(m.name); setFormCode(m.modelCode); setFormCategory(m.category); setFormProvider(m.provider); setFormCost(m.costPerReqOr1kTok); setFormPrice(m.sellingCreditPrice); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;
    if (editingModel) {
      saveModels(models.map((m) => m.id === editingModel.id ? { ...m, name: formName, modelCode: formCode, category: formCategory, provider: formProvider, costPerReqOr1kTok: Number(formCost), sellingCreditPrice: Number(formPrice) } : m));
    } else {
      saveModels([...models, { id: `model_${Date.now()}`, name: formName, modelCode: formCode, category: formCategory, provider: formProvider, costPerReqOr1kTok: Number(formCost), sellingCreditPrice: Number(formPrice), isActive: true, poolId: 'pool_openai_01' }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm('Xoá model này?')) saveModels(models.filter((m) => m.id !== id)); };
  const handleToggle = (id: string) => saveModels(models.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));

  const calcMargin = (cost: number, price: number) => { const costVnd = cost * 250; return Math.max(0, Math.round(((price - costVnd) / price) * 100)); };

  const filtered = models.filter((m) => {
    const matchTab = activeTab === 'ALL' || m.category === activeTab;
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.modelCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  const columns: TableColumn<ModelCatalogItem>[] = [
    { key: 'name', header: 'Tên Model & Code', render: (m) => (<div><strong style={{ color: '#fafafa' }}>{m.name}</strong><div style={{ fontSize: '0.7rem', color: '#71717a' }}><code>{m.modelCode}</code></div></div>) },
    { key: 'category', header: 'Danh Mục', render: (m) => <Badge variant={catBadge(m.category)} size="sm">{m.category}</Badge> },
    { key: 'provider', header: 'Provider', render: (m) => <span style={{ fontWeight: 600 }}>{m.provider}</span> },
    { key: 'costPerReqOr1kTok', header: 'Giá Gốc (¢)', align: 'right', render: (m) => <span style={{ color: '#f43f5e' }}>{m.costPerReqOr1kTok}¢</span> },
    { key: 'sellingCreditPrice', header: 'Giá Bán (cr)', align: 'right', render: (m) => <strong style={{ color: '#10b981' }}>{m.sellingCreditPrice.toLocaleString()} cr</strong> },
    { key: 'margin', header: 'Biên Lợi Nhuận', align: 'center', render: (m) => { const margin = calcMargin(m.costPerReqOr1kTok, m.sellingCreditPrice); return <Badge variant={margin >= 50 ? 'success' : margin >= 30 ? 'warning' : 'danger'} size="sm"><HiOutlineCalculator size={12} /> {margin}%</Badge>; } },
    { key: 'isActive', header: 'Trạng Thái', render: (m) => <Badge variant={m.isActive ? 'success' : 'neutral'} size="sm" dot><button type="button" onClick={() => handleToggle(m.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }}>{m.isActive ? 'Active' : 'Off'}</button></Badge> },
    { key: 'actions', header: 'Thao Tác', align: 'center', render: (m) => (<div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}><Button variant="ghost" size="sm" onClick={() => handleOpenEdit(m)}><HiOutlinePencilSquare size={16} /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}><HiOutlineTrash size={16} /></Button></div>) },
  ];

  const tabContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <SearchInput placeholder="Tìm model..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
          <Button variant="primary" size="md" onClick={handleOpenAdd}><HiOutlinePlus size={16} /> Thêm Model</Button>
        </div>
      </Card>
      <Card title={`Danh Mục Models (${activeTab === 'ALL' ? 'Tất Cả' : activeTab})`} subtitle={`${filtered.length} models`} padding="none">
        <Table columns={columns} data={filtered} rowKey={(m) => m.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Tabs variant="pill" items={[
        { key: 'ALL', label: 'Tất Cả', content: tabContent },
        { key: 'CHAT', label: '💬 Chat', content: tabContent },
        { key: 'IMAGE', label: '🖼️ Image', content: tabContent },
        { key: 'VIDEO', label: '🎬 Video', content: tabContent },
        { key: 'DEV_REQ', label: '💻 Dev Req', content: tabContent },
      ]} defaultKey="ALL" onChange={(k) => { setActiveTab(k); setPage(1); }} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingModel ? 'Cập Nhật Model' : 'Thêm Model Mới'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button><Button variant="primary" onClick={handleSave}>Lưu</Button></>}
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Tên Model" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="GPT-4o" required fullWidth />
          <Input label="Model Code" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="gpt-4o" required fullWidth />
          <Select label="Danh Mục" options={CATEGORY_OPTIONS} value={formCategory} onChange={(e) => setFormCategory(e.target.value as ModelCatalogItem['category'])} fullWidth />
          <Select label="Provider" options={PROVIDER_OPTIONS} value={formProvider} onChange={(e) => setFormProvider(e.target.value)} fullWidth />
          <Input label="Giá Gốc (cents)" type="number" step="0.01" value={formCost} onChange={(e) => setFormCost(Number(e.target.value))} fullWidth />
          <Input label="Giá Bán (credits)" type="number" value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))} fullWidth />
        </form>
      </Modal>
    </div>
  );
};

export default ModelsPage;
