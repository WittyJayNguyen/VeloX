import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineCodeBracket,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineKey,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineListBullet,
  HiOutlineRectangleStack,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { Tabs } from '@modules/core/design-system/Tabs';
import { SearchInput } from '@modules/core/design-system/Components';
import { modelService, type ModelCatalogItem } from '../services/modelService';
import { poolService, type PoolItem, type PoolKeyItem } from '@modules/pools/services/poolService';

export type { ModelCatalogItem };

const catBadge = (c: string) =>
  c === 'CHAT' ? 'primary' : c === 'IMAGE' ? 'success' : c === 'VIDEO' ? 'warning' : 'info' as const;

const CATEGORY_OPTIONS = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'DEV_REQ', label: 'Dev Req' },
];

const PROVIDER_OPTIONS = ['OpenAI', 'Anthropic', 'DeepSeek', 'Midjourney', 'Runway', 'Google', 'Stability'].map(
  (p) => ({ value: p, label: p })
);

const ModelsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyParam = searchParams.get('key') || 'ALL';

  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [keys, setKeys] = useState<PoolKeyItem[]>([]);
  const [pools, setPools] = useState<PoolItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState(initialKeyParam);
  const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED'>('LIST');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});

  // Sync if URL search param changes
  useEffect(() => {
    const kParam = searchParams.get('key') || 'ALL';
    setSelectedKeyFilter(kParam);
  }, [searchParams]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelCatalogItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<ModelCatalogItem['category']>('CHAT');
  const [formProvider, setFormProvider] = useState('OpenAI');
  const [formInputCost, setFormInputCost] = useState(62500);
  const [formOutputCost, setFormOutputCost] = useState(250000);
  const [formCacheCost, setFormCacheCost] = useState(31250);

  // Selling prices (Giá Bán Ra)
  const [formInSell, setFormInSell] = useState(81250);
  const [formOutSell, setFormOutSell] = useState(325000);
  const [formCacheSell, setFormCacheSell] = useState(40625);
  const [formSellingPrice, setFormSellingPrice] = useState(250);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modelService.getModels();
      setModels(data);
    } catch (err: any) {
      console.error('Failed to load models:', err);
      setError(err?.response?.data?.detail || 'Không thể tải danh mục AI Models từ database');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKeysAndPools = useCallback(async () => {
    try {
      const [kData, pData] = await Promise.all([
        poolService.getPoolKeys(),
        poolService.getPools(),
      ]);
      setKeys(kData);
      setPools(pData);
    } catch (err) {
      console.error('Failed to load keys/pools in ModelsPage:', err);
    }
  }, []);

  const handleSyncFromKeys = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await modelService.syncFromKeys();
      setSyncMessage(res.message);
      await Promise.all([fetchModels(), fetchKeysAndPools()]);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi đồng bộ models');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchKeysAndPools();
  }, [fetchModels, fetchKeysAndPools]);

  // Mappings
  const poolMap = useMemo(() => new Map(pools.map((p) => [p.id, p])), [pools]);

  const modelToKeys = useMemo(() => {
    const map = new Map<string, PoolKeyItem[]>();
    keys.forEach((k) => {
      (k.detected_models || []).forEach((mCode) => {
        const list = map.get(mCode) || [];
        list.push(k);
        map.set(mCode, list);
      });
    });
    return map;
  }, [keys]);

  const toggleExpandKey = (keyId: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [keyId]: prev[keyId] !== undefined ? !prev[keyId] : false,
    }));
  };

  const isKeyExpanded = (keyId: string) => expandedKeys[keyId] ?? true;

  const handleOpenAdd = () => {
    setEditingModel(null);
    setFormName('');
    setFormCode('');
    setFormCategory('CHAT');
    setFormProvider('OpenAI');
    setFormInputCost(62500);
    setFormOutputCost(250000);
    setFormCacheCost(31250);
    setFormInSell(81250);
    setFormOutSell(325000);
    setFormCacheSell(40625);
    setFormSellingPrice(250);
    setShowModal(true);
  };

  const handleOpenEdit = (m: ModelCatalogItem) => {
    setEditingModel(m);
    setFormName(m.name);
    setFormCode(m.model_code);
    setFormCategory(m.category);
    setFormProvider(m.provider);
    const inC = m.input_cost_per_1m ?? 0;
    const outC = m.output_cost_per_1m ?? 0;
    const cacheC = m.cache_read_cost_per_1m ?? 0;
    setFormInputCost(inC);
    setFormOutputCost(outC);
    setFormCacheCost(cacheC);
    setFormInSell(m.input_credit_price ?? Math.round(inC * 1.3));
    setFormOutSell(m.output_credit_price ?? Math.round(outC * 1.3));
    setFormCacheSell(m.cache_read_credit_price ?? Math.round(cacheC * 1.3));
    setFormSellingPrice(m.selling_credit_price ?? 250);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    setSaving(true);
    try {
      const inCost = Number(formInputCost);
      const outCost = Number(formOutputCost);
      const cacheCost = Number(formCacheCost);
      const inSell = Number(formInSell);
      const outSell = Number(formOutSell);
      const cacheSell = Number(formCacheSell);
      const sellPrice = Number(formSellingPrice);

      const payload: Partial<ModelCatalogItem> = {
        name: formName,
        model_code: formCode,
        category: formCategory,
        provider: formProvider,
        cost_per_req_or_1k_tok: inCost > 0 ? inCost / 1000 : 0,
        selling_credit_price: sellPrice > 0 ? sellPrice : (inSell > 0 ? Math.max(1, Math.round((inSell + outSell) / 2000)) : 250),
        input_cost_per_1m: inCost,
        output_cost_per_1m: outCost,
        cache_read_cost_per_1m: cacheCost,
        input_credit_price: inSell,
        output_credit_price: outSell,
        cache_read_credit_price: cacheSell,
      };

      if (editingModel) {
        await modelService.updateModel(editingModel.id, payload);
      } else {
        await modelService.createModel({
          ...payload,
          is_available: true,
        });
      }

      setShowModal(false);
      await fetchModels();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu Model');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá model này khỏi catalog?')) {
      try {
        await modelService.deleteModel(id);
        await fetchModels();
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Không thể xoá model');
      }
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await modelService.toggleModel(id);
      await fetchModels();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không thể đổi trạng thái model');
    }
  };

  const filtered = useMemo(() => {
    return models.filter((m) => {
      const matchTab = activeTab === 'ALL' || m.category === activeTab;
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchTerm.toLowerCase());

      let matchKey = true;
      if (selectedKeyFilter !== 'ALL') {
        const targetKey = keys.find((k) => k.id === selectedKeyFilter);
        if (targetKey) {
          matchKey =
            (targetKey.detected_models || []).includes(m.model_code) ||
            m.pool_id === targetKey.pool_id;
        }
      }
      return matchTab && matchSearch && matchKey;
    });
  }, [models, activeTab, searchTerm, selectedKeyFilter, keys]);

  // Grouping for Grouped View
  const groupedData = useMemo(() => {
    const activeKeysList =
      selectedKeyFilter !== 'ALL'
        ? keys.filter((k) => k.id === selectedKeyFilter)
        : keys;

    const groups = activeKeysList.map((k) => {
      const keyModelCodes = new Set(k.detected_models || []);
      const keyModels = filtered.filter(
        (m) => keyModelCodes.has(m.model_code) || m.pool_id === k.pool_id
      );
      return {
        key: k,
        pool: poolMap.get(k.pool_id),
        models: keyModels,
      };
    });

    let unassignedModels: ModelCatalogItem[] = [];
    if (selectedKeyFilter === 'ALL') {
      unassignedModels = filtered.filter((m) => {
        const provKeys = modelToKeys.get(m.model_code) || [];
        return provKeys.length === 0;
      });
    }

    return { groups, unassignedModels };
  }, [keys, selectedKeyFilter, filtered, poolMap, modelToKeys]);

  const columns: TableColumn<ModelCatalogItem>[] = [
    {
      key: 'name',
      header: 'Tên Model & Code',
      render: (m) => (
        <div>
          <strong style={{ color: '#fafafa' }}>{m.name}</strong>
          <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
            <code>{m.model_code}</code>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Danh Mục',
      render: (m) => (
        <Badge variant={catBadge(m.category)} size="sm">
          {m.category}
        </Badge>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (m) => <span style={{ fontWeight: 600 }}>{m.provider}</span>,
    },
    {
      key: 'key_providers',
      header: 'API Key / Cụm Pool',
      render: (m) => {
        const provKeys = modelToKeys.get(m.model_code) || [];
        if (provKeys.length === 0) {
          return <span style={{ color: '#71717a', fontSize: '0.72rem' }}>Chưa gán Key</span>;
        }
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            {provKeys.map((k) => (
              <span key={k.id} title={`Cụm Pool: ${poolMap.get(k.pool_id)?.name || 'N/A'}`}>
                <Badge
                  variant={k.status === 'ACTIVE' ? 'primary' : 'neutral'}
                  size="sm"
                >
                  {k.name}
                </Badge>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'token_pricing',
      header: 'Giá Token NCC (VNĐ / 1M)',
      render: (m) => {
        const inCost = m.input_cost_per_1m ?? 0;
        const outCost = m.output_cost_per_1m ?? 0;
        const cacheCost = m.cache_read_cost_per_1m ?? 0;

        if (inCost === 0 && outCost === 0 && cacheCost === 0) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Badge variant="success" size="sm">
                Web Session (0 ₫)
              </Badge>
              <span style={{ fontSize: '0.68rem', color: '#71717a' }}>
                Bao gói không tính phí token
              </span>
            </div>
          );
        }

        return (
          <div style={{ fontSize: '0.74rem', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Đầu vào:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{Math.round(inCost).toLocaleString()} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Đầu ra:</span>
              <span style={{ color: '#f43f5e', fontWeight: 600 }}>{Math.round(outCost).toLocaleString()} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Đã cache:</span>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>{Math.round(cacheCost).toLocaleString()} ₫</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'selling_pricing',
      header: 'Giá Bán Ra & Lời (Credits)',
      render: (m) => {
        const inSell = m.input_credit_price ?? 0;
        const outSell = m.output_credit_price ?? 0;
        const sellCredit = m.selling_credit_price ?? 0;
        const margin = m.profit_margin_pct ?? 0;

        if (m.category === 'IMAGE' || m.category === 'VIDEO' || (inSell === 0 && outSell === 0 && sellCredit > 0)) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>
                  {sellCredit.toLocaleString()} cr
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontWeight: 600
                }}>
                  +{margin}% Lời
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>Áp dụng API & Web</span>
            </div>
          );
        }

        return (
          <div style={{ fontSize: '0.74rem', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#a7f3d0' }}>Bán Vào:</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{Math.round(inSell).toLocaleString()} cr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#a7f3d0' }}>Bán Ra:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{Math.round(outSell).toLocaleString()} cr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#94a3b8' }}>Biên lời:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>+{margin}% Lời</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'is_available',
      header: 'Trạng Thái',
      render: (m) => (
        <Badge variant={m.is_available ? 'success' : 'neutral'} size="sm" dot>
          <button
            type="button"
            onClick={() => handleToggle(m.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          >
            {m.is_available ? 'Active' : 'Off'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (m) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(m)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
            <HiOutlineTrash size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const keyFilterOptions = [
    { value: 'ALL', label: 'Tất Cả Keys / Pools' },
    ...keys.map((k) => ({
      value: k.id,
      label: `${k.name} (${poolMap.get(k.pool_id)?.name || 'Pool'} — ${k.detected_models?.length || 0} models)`,
    })),
  ];

  const tabContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search, Filter & Switcher Card */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 280px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', minWidth: '150px', display: 'flex', alignItems: 'center' }}>
              <SearchInput
                placeholder="Tìm model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
              />
            </div>

            {/* Filter Dropdown API Key */}
            <div style={{ flex: '1 1 200px', minWidth: '160px', display: 'flex', alignItems: 'center' }}>
              <Select
                noMargin
                value={selectedKeyFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedKeyFilter(val);
                  setPage(1);
                  if (val === 'ALL') {
                    searchParams.delete('key');
                  } else {
                    searchParams.set('key', val);
                  }
                  setSearchParams(searchParams);
                }}
                options={keyFilterOptions}
              />
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', height: '36px', background: '#18181b', borderRadius: '8px', padding: '3px', border: '1px solid #27272a', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'LIST' ? '#27272a' : 'transparent',
                  color: viewMode === 'LIST' ? '#fafafa' : '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="Xem toàn bộ catalog dạng bảng phẳng"
              >
                <HiOutlineListBullet size={15} /> Bảng Danh Sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode('GROUPED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'GROUPED' ? '#27272a' : 'transparent',
                  color: viewMode === 'GROUPED' ? '#fafafa' : '#a1a1aa',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="Gom nhóm models theo từng API Key / Provider"
              >
                <HiOutlineRectangleStack size={15} /> Gom Nhóm Theo Key
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={handleSyncFromKeys}
              disabled={syncing || loading}
              title="Quét toàn bộ keys trong hệ thống và tự động nạp models vào catalog"
            >
              <HiOutlineSparkles size={16} style={{ color: '#818cf8' }} className={syncing ? 'spin' : ''} />
              {syncing ? 'Đang Đồng Bộ...' : 'Đồng Bộ Từ Keys'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                fetchModels();
                fetchKeysAndPools();
              }}
              disabled={loading}
            >
              <HiOutlineArrowPath size={16} className={loading ? 'spin' : ''} />
              Làm Mới
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/model-pricing')}
              style={{
                borderColor: '#10b981',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Mở Bảng Giá & Lợi Nhuận (So sánh 2 cột Giá Gốc vs Giá Bán Ra)"
            >
              <HiOutlineBanknotes size={16} /> Bảng Giá & Lợi Nhuận
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              <HiOutlinePlus size={16} /> Thêm Model
            </Button>
          </div>
        </div>
      </Card>

      {syncMessage && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HiOutlineCheck size={16} />
          {syncMessage}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* RENDER VIEW MODE */}
      {viewMode === 'LIST' ? (
        <Card
          title={`Danh Mục Models (${activeTab === 'ALL' ? 'Tất Cả' : activeTab})`}
          subtitle={`${filtered.length} models ${selectedKeyFilter !== 'ALL' ? '• Đang lọc theo Key' : ''}`}
          padding="none"
        >
          <Table
            columns={columns}
            data={filtered}
            rowKey={(m) => m.id}
            page={page}
            pageSize={10}
            onPageChange={setPage}
            emptyText={loading ? 'Đang tải dữ liệu từ database...' : 'Không có model nào phù hợp'}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedData.groups.map(({ key: k, pool, models: kModels }) => {
            const expanded = isKeyExpanded(k.id);
            const kPage = groupPages[k.id] || 1;
            return (
              <div key={k.id} style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <Card padding="none">
                  <div
                    onClick={() => toggleExpandKey(k.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      background: '#18181b',
                      cursor: 'pointer',
                      borderBottom: expanded ? '1px solid #27272a' : 'none',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <HiOutlineKey size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ color: '#fafafa', fontSize: '0.95rem' }}>{k.name}</strong>
                          <Badge variant="info" size="sm">
                            {pool?.name || 'Pool'}
                          </Badge>
                          <Badge variant={k.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                            {k.status}
                          </Badge>
                          <Badge variant="purple" size="sm">
                            {k.plan_badge}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#a1a1aa', marginTop: 2 }}>
                          Provider: <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{pool?.provider || 'Custom'}</span> | Ưu tiên: <span style={{ color: '#fbbf24', fontWeight: 600 }}>P{k.priority}</span> | Quota ngày: {k.quota_daily_used.toLocaleString()} / {k.quota_daily.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Badge variant="primary" size="md">
                        {kModels.length} models
                      </Badge>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a1a1aa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {expanded ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div>
                      {kModels.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>
                          Không có model nào khớp với bộ lọc ({activeTab !== 'ALL' ? activeTab : 'hiện tại'}) trong Key này.
                        </div>
                      ) : (
                        <Table
                          columns={columns.filter((c) => c.key !== 'key_providers')}
                          data={kModels}
                          rowKey={(m) => `${k.id}-${m.id}`}
                          page={kPage}
                          pageSize={10}
                          onPageChange={(p) => setGroupPages((prev) => ({ ...prev, [k.id]: p }))}
                          emptyText="Không có model nào"
                        />
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}

          {groupedData.unassignedModels.length > 0 && (
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px dashed #3f3f46' }}>
              <Card padding="none">
                <div
                  onClick={() => toggleExpandKey('unassigned')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    background: '#121215',
                    cursor: 'pointer',
                    borderBottom: isKeyExpanded('unassigned') ? '1px solid #27272a' : 'none',
                  }}
                >
                  <div>
                    <strong style={{ color: '#e4e4e7', fontSize: '0.95rem' }}>Models Chưa Gán API Key Nào</strong>
                    <div style={{ fontSize: '0.74rem', color: '#71717a' }}>
                      Các model trong catalog hiện chưa được liên kết với bất kỳ key đang hoạt động nào
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Badge variant="neutral" size="md">
                      {groupedData.unassignedModels.length} models
                    </Badge>
                    {isKeyExpanded('unassigned') ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                  </div>
                </div>

                {isKeyExpanded('unassigned') && (
                  <Table
                    columns={columns.filter((c) => c.key !== 'key_providers')}
                    data={groupedData.unassignedModels}
                    rowKey={(m) => `unassigned-${m.id}`}
                    pageSize={10}
                    emptyText="Không có model nào"
                  />
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Tabs
        variant="pill"
        items={[
          { key: 'ALL', label: 'Tất Cả', content: tabContent },
          { key: 'CHAT', label: 'Chat', icon: <HiOutlineChatBubbleLeftRight size={15} />, content: tabContent },
          { key: 'IMAGE', label: 'Image', icon: <HiOutlinePhoto size={15} />, content: tabContent },
          { key: 'VIDEO', label: 'Video', icon: <HiOutlineFilm size={15} />, content: tabContent },
          { key: 'DEV_REQ', label: 'Dev Req', icon: <HiOutlineCodeBracket size={15} />, content: tabContent },
        ]}
        defaultKey="ALL"
        onChange={(k) => {
          setActiveTab(k);
          setPage(1);
        }}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingModel ? 'Cập Nhật Model' : 'Thêm Model Mới'}
        size="lg"
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Input
            label="Tên Model"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="GPT-4o"
            required
            fullWidth
          />
          <Input
            label="Model Code"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            placeholder="gpt-4o"
            required
            fullWidth
          />
          <Select
            label="Danh Mục"
            options={CATEGORY_OPTIONS}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as ModelCatalogItem['category'])}
            fullWidth
          />
          <Select
            label="Provider"
            options={PROVIDER_OPTIONS}
            value={formProvider}
            onChange={(e) => setFormProvider(e.target.value)}
            fullWidth
          />
          {/* CỘT 1: GIÁ GỐC */}
          <div style={{ gridColumn: '1 / -1', padding: '0.85rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>CỘT 1: GIÁ GỐC MODEL NCC (VNĐ / 1M Tokens)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <Input
                label="Đầu Vào Gốc (VNĐ/1M)"
                type="number"
                step="1"
                value={formInputCost}
                onChange={(e) => setFormInputCost(Number(e.target.value))}
                placeholder="62500"
              />
              <Input
                label="Đầu Ra Gốc (VNĐ/1M)"
                type="number"
                step="1"
                value={formOutputCost}
                onChange={(e) => setFormOutputCost(Number(e.target.value))}
                placeholder="250000"
              />
              <Input
                label="Đã Cache Gốc (VNĐ/1M)"
                type="number"
                step="1"
                value={formCacheCost}
                onChange={(e) => setFormCacheCost(Number(e.target.value))}
                placeholder="31250"
              />
            </div>
          </div>

          {/* CỘT 2: GIÁ BÁN RA */}
          <div style={{ gridColumn: '1 / -1', padding: '0.85rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>CỘT 2: GIÁ BÁN RA KHÁCH HÀNG (Credits / 1M Tokens - Có Lời)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <Input
                label="Bán Đầu Vào (Credits/1M)"
                type="number"
                step="1"
                value={formInSell}
                onChange={(e) => setFormInSell(Number(e.target.value))}
                placeholder="81250"
              />
              <Input
                label="Bán Đầu Ra (Credits/1M)"
                type="number"
                step="1"
                value={formOutSell}
                onChange={(e) => setFormOutSell(Number(e.target.value))}
                placeholder="325000"
              />
              <Input
                label="Bán Cache (Credits/1M)"
                type="number"
                step="1"
                value={formCacheSell}
                onChange={(e) => setFormCacheSell(Number(e.target.value))}
                placeholder="40625"
              />
              <Input
                label="Bán / Request (Credits)"
                type="number"
                step="1"
                value={formSellingPrice}
                onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                placeholder="250"
              />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6 }}>
              Giá bán ra sẽ được tự động trừ vào tài khoản khách hàng khi gọi API qua Secret Key hoặc dùng trên web.
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ModelsPage;
