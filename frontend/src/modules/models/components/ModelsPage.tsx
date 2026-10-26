import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineCalculator,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

export interface ModelCatalogItem {
  id: string;
  name: string;
  modelCode: string;
  category: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ';
  provider: string;
  costPerReqOr1kTok: number; // in USD cents (e.g. 0.5 cent)
  sellingCreditPrice: number; // in Credits (1 credit = 1 VND)
  isActive: boolean;
  poolId: string;
}

const initialModels: ModelCatalogItem[] = [
  // 1. Modal Chat
  {
    id: 'm_chat_1',
    name: 'OpenAI GPT-4o Omni',
    modelCode: 'gpt-4o',
    category: 'CHAT',
    provider: 'OpenAI',
    costPerReqOr1kTok: 0.5, // 0.005 USD ~ 125 VND
    sellingCreditPrice: 250, // 250 credit -> Profit margin ~ 50%
    isActive: true,
    poolId: 'pool_openai_01',
  },
  {
    id: 'm_chat_2',
    name: 'Claude 3.5 Sonnet',
    modelCode: 'claude-3-5-sonnet-20241022',
    category: 'CHAT',
    provider: 'Anthropic',
    costPerReqOr1kTok: 0.6,
    sellingCreditPrice: 320,
    isActive: true,
    poolId: 'pool_openai_01',
  },
  {
    id: 'm_chat_3',
    name: 'DeepSeek-V3 Reasoning',
    modelCode: 'deepseek-chat',
    category: 'CHAT',
    provider: 'DeepSeek',
    costPerReqOr1kTok: 0.08,
    sellingCreditPrice: 80,
    isActive: true,
    poolId: 'pool_openai_01',
  },

  // 2. Modal Tạo Ảnh
  {
    id: 'm_img_1',
    name: 'Midjourney v6 Photoreal',
    modelCode: 'midjourney-v6',
    category: 'IMAGE',
    provider: 'Midjourney',
    costPerReqOr1kTok: 1.2, // ~ 300 VND
    sellingCreditPrice: 800, // 800 credit
    isActive: true,
    poolId: 'pool_midjourney_01',
  },
  {
    id: 'm_img_2',
    name: 'OpenAI DALL-E 3 HD',
    modelCode: 'dall-e-3',
    category: 'IMAGE',
    provider: 'OpenAI',
    costPerReqOr1kTok: 4.0, // ~ 1000 VND
    sellingCreditPrice: 2000,
    isActive: true,
    poolId: 'pool_openai_01',
  },

  // 3. Modal Tạo Video
  {
    id: 'm_vid_1',
    name: 'Runway Gen-3 Alpha Video',
    modelCode: 'gen-3-alpha',
    category: 'VIDEO',
    provider: 'Runway',
    costPerReqOr1kTok: 10.0, // ~ 2500 VND
    sellingCreditPrice: 6000, // 6000 credit
    isActive: true,
    poolId: 'pool_runway_01',
  },
  {
    id: 'm_vid_2',
    name: 'Luma Dream Machine Video',
    modelCode: 'luma-dream-v1',
    category: 'VIDEO',
    provider: 'Runway',
    costPerReqOr1kTok: 8.0,
    sellingCreditPrice: 5000,
    isActive: true,
    poolId: 'pool_luma_01',
  },

  // 4. Modal Req Chạy Cho Dev
  {
    id: 'm_dev_1',
    name: 'Claude Code Automated Engine',
    modelCode: 'claude-code-agent',
    category: 'DEV_REQ',
    provider: 'Anthropic',
    costPerReqOr1kTok: 1.5,
    sellingCreditPrice: 1500,
    isActive: true,
    poolId: 'pool_openai_01',
  },
  {
    id: 'm_dev_2',
    name: 'Cursor AI Backend Engine',
    modelCode: 'cursor-backend-agent',
    category: 'DEV_REQ',
    provider: 'OpenAI',
    costPerReqOr1kTok: 1.0,
    sellingCreditPrice: 1000,
    isActive: true,
    poolId: 'pool_openai_01',
  },
];

const categoryTabs = [
  { key: 'ALL', label: 'Tất Cả Models' },
  { key: 'CHAT', label: '1. Modal Chat' },
  { key: 'IMAGE', label: '2. Modal Tạo Ảnh' },
  { key: 'VIDEO', label: '3. Modal Tạo Video' },
  { key: 'DEV_REQ', label: '4. Modal Req Cho Dev' },
];

const ModelsPage = () => {
  const [models, setModels] = useState<ModelCatalogItem[]>(() => {
    const saved = localStorage.getItem('velox_models');
    return saved ? JSON.parse(saved) : initialModels;
  });

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelCatalogItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<ModelCatalogItem['category']>('CHAT');
  const [formProvider, setFormProvider] = useState('OpenAI');
  const [formCost, setFormCost] = useState(0.5);
  const [formPrice, setFormPrice] = useState(250);

  const saveModels = (updated: ModelCatalogItem[]) => {
    setModels(updated);
    localStorage.setItem('velox_models', JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setEditingModel(null);
    setFormName('');
    setFormCode('');
    setFormCategory('CHAT');
    setFormProvider('OpenAI');
    setFormCost(0.5);
    setFormPrice(250);
    setShowModal(true);
  };

  const handleOpenEdit = (m: ModelCatalogItem) => {
    setEditingModel(m);
    setFormName(m.name);
    setFormCode(m.modelCode);
    setFormCategory(m.category);
    setFormProvider(m.provider);
    setFormCost(m.costPerReqOr1kTok);
    setFormPrice(m.sellingCreditPrice);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingModel) {
      const updated = models.map((m) =>
        m.id === editingModel.id
          ? {
              ...m,
              name: formName,
              modelCode: formCode,
              category: formCategory,
              provider: formProvider,
              costPerReqOr1kTok: Number(formCost),
              sellingCreditPrice: Number(formPrice),
            }
          : m
      );
      saveModels(updated);
    } else {
      const newModel: ModelCatalogItem = {
        id: `model_${Date.now()}`,
        name: formName,
        modelCode: formCode,
        category: formCategory,
        provider: formProvider,
        costPerReqOr1kTok: Number(formCost),
        sellingCreditPrice: Number(formPrice),
        isActive: true,
        poolId: 'pool_openai_01',
      };
      saveModels([...models, newModel]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xoá model này khỏi danh mục hệ thống?')) {
      saveModels(models.filter((m) => m.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    const updated = models.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    saveModels(updated);
  };

  // Profit Margin Calculator: (SellingPriceVND - CostVND) / SellingPriceVND
  const calculateMargin = (costCents: number, priceCredits: number) => {
    const costVnd = costCents * 250; // 1 cent ~ 250 VND
    const margin = ((priceCredits - costVnd) / priceCredits) * 100;
    return Math.max(0, Math.round(margin));
  };

  const filtered = models.filter((m) => {
    const matchesTab = activeTab === 'ALL' || m.category === activeTab;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.modelCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={styles.moduleContainer}>
      {/* Category Tabs according to handwritten note */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === tab.key ? '1px solid #6366f1' : '1px solid #27272a',
              backgroundColor: activeTab === tab.key ? 'rgba(99,102,241,0.12)' : '#18181b',
              color: activeTab === tab.key ? '#6366f1' : '#a1a1aa',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm model theo mã hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.actionButtonGroup}>
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <HiOutlinePlus size={16} /> Thêm Model AI Mới
          </Button>
        </div>
      </div>

      {/* Main Table: Model Catalog & Pricing & Profit Margin Balancing */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3>Bảng Định Giá & Cân Bằng Biên Lợi Nhuận Model</h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Quy đổi chi phí token gốc nhà cung cấp vs giá bán credit thu từ user
            </span>
          </div>
          <span className={styles.countBadge}>{filtered.length} Models Khả Dụng</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>Model Name & Code</th>
              <th>Nhóm Phân Loại</th>
              <th>Nhà Cung Cấp</th>
              <th>Chi Phí Gốc NCC (Ước tính)</th>
              <th>Giá Bán Thu (Credit / Req)</th>
              <th>Biên Lợi Nhuận Gộp</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const margin = calculateMargin(m.costPerReqOr1kTok, m.sellingCreditPrice);
              return (
                <tr key={m.id}>
                  <td>
                    <div>
                      <strong style={{ color: '#fafafa', display: 'block' }}>{m.name}</strong>
                      <code style={{ fontSize: '0.75rem', color: '#6366f1' }}>{m.modelCode}</code>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor:
                          m.category === 'CHAT'
                            ? 'rgba(99,102,241,0.12)'
                            : m.category === 'IMAGE'
                            ? 'rgba(16,185,129,0.12)'
                            : m.category === 'VIDEO'
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(139,92,246,0.12)',
                        color:
                          m.category === 'CHAT'
                            ? '#6366f1'
                            : m.category === 'IMAGE'
                            ? '#10b981'
                            : m.category === 'VIDEO'
                            ? '#f59e0b'
                            : '#8b5cf6',
                      }}
                    >
                      {m.category}
                    </span>
                  </td>
                  <td>{m.provider}</td>
                  <td>
                    <span style={{ color: '#71717a' }}>
                      ~{Math.round(m.costPerReqOr1kTok * 250)} ₫ ({m.costPerReqOr1kTok}¢)
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#10b981' }}>{m.sellingCreditPrice.toLocaleString()} Credits</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontWeight: 700,
                        color: margin > 50 ? '#10b981' : margin > 30 ? '#f59e0b' : '#f43f5e',
                      }}
                    >
                      <HiOutlineCalculator size={14} /> +{margin}% Lãi
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggle(m.id)}
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 9999,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: m.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                        color: m.isActive ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {m.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.actionEdit}`}
                        onClick={() => handleOpenEdit(m)}
                        title="Đổi giá / cấu hình"
                      >
                        <HiOutlinePencilSquare size={17} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconActionBtn} ${styles.actionDelete}`}
                        onClick={() => handleDelete(m.id)}
                        title="Xoá model"
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

      {/* Modal: Thêm / Sửa Model & Định giá */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{editingModel ? 'Điều Chỉnh Định Giá Model' : 'Thêm Model Mới Vào Hệ Thống'}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Tên Hiển Thị Model</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Midjourney v6"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Mã Model Gọi API (Model Identifier)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: midjourney-v6"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label>Nhóm Model Nghiệp Vụ (Theo tài liệu yêu cầu)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ModelCatalogItem['category'])}
                  >
                    <option value="CHAT">1. Modal Chat (Văn bản)</option>
                    <option value="IMAGE">2. Modal Tạo Ảnh</option>
                    <option value="VIDEO">3. Modal Tạo Video</option>
                    <option value="DEV_REQ">4. Modal Req Cho Dev (Code Agent)</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Nhà Cung Cấp (Provider)</label>
                  <input
                    type="text"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    placeholder="VD: OpenAI, Anthropic, Midjourney, Runway"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formField}>
                    <label>Chi Phí Gốc NCC (Cents USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCost}
                      onChange={(e) => setFormCost(Number(e.target.value))}
                      required
                    />
                    <span className={styles.hint}>VD: 0.5 cent ~ 125 VND</span>
                  </div>

                  <div className={styles.formField}>
                    <label>Giá Bán Thu User (Credits / Req)</label>
                    <input
                      type="number"
                      step="1"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      required
                    />
                    <span className={styles.hint}>1 Credit = 1 VND</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    padding: '0.75rem',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Dự kiến Biên Lợi Nhuận Gộp:{' '}
                  <strong>+{calculateMargin(formCost, formPrice)}% Lãi</strong>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit">
                  Lưu Model & Giá Bán
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsPage;
