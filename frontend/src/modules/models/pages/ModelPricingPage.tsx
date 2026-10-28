import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineBanknotes,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineBolt,
  HiOutlineAdjustmentsHorizontal,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineInformationCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { Card } from '@modules/core/design-system/Card';
import Button from '@modules/core/design-system/Button';
import { Badge } from '@modules/core/design-system/Badge';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { modelService, type ModelCatalogItem } from '../services/modelService';
import styles from '@assets/scss/modules/model-pricing.module.scss';

const catBadge = (c: string) =>
  c === 'CHAT' ? 'primary' : c === 'IMAGE' ? 'success' : c === 'VIDEO' ? 'warning' : 'info' as const;

const CATEGORY_TABS = [
  { id: 'ALL', label: 'Tất Cả' },
  { id: 'CHAT', label: 'Chat LLMs' },
  { id: 'IMAGE', label: 'Image Models' },
  { id: 'VIDEO', label: 'Video Models' },
  { id: 'DEV_REQ', label: 'Dev Req / Code' },
];

export const ModelPricingPage: React.FC = () => {
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'margin_desc' | 'margin_asc' | 'selling_desc' | 'name_asc'>('margin_desc');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, providerFilter, searchTerm, sortBy]);

  // Bulk Markup Toolbar
  const [bulkPercent, setBulkPercent] = useState<number>(30);
  const [bulkCategory, setBulkCategory] = useState<string>('ALL');
  const [bulkProvider, setBulkProvider] = useState<string>('ALL');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Edit Single Model Pricing Modal
  const [editingModel, setEditingModel] = useState<ModelCatalogItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingSingle, setSavingSingle] = useState(false);

  // Modal Form State
  const [formInCost, setFormInCost] = useState<number>(0);
  const [formOutCost, setFormOutCost] = useState<number>(0);
  const [formCacheCost, setFormCacheCost] = useState<number>(0);
  const [formReqCost, setFormReqCost] = useState<number>(0);

  const [formInSell, setFormInSell] = useState<number>(0);
  const [formOutSell, setFormOutSell] = useState<number>(0);
  const [formCacheSell, setFormCacheSell] = useState<number>(0);
  const [formSellingCredit, setFormSellingCredit] = useState<number>(0);
  const [formQuickMargin, setFormQuickMargin] = useState<number>(30);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await modelService.getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to load models for pricing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Provider list for filter
  const providerList = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.provider) set.add(m.provider);
    });
    return Array.from(set).sort();
  }, [models]);

  // Handle Open Edit Modal
  const handleOpenEdit = (m: ModelCatalogItem) => {
    setEditingModel(m);
    setFormInCost(m.input_cost_per_1m ?? 0);
    setFormOutCost(m.output_cost_per_1m ?? 0);
    setFormCacheCost(m.cache_read_cost_per_1m ?? 0);
    setFormReqCost(m.cost_per_req_or_1k_tok ?? 0);

    setFormInSell(m.input_credit_price ?? 0);
    setFormOutSell(m.output_credit_price ?? 0);
    setFormCacheSell(m.cache_read_credit_price ?? 0);
    setFormSellingCredit(m.selling_credit_price ?? 0);

    // Calculate initial quick margin %
    const cost = (m.input_cost_per_1m && m.input_cost_per_1m > 0) ? m.input_cost_per_1m : (m.cost_per_req_or_1k_tok || 1);
    const sell = (m.input_credit_price && m.input_credit_price > 0) ? m.input_credit_price : (m.selling_credit_price || 1);
    const estMargin = cost > 0 ? Math.round(((sell - cost) / cost) * 100) : 30;
    setFormQuickMargin(estMargin > 0 ? estMargin : 30);

    setModalOpen(true);
  };

  // Quick apply margin to form (VeloX Standard: 1 Credit = 100 VNĐ)
  const applyMarginToForm = (marginPct: number) => {
    const mult = 1.0 + (marginPct / 100.0);
    setFormQuickMargin(marginPct);
    const inCr = formInCost > 50 ? Math.max(1, Math.round((formInCost * mult) / 100)) : Math.round(formInCost * mult);
    const outCr = formOutCost > 50 ? Math.max(1, Math.round((formOutCost * mult) / 100)) : Math.round(formOutCost * mult);
    const cacheCr = formCacheCost > 50 ? Math.max(1, Math.round((formCacheCost * mult) / 100)) : Math.round(formCacheCost * mult);
    setFormInSell(inCr);
    setFormOutSell(outCr);
    setFormCacheSell(cacheCr);

    const baseReq = formReqCost || (formInCost > 0 ? (formInCost + formOutCost) / 2000 : 1);
    const reqCr = baseReq > 50 ? Math.max(1, Math.round((baseReq * mult) / 100)) : Math.max(1, Math.round(baseReq * mult));
    setFormSellingCredit(reqCr);
  };

  // Save single model pricing
  const handleSaveSinglePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    setSavingSingle(true);
    try {
      await modelService.updateModelPricing(editingModel.id, {
        input_cost_per_1m: formInCost,
        output_cost_per_1m: formOutCost,
        cache_read_cost_per_1m: formCacheCost,
        cost_per_req_or_1k_tok: formReqCost,
        input_credit_price: formInSell,
        output_credit_price: formOutSell,
        cache_read_credit_price: formCacheSell,
        selling_credit_price: formSellingCredit,
      });
      setModalOpen(false);
      await fetchModels();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu bảng giá model');
    } finally {
      setSavingSingle(false);
    }
  };

  // Handle Bulk Markup
  const handleApplyBulkMarkup = async () => {
    if (bulkPercent <= 0) {
      alert('Vui lòng nhập tỷ lệ % lợi nhuận lớn hơn 0%');
      return;
    }
    const targetLabel = bulkCategory === 'ALL' && bulkProvider === 'ALL'
      ? 'tất cả models'
      : `models thuộc ${bulkCategory !== 'ALL' ? `Danh mục ${bulkCategory}` : ''} ${bulkProvider !== 'ALL' ? `Provider ${bulkProvider}` : ''}`;

    if (!window.confirm(`Bạn có chắc muốn áp dụng mức lời +${bulkPercent}% cho ${targetLabel}? Giá bán ra sẽ được cập nhật và áp dụng tức thời cho API Keys và tài khoản khách.`)) {
      return;
    }

    setBulkLoading(true);
    setBulkSuccessMsg(null);
    try {
      const res = await modelService.bulkMarkup({
        markup_percent: bulkPercent,
        category: bulkCategory,
        provider: bulkProvider,
      });
      setBulkSuccessMsg(res.message);
      await fetchModels();
      setTimeout(() => setBulkSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi áp dụng biên lợi nhuận hàng loạt');
    } finally {
      setBulkLoading(false);
    }
  };

  // Filtered & Sorted models
  const processedModels = useMemo(() => {
    const list = models.filter((m) => {
      const matchTab = activeTab === 'ALL' || m.category === activeTab;
      const matchProv = providerFilter === 'ALL' || m.provider === providerFilter;
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.model_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchProv && matchSearch;
    });

    list.sort((a, b) => {
      const marginA = a.profit_margin_pct ?? 0;
      const marginB = b.profit_margin_pct ?? 0;
      const sellA = a.selling_price_vnd ?? a.selling_credit_price ?? 0;
      const sellB = b.selling_price_vnd ?? b.selling_credit_price ?? 0;

      if (sortBy === 'margin_desc') return marginB - marginA;
      if (sortBy === 'margin_asc') return marginA - marginB;
      if (sortBy === 'selling_desc') return sellB - sellA;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [models, activeTab, providerFilter, searchTerm, sortBy]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.is_available).length;
    let sumMargin = 0;
    let validCount = 0;
    let highestMarginModel = models[0];
    let maxMargin = -999;

    models.forEach((m) => {
      const margin = m.profit_margin_pct ?? 0;
      if (m.cost_price_vnd && m.cost_price_vnd > 0) {
        sumMargin += margin;
        validCount++;
      }
      if (margin > maxMargin) {
        maxMargin = margin;
        highestMarginModel = m;
      }
    });

    const avgMargin = validCount > 0 ? Math.round(sumMargin / validCount) : 30;

    return {
      total,
      active,
      avgMargin,
      topModel: highestMarginModel,
      topMargin: maxMargin > -999 ? maxMargin : 0,
    };
  }, [models]);

  // Table Columns (2 Main Columns: Giá Gốc Model vs Giá Bán Ra)
  const columns: TableColumn<ModelCatalogItem>[] = [
    {
      key: 'model_info',
      header: 'Model & Danh Mục',
      width: '260px',
      render: (m) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>{m.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <code style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>
              {m.model_code}
            </code>
            <Badge variant={catBadge(m.category)} size="sm">
              {m.category}
            </Badge>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>
            Provider: <strong style={{ color: '#cbd5e1' }}>{m.provider}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'cost_price_column',
      header: 'CỘT 1: GIÁ GỐC MODEL (NCC)',
      width: '280px',
      render: (m) => {
        const inCost = m.input_cost_per_1m ?? 0;
        const outCost = m.output_cost_per_1m ?? 0;
        const cacheCost = m.cache_read_cost_per_1m ?? 0;
        const reqCost = m.cost_per_req_or_1k_tok ?? 0;

        const isMedia = m.category === 'IMAGE' || m.category === 'VIDEO';

        if (isMedia || (inCost === 0 && outCost === 0 && reqCost > 0)) {
          return (
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 8,
              padding: '8px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gốc mỗi lượt:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                  {Math.round(reqCost).toLocaleString()} ₫
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                Chi phí vốn nhà cung cấp
              </div>
            </div>
          );
        }

        if (inCost === 0 && outCost === 0) {
          return (
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px dashed rgba(148, 163, 184, 0.2)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: '#34d399'
            }}>
              Session Web (0 ₫) / Không tốn token
            </div>
          );
        }

        return (
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Đầu vào (1M):</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{Math.round(inCost).toLocaleString()} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Đầu ra (1M):</span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>{Math.round(outCost).toLocaleString()} ₫</span>
            </div>
            {cacheCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đã cache:</span>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>{Math.round(cacheCost).toLocaleString()} ₫</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'selling_price_column',
      header: 'CỘT 2: GIÁ BÁN RA (KHÁCH HÀNG)',
      width: '280px',
      render: (m) => {
        const inSell = m.input_credit_price ?? 0;
        const outSell = m.output_credit_price ?? 0;
        const cacheSell = m.cache_read_credit_price ?? 0;
        const sellCredit = m.selling_credit_price ?? 0;

        const isMedia = m.category === 'IMAGE' || m.category === 'VIDEO';

        if (isMedia || (inSell === 0 && outSell === 0 && sellCredit > 0)) {
          return (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 8,
              padding: '8px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Giá bán / lượt:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                  {sellCredit.toLocaleString()} Credits
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#6ee7b7', marginTop: 2 }}>
                Áp dụng cho API key & tài khoản
              </div>
            </div>
          );
        }

        return (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a7f3d0' }}>Bán Vào (1M):</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{Math.round(inSell).toLocaleString()} cr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a7f3d0' }}>Bán Ra (1M):</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{Math.round(outSell).toLocaleString()} cr</span>
            </div>
            {cacheSell > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a7f3d0' }}>Bán Cache:</span>
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>{Math.round(cacheSell).toLocaleString()} cr</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'profit_margin_column',
      header: 'LỢI NHUẬN & BIÊN LỜI',
      width: '200px',
      render: (m) => {
        const rawMargin = m.profit_margin_pct ?? 0;
        const profit = m.profit_vnd ?? 0;
        const isPositive = rawMargin >= 0;
        // Cap excessive margin (> 100%) to clean 100% (Pool nội bộ / Sàn 1💎)
        const displayMargin = rawMargin > 100 ? 100 : (rawMargin > 0 ? Number(rawMargin.toFixed(1)) : 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: '0.78rem',
                background: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: isPositive ? '#34d399' : '#f87171',
                border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                <HiOutlineArrowTrendingUp size={14} />
                +{displayMargin}% Lời
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Chênh lệch: <strong style={{ color: '#f8fafc' }}>+{Math.round(profit > 0 ? profit : 0).toLocaleString()}</strong> đ
            </div>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Thao Tác',
      align: 'center',
      width: '120px',
      render: (m) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenEdit(m)}
          title="Chỉnh sửa giá gốc và giá bán cho model này"
        >
          <HiOutlinePencilSquare size={14} style={{ marginRight: 4 }} />
          Sửa Giá
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HiOutlineBanknotes size={26} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>
                Cấu Hình Bảng Giá & Lợi Nhuận AI Models
              </h1>
              <p className={styles.headerSubtitle}>
                So sánh và định giá giữa <strong style={{ color: '#38bdf8' }}>Giá Gốc Model (NCC)</strong> và{' '}
                <strong style={{ color: '#34d399' }}>Giá Bán Ra (Khách Hàng)</strong>. Tự động áp dụng khi khách gọi API hệ thống hoặc dùng qua tài khoản đã đăng ký.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchModels}
            title="Làm mới bảng giá"
          >
            <HiOutlineArrowPath className={loading ? 'spin' : ''} size={16} style={{ marginRight: 4 }} />
            Tải Lại
          </Button>

          <div className={styles.headerBadge}>
            <HiOutlineShieldCheck size={16} />
            Khớp Trực Tiếp API & Tài Khoản
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className={styles.statsGrid}>
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>TỔNG SỐ MODELS ĐỊNH GIÁ</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                {stats.total} <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 500 }}>({stats.active} Active)</span>
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <HiOutlineAdjustmentsHorizontal size={24} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: 8 }}>
            Tất cả models đều có bảng giá 2 cột rõ ràng
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>TỶ LỆ LỜI BÌNH QUÂN</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                +{stats.avgMargin}%
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <HiOutlineArrowTrendingUp size={24} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: 8 }}>
            Giá bán ra cao hơn giá gốc NCC để sinh lợi nhuận
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>QUY ĐỔI THANH TOÁN</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#c084fc', marginTop: 6 }}>
                1 Credit = 1 VNĐ
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc' }}>
              <HiOutlineSparkles size={24} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 8 }}>
            Khách nạp tiền qua Ngân hàng / Thẻ tự động trừ theo giá bán
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>MODEL LỜI CAO NHẤT</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                {stats.topModel ? stats.topModel.name : 'Chưa có'}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <HiOutlineBolt size={24} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: 8 }}>
            Biên lợi nhuận: +{stats.topMargin}%
          </div>
        </Card>
      </div>

      {/* Bulk Margin Toolbar */}
      <div className={styles.bulkToolbar}>
        <div className={styles.bulkHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <HiOutlineBolt size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>
                CÔNG CỤ THIẾT LẬP TỶ LỆ LỜI HÀNG LOẠT (BULK PROFIT MARKUP)
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Tự động lấy <strong>Giá Gốc Model</strong> nhân theo tỷ lệ % lời để cập nhật sang <strong>Giá Bán Ra</strong>.
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className={styles.bulkPresets}>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: 4, whiteSpace: 'nowrap' }}>Mức nhanh:</span>
            {[30, 50, 60, 70, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setBulkPercent(pct)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: bulkPercent === pct ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  background: bulkPercent === pct ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: bulkPercent === pct ? '#34d399' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                +{pct}%
              </button>
            ))}
          </div>
        </div>

        <div className={styles.bulkControls}>
          <div className={styles.bulkInputGroup}>
            <span style={{ fontSize: '13px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>Tỷ lệ lời (%):</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={bulkPercent}
              onChange={(e) => setBulkPercent(Number(e.target.value))}
              style={{
                width: 90,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#0f172a',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                fontSize: '14px',
                fontWeight: 700,
                outline: 'none',
              }}
            />
          </div>

          <div className={styles.bulkSelectCategory}>
            <Select
              noMargin
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả danh mục' },
                { value: 'CHAT', label: 'Chỉ Chat' },
                { value: 'IMAGE', label: 'Chỉ Image' },
                { value: 'VIDEO', label: 'Chỉ Video' },
                { value: 'DEV_REQ', label: 'Chỉ Dev Req' },
              ]}
            />
          </div>

          <div className={styles.bulkSelectProvider}>
            <Select
              noMargin
              value={bulkProvider}
              onChange={(e) => setBulkProvider(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả Provider' },
                ...providerList.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleApplyBulkMarkup}
            disabled={bulkLoading}
            className={styles.bulkButton}
          >
            {bulkLoading ? 'Đang cập nhật...' : `Áp Dụng +${bulkPercent}% Lời`}
          </Button>

          {bulkSuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#34d399',
              fontSize: '13px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '6px 12px',
              borderRadius: 8
            }}>
              <HiOutlineCheck size={16} />
              {bulkSuccessMsg}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div style={{ marginBottom: 16 }}>
        <Card padding="sm">
          <div className={styles.filterBar}>
            {/* Category Tabs */}
            <div className={styles.categoryTabsNav}>
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: activeTab === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                    background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search, Provider Filter, Sort */}
            <div className={styles.filterControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Tìm model, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px 7px 32px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <HiOutlineMagnifyingGlass size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }} />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    <HiOutlineXMark size={14} />
                  </button>
                )}
              </div>

              <div className={styles.filterSelect}>
                <Select
                  noMargin
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'Tất cả Provider' },
                    ...providerList.map((p) => ({ value: p, label: p })),
                  ]}
                />
              </div>

              <div className={styles.sortSelect}>
                <Select
                  noMargin
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  options={[
                    { value: 'margin_desc', label: 'Lời cao nhất' },
                    { value: 'margin_asc', label: 'Lời thấp nhất' },
                    { value: 'selling_desc', label: 'Giá bán cao nhất' },
                    { value: 'name_asc', label: 'Tên Model A-Z' },
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Comparison Table */}
      <Card padding="none">
        <Table<ModelCatalogItem>
          columns={columns}
          data={processedModels}
          rowKey={(m) => m.id}
          loading={loading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyText="Không tìm thấy model nào phù hợp với bộ lọc."
        />
      </Card>

      {/* Modal Chỉnh Sửa Chi Tiết Giá Gốc & Giá Bán */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Chỉnh Sửa Bảng Giá & Lợi Nhuận: ${editingModel?.name || ''}`}
        size="lg"
      >
        {editingModel && (
          <form onSubmit={handleSaveSinglePricing} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Model Info Header */}
            <div className={styles.modalHeaderBox}>
              <div>
                <strong style={{ fontSize: '15px', color: '#f8fafc' }}>{editingModel.name}</strong>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Code: <code>{editingModel.model_code}</code> | Provider: <strong>{editingModel.provider}</strong>
                </div>
              </div>
              <Badge variant={catBadge(editingModel.category)} size="md">
                {editingModel.category}
              </Badge>
            </div>

            {/* Quick Profit Calculator */}
            <div className={styles.modalCalculator}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiOutlineBolt size={20} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                    Áp dụng tỷ lệ lời nhanh cho model này
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Tự động tính Giá Bán Ra theo Giá Gốc x (1 + % lời)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {[15, 25, 30, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyMarginToForm(pct)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: formQuickMargin === pct ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: formQuickMargin === pct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: formQuickMargin === pct ? '#34d399' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Comparison Layout */}
            <div className={styles.modalGrid}>
              {/* CỘT 1: GIÁ GỐC (NCC) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                  <strong style={{ color: '#38bdf8', fontSize: '14px' }}>CỘT 1: GIÁ GỐC MODEL (NCC)</strong>
                </div>

                {editingModel.category === 'IMAGE' || editingModel.category === 'VIDEO' ? (
                  <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                      Giá gốc mỗi request / kết xuất (VNĐ):
                    </label>
                    <Input
                      type="number"
                      value={formReqCost}
                      onChange={(e) => setFormReqCost(Number(e.target.value))}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                        Đầu vào (VNĐ / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formInCost}
                        onChange={(e) => setFormInCost(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                        Đầu ra (VNĐ / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formOutCost}
                        onChange={(e) => setFormOutCost(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                        Đã cache (VNĐ / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formCacheCost}
                        onChange={(e) => setFormCacheCost(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* CỘT 2: GIÁ BÁN RA (KHÁCH HÀNG) */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <strong style={{ color: '#10b981', fontSize: '14px' }}>CỘT 2: GIÁ BÁN RA (KHÁCH HÀNG)</strong>
                </div>

                {editingModel.category === 'IMAGE' || editingModel.category === 'VIDEO' ? (
                  <div>
                    <label style={{ fontSize: '12px', color: '#a7f3d0', display: 'block', marginBottom: 6 }}>
                      Giá bán mỗi request / kết xuất (Credits):
                    </label>
                    <Input
                      type="number"
                      value={formSellingCredit}
                      onChange={(e) => setFormSellingCredit(Number(e.target.value))}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a7f3d0', display: 'block', marginBottom: 6 }}>
                        Bán Đầu vào (Credits / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formInSell}
                        onChange={(e) => setFormInSell(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a7f3d0', display: 'block', marginBottom: 6 }}>
                        Bán Đầu ra (Credits / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formOutSell}
                        onChange={(e) => setFormOutSell(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#a7f3d0', display: 'block', marginBottom: 6 }}>
                        Bán Đã cache (Credits / 1M Tokens):
                      </label>
                      <Input
                        type="number"
                        value={formCacheSell}
                        onChange={(e) => setFormCacheSell(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Note & Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '12px' }}>
              <HiOutlineInformationCircle size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span>
                Giá bán ra sẽ được áp dụng trực tiếp khi khách hàng gọi API qua Developer Keys (OpenAI compatible) và khi tài khoản người dùng sử dụng mô hình trên hệ thống.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Hủy Bỏ
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={savingSingle}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  fontWeight: 700
                }}
              >
                {savingSingle ? 'Đang lưu...' : 'Lưu Thay Đổi Bảng Giá'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ModelPricingPage;
