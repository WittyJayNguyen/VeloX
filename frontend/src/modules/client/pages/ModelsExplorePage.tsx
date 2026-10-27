import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineCodeBracket,
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlineServerStack,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import styles from '@assets/scss/client/client-pages.module.scss';

export const ModelsExplorePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') || 'ALL').toUpperCase();

  const [models, setModels] = useState<PublicModelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        setLoading(true);
        const data = await modelService.getPublicModels();
        if (isMounted) {
          setModels(data || []);
        }
      } catch (err) {
        console.error('Failed to load public models catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unique providers
  const providers = useMemo(() => {
    const list = Array.from(new Set(models.map((m) => m.provider))).filter(Boolean);
    return ['ALL', ...list];
  }, [models]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchCategory =
        filterCategory === 'ALL' ||
        m.category?.toUpperCase() === filterCategory.toUpperCase() ||
        (filterCategory === 'CHAT' && m.category?.toLowerCase() === 'chat') ||
        (filterCategory === 'IMAGE' && m.category?.toLowerCase() === 'image') ||
        (filterCategory === 'VIDEO' && m.category?.toLowerCase() === 'video');

      const matchProvider = selectedProvider === 'ALL' || m.provider === selectedProvider;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.model_code.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q));

      return matchCategory && matchProvider && matchSearch;
    });
  }, [models, filterCategory, selectedProvider, searchQuery]);

  const getCategoryIcon = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'CHAT') return <HiOutlineChatBubbleLeftRight size={16} color="#10a37f" />;
    if (cat === 'IMAGE') return <HiOutlinePhoto size={16} color="#38bdf8" />;
    if (cat === 'VIDEO') return <HiOutlineFilm size={16} color="#c084fc" />;
    return <HiOutlineCodeBracket size={16} color="#f59e0b" />;
  };

  const getProviderColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('openai')) return '#10a37f';
    if (p.includes('anthropic') || p.includes('claude')) return '#d97706';
    if (p.includes('deepseek')) return '#0ea5e9';
    if (p.includes('google') || p.includes('gemini')) return '#3b82f6';
    if (p.includes('midjourney')) return '#ec4899';
    if (p.includes('black forest') || p.includes('flux')) return '#8b5cf6';
    if (p.includes('runway') || p.includes('luma')) return '#f97316';
    return '#38bdf8';
  };

  const mapCategoryToStudioParam = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'IMAGE') return 'image';
    if (cat === 'VIDEO') return 'video';
    return 'chat';
  };

  return (
    <div className={styles.clientContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <RiOpenaiFill size={30} color="#ff6b35" />
            </span>
            {t('models_page.title', 'Thư Viện Mô Hình AI (AI Models Catalog)')}
          </h1>
          <p>{t('models_page.subtitle', 'Khám phá hơn 100+ mô hình AI thế hệ mới nhất cho Chat, Tạo Ảnh và Video với bảng giá Credit minh bạch và chi phí tối ưu')}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/studio')}
          >
            <HiOutlineSparkles /> {t('studio.open_full_studio', 'Mở Studio Sáng Tạo')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.contentCard} style={{ padding: '1.1rem 1.35rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={filterCategory === 'ALL' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
              onClick={() => setFilterCategory('ALL')}
            >
              {t('models_page.all', 'Tất Cả')} ({models.length})
            </button>
            <button
              type="button"
              className={filterCategory === 'CHAT' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('CHAT')}
            >
              <HiOutlineChatBubbleLeftRight size={15} color="#10a37f" /> {t('models_page.category_chat', 'Chat & Ngôn Ngữ')} ({models.filter((m) => m.category?.toUpperCase() === 'CHAT').length})
            </button>
            <button
              type="button"
              className={filterCategory === 'IMAGE' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('IMAGE')}
            >
              <HiOutlinePhoto size={15} color="#38bdf8" /> {t('models_page.category_image', 'Tạo Ảnh')} ({models.filter((m) => m.category?.toUpperCase() === 'IMAGE').length})
            </button>
            <button
              type="button"
              className={filterCategory === 'VIDEO' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('VIDEO')}
            >
              <HiOutlineFilm size={15} color="#c084fc" /> {t('models_page.category_video', 'Tạo Video')} ({models.filter((m) => m.category?.toUpperCase() === 'VIDEO').length})
            </button>
          </div>

          {/* Provider Select & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {providers.length > 2 && (
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                style={{
                  background: '#0d121c',
                  border: '1px solid #243048',
                  color: '#cbd5e1',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.84rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Nhà cung cấp: Tất cả</option>
                {providers.filter((p) => p !== 'ALL').map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d121c', border: '1px solid #243048', padding: '0.4rem 0.85rem', borderRadius: '10px' }}>
              <HiOutlineMagnifyingGlass color="#94a3b8" />
              <input
                type="text"
                placeholder={t('models_page.search_placeholder', 'Tìm theo tên mô hình, mã model...')}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.86rem', width: '220px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          <HiOutlineArrowPath className="animate-spin" size={32} style={{ margin: '0 auto 1rem', display: 'block', color: '#ff6b35' }} />
          <p>{t('models_page.loading', 'Đang tải danh sách mô hình từ hệ thống...')}</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className={styles.contentCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <HiOutlineServerStack size={40} color="#64748b" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>{t('models_page.no_models_found', 'Không tìm thấy mô hình nào phù hợp')}</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Hãy thử điều chỉnh từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
        </div>
      ) : (
        /* Models Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredModels.map((model) => {
            const providerColor = getProviderColor(model.provider);
            const isMedia = model.category === 'IMAGE' || model.category === 'VIDEO';

            return (
              <div
                key={model.id}
                className={styles.contentCard}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: 0,
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.9) 0%, rgba(13, 18, 28, 0.95) 100%)',
                  borderRadius: '16px',
                  padding: '1.35rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  {/* Top Bar: Provider & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: providerColor,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          background: `${providerColor}18`,
                          border: `1px solid ${providerColor}35`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {model.provider}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                        {getCategoryIcon(model.category)}
                        {model.category}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: model.is_available ? '#22c55e' : '#ef4444',
                        background: model.is_available ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        padding: '2px 7px',
                        borderRadius: '999px',
                      }}
                    >
                      <HiOutlineCheckCircle size={12} />
                      {model.is_available ? t('models_page.active', 'Sẵn Sàng') : t('models_page.maintenance', 'Bảo Trì')}
                    </span>
                  </div>

                  {/* Title & Code */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {model.name}
                  </h3>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748b', marginBottom: '0.75rem', background: '#090d15', padding: '3px 7px', borderRadius: '4px', display: 'inline-block' }}>
                    {model.model_code}
                  </div>

                  {/* Description */}
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem', minHeight: '40px' }}>
                    {model.description || 'Mô hình trí tuệ nhân tạo hiệu năng cao được tinh chỉnh tối ưu trên hạ tầng VeloX Gateway.'}
                  </p>

                  {/* Credit Pricing Breakdown (Customer Selling Price only, strictly excludes supplier cost) */}
                  <div
                    style={{
                      background: 'rgba(9, 13, 21, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {isMedia ? (
                      /* Media: Image / Video Pricing */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <HiOutlineBolt size={14} color="#ff6b35" />
                          {model.category === 'IMAGE' ? t('models_page.per_image', 'Mỗi ảnh') : t('models_page.per_video', 'Mỗi video')}
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2dd4bf' }}>
                          {model.selling_credit_price ? `${model.selling_credit_price.toLocaleString()} cr` : 'Miễn phí'}
                        </span>
                      </div>
                    ) : (
                      /* Text & Code: Token-based & Cache Pricing */
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {t('models_page.input_tokens', 'Input Tokens')}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0' }}>
                            {model.input_credit_price ? `${model.input_credit_price.toLocaleString()} cr ${t('models_page.per_1m', '/ 1M')}` : t('models_page.free', 'Miễn phí')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {t('models_page.output_tokens', 'Output Tokens')}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0' }}>
                            {model.output_credit_price ? `${model.output_credit_price.toLocaleString()} cr ${t('models_page.per_1m', '/ 1M')}` : t('models_page.free', 'Miễn phí')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HiOutlineCircleStack size={12} color="#38bdf8" />
                            {t('models_page.cache_read', 'Đọc Cache')}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8' }}>
                            {model.cache_read_credit_price ? `${model.cache_read_credit_price.toLocaleString()} cr ${t('models_page.per_1m', '/ 1M')}` : 'Theo token'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.65rem 1rem' }}
                    onClick={() => {
                      const catParam = mapCategoryToStudioParam(model.category);
                      navigate(`/studio?category=${catParam}&model=${model.model_code}`);
                    }}
                  >
                    <span>{t('models_page.open_in_studio', 'Dùng Ngay Trong Studio')}</span>
                    <HiOutlineArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModelsExplorePage;
