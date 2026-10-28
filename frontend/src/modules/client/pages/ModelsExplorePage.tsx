import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineMusicalNote,
  HiOutlineCodeBracket,
  HiOutlineArrowPath,
  HiOutlineCircleStack,
  HiOutlineServerStack,
  HiOutlineCheckCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineCommandLine,
} from 'react-icons/hi2';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import styles from './ModelsExplorePage.module.scss';

export const ModelsExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') || 'ALL').toUpperCase();

  const [models, setModels] = useState<PublicModelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

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

  // Quick stats
  const chatCount = useMemo(() => models.filter((m) => m.category?.toUpperCase() === 'CHAT').length, [models]);
  const imageCount = useMemo(() => models.filter((m) => m.category?.toUpperCase() === 'IMAGE').length, [models]);
  const videoCount = useMemo(() => models.filter((m) => m.category?.toUpperCase() === 'VIDEO').length, [models]);
  const audioCount = useMemo(() => models.filter((m) => m.category?.toUpperCase() === 'AUDIO').length, [models]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const cat = m.category?.toUpperCase();
      const matchCategory =
        filterCategory === 'ALL' ||
        cat === filterCategory ||
        (filterCategory === 'AUDIO' && (cat === 'AUDIO' || m.model_code.includes('tts') || m.model_code.includes('whisper')));

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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedMap((prev) => ({ ...prev, [code]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [code]: false }));
    }, 2000);
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'CHAT') return <HiOutlineChatBubbleLeftRight size={14} color="#10a37f" />;
    if (cat === 'IMAGE') return <HiOutlinePhoto size={14} color="#38bdf8" />;
    if (cat === 'VIDEO') return <HiOutlineFilm size={14} color="#c084fc" />;
    if (cat === 'AUDIO') return <HiOutlineMusicalNote size={14} color="#f43f5e" />;
    return <HiOutlineCodeBracket size={14} color="#f59e0b" />;
  };

  const getProviderColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('openai')) return '#10a37f';
    if (p.includes('anthropic') || p.includes('claude')) return '#f59e0b';
    if (p.includes('deepseek')) return '#0ea5e9';
    if (p.includes('google') || p.includes('gemini')) return '#38bdf8';
    if (p.includes('midjourney')) return '#ec4899';
    if (p.includes('black forest') || p.includes('flux')) return '#8b5cf6';
    if (p.includes('runway') || p.includes('luma')) return '#f97316';
    if (p.includes('meta')) return '#06b6d4';
    return '#38bdf8';
  };

  const mapCategoryToStudioParam = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'IMAGE') return 'image';
    if (cat === 'VIDEO') return 'video';
    return 'chat';
  };

  return (
    <div className={styles.modelsContainer}>
      {/* ── Top Hero Section ── */}
      <div className={styles.heroSection}>
        <div className={styles.heroTopRow}>
          <div className={styles.catalogBadge}>
            <HiOutlineSparkles size={16} /> VeloX AI Model Matrix 2.0
          </div>

          <div className={styles.heroQuickStats}>
            <span className={styles.statPill}>
              Tổng: <strong>{models.length} Models</strong>
            </span>
            <span className={styles.statPill}>
              Chat: <strong>{chatCount}</strong>
            </span>
            <span className={styles.statPill}>
              Ảnh: <strong>{imageCount}</strong>
            </span>
            <span className={styles.statPill}>
              Video: <strong>{videoCount}</strong>
            </span>
            {audioCount > 0 && (
              <span className={styles.statPill}>
                Audio: <strong>{audioCount}</strong>
              </span>
            )}
          </div>
        </div>

        <h1 className={styles.heroTitle}>
          Thư Viện Mô Hình AI <span className={styles.highlightBrand}>(AI Models Catalog)</span>
        </h1>

        <p className={styles.heroDesc}>
          Khám phá hơn 100+ mô hình trí tuệ nhân tạo thế hệ mới nhất cho Chat, Lập Trình, Tạo Ảnh và Video AI.
          Hệ thống áp dụng biểu phí Credit minh bạch theo số lượng Token thực tế, tối ưu chi phí và độ trễ cực thấp.
        </p>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.openStudioBtn}
            onClick={() => navigate('/studio')}
          >
            <HiOutlineSparkles size={18} />
            <span>Mở Studio Sáng Tạo</span>
          </button>

          <Link to="/apidocs?section=part-2" className={styles.viewDocsBtn}>
            <HiOutlineCommandLine size={17} />
            <span>Xem Cú Pháp Móc API & Docs</span>
          </Link>
        </div>
      </div>

      {/* ── Filter and Search Toolbar ── */}
      <div className={styles.filterToolbar}>
        {/* Category Tabs */}
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={`${styles.categoryBtn} ${filterCategory === 'ALL' ? styles.activeCategory : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            <span>Tất Cả</span>
            <span className={styles.tabCount}>{models.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.categoryBtn} ${filterCategory === 'CHAT' ? styles.activeCategory : ''}`}
            onClick={() => setFilterCategory('CHAT')}
          >
            <HiOutlineChatBubbleLeftRight size={15} color={filterCategory === 'CHAT' ? '#fff' : '#10a37f'} />
            <span>Chat & Code</span>
            <span className={styles.tabCount}>{chatCount}</span>
          </button>

          <button
            type="button"
            className={`${styles.categoryBtn} ${filterCategory === 'IMAGE' ? styles.activeCategory : ''}`}
            onClick={() => setFilterCategory('IMAGE')}
          >
            <HiOutlinePhoto size={15} color={filterCategory === 'IMAGE' ? '#fff' : '#38bdf8'} />
            <span>Tạo Ảnh AI</span>
            <span className={styles.tabCount}>{imageCount}</span>
          </button>

          <button
            type="button"
            className={`${styles.categoryBtn} ${filterCategory === 'VIDEO' ? styles.activeCategory : ''}`}
            onClick={() => setFilterCategory('VIDEO')}
          >
            <HiOutlineFilm size={15} color={filterCategory === 'VIDEO' ? '#fff' : '#c084fc'} />
            <span>Video AI</span>
            <span className={styles.tabCount}>{videoCount}</span>
          </button>

          {audioCount > 0 && (
            <button
              type="button"
              className={`${styles.categoryBtn} ${filterCategory === 'AUDIO' ? styles.activeCategory : ''}`}
              onClick={() => setFilterCategory('AUDIO')}
            >
              <HiOutlineMusicalNote size={15} color={filterCategory === 'AUDIO' ? '#fff' : '#f43f5e'} />
              <span>Giọng Nói & STT</span>
              <span className={styles.tabCount}>{audioCount}</span>
            </button>
          )}
        </div>

        {/* Provider Select & Search Box */}
        <div className={styles.searchAndProviderRow}>
          {providers.length > 2 && (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className={styles.providerSelect}
            >
              <option value="ALL">Hãng: Tất cả ({providers.length - 1})</option>
              {providers
                .filter((p) => p !== 'ALL')
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          )}

          <div className={styles.searchBox}>
            <HiOutlineMagnifyingGlass size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Content States ── */}
      {loading ? (
        <div className={styles.loadingBox}>
          <HiOutlineArrowPath className="animate-spin" size={36} style={{ margin: '0 auto 1rem', display: 'block', color: '#ff6b35' }} />
          <h3>Đang nạp danh mục mô hình AI...</h3>
          <p>Hệ thống đang đồng bộ dữ liệu thời gian thực từ VeloX Gateway.</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className={styles.emptyBox}>
          <HiOutlineServerStack size={44} color="#64748b" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3>Không tìm thấy mô hình nào phù hợp</h3>
          <p>Hãy thử tìm bằng từ khóa khác hoặc chuyển sang danh mục tất cả.</p>
        </div>
      ) : (
        /* Models Grid */
        <div className={styles.modelsGrid}>
          {filteredModels.map((model) => {
            const providerColor = getProviderColor(model.provider);
            const isMedia = model.category === 'IMAGE' || model.category === 'VIDEO' || model.category === 'AUDIO';
            const isCopied = copiedMap[model.model_code];

            return (
              <div key={model.id || model.model_code} className={styles.modelCard}>
                <div>
                  {/* Top Bar: Provider Tag, Category Tag & Status */}
                  <div className={styles.cardHeaderRow}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className={styles.providerPill}
                        style={{
                          color: providerColor,
                          backgroundColor: `${providerColor}18`,
                          borderColor: `${providerColor}40`,
                        }}
                      >
                        {model.provider}
                      </span>
                      <span className={styles.categoryTag}>
                        {getCategoryIcon(model.category)}
                        {model.category}
                      </span>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        model.is_available ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      <HiOutlineCheckCircle size={13} />
                      {model.is_available ? 'Sẵn Sàng' : 'Bảo Trì'}
                    </span>
                  </div>

                  {/* Title & Model Code */}
                  <div className={styles.cardMainInfo}>
                    <h3 className={styles.modelName}>{model.name}</h3>

                    <div className={styles.modelCodeBox}>
                      <span className={styles.modelCode}>{model.model_code}</span>
                      <button
                        type="button"
                        className={styles.copyCodeBtn}
                        onClick={() => handleCopyCode(model.model_code)}
                        title="Copy mã API Model"
                      >
                        {isCopied ? (
                          <HiOutlineCheck size={14} color="#22c55e" />
                        ) : (
                          <HiOutlineDocumentDuplicate size={14} />
                        )}
                      </button>
                    </div>

                    <p className={styles.modelDesc}>
                      {model.description ||
                        'Mô hình trí tuệ nhân tạo hiệu năng cao được tối ưu hóa độ trễ trên hạ tầng VeloX Gateway.'}
                    </p>
                  </div>

                  {/* Credit Pricing Breakdown */}
                  <div className={styles.pricingBox}>
                    {isMedia ? (
                      /* Media: Image / Video Pricing */
                      <div className={styles.priceRow}>
                        <span className={styles.priceLabel}>
                          <HiOutlineBolt size={14} color="#ff6b35" />
                          Đơn giá khấu trừ:
                        </span>
                        <span className={styles.mediaPriceValue}>
                          {model.selling_credit_price ? (
                            `${model.selling_credit_price.toLocaleString()} cr / ${
                              model.category === 'IMAGE' ? 'ảnh' : model.category === 'VIDEO' ? 'video' : 'lượt'
                            }`
                          ) : (
                            'Miễn phí'
                          )}
                        </span>
                      </div>
                    ) : (
                      /* Text & Code: Token-based & Cache Pricing */
                      <>
                        {(!model.input_credit_price && !model.output_credit_price && model.selling_credit_price) ? (
                          <div className={styles.priceRow}>
                            <span className={styles.priceLabel}>Giá mỗi lượt gọi</span>
                            <span className={styles.priceValue}>
                              {model.selling_credit_price.toLocaleString()} cr / lượt
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>Input Tokens</span>
                              <span className={styles.priceValue}>
                                {model.input_credit_price
                                  ? `${model.input_credit_price.toLocaleString()} cr / 1M`
                                  : '1 cr (Sàn tối thiểu)'}
                              </span>
                            </div>

                            <div className={styles.divider} />

                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>Output Tokens</span>
                              <span className={styles.priceValue}>
                                {model.output_credit_price
                                  ? `${model.output_credit_price.toLocaleString()} cr / 1M`
                                  : '1 cr (Sàn tối thiểu)'}
                              </span>
                            </div>
                          </>
                        )}

                        {model.cache_read_credit_price ? (
                          <>
                            <div className={styles.divider} />
                            <div className={styles.priceRow}>
                              <span className={styles.priceLabel}>
                                <HiOutlineCircleStack size={12} color="#38bdf8" />
                                Đọc Cache Prompt
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
                                {model.cache_read_credit_price.toLocaleString()} cr / 1M (-80%)
                              </span>
                            </div>
                          </>
                        ) : null}

                        {/* Estimated Per-Turn Cost */}
                        <div className={styles.estimatePill}>
                          <span className={styles.estimateLabel}>Ước tính / câu hỏi:</span>
                          <span className={styles.estimateValue}>
                            ~0.05 - 0.1 cr{' '}
                            <small style={{ color: '#64748b', fontWeight: 600 }}>
                              (Sàn: {model.selling_credit_price || 1} cr)
                            </small>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.studioActionBtn}
                    onClick={() => {
                      const catParam = mapCategoryToStudioParam(model.category);
                      navigate(`/studio?category=${catParam}&model=${model.model_code}`);
                    }}
                  >
                    <span>Dùng Trong Studio</span>
                    <HiOutlineArrowRight size={14} />
                  </button>

                  <Link
                    to={`/apidocs?section=part-${model.category === 'IMAGE' ? '5' : model.category === 'VIDEO' ? '8' : '3'}`}
                    className={styles.docsActionBtn}
                    title="Xem hướng dẫn API của model này"
                  >
                    <HiOutlineCodeBracket size={15} />
                    <span>Docs</span>
                  </Link>
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
