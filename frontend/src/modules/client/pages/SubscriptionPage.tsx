import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import {
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineCreditCard,
  HiOutlineBolt,
  HiOutlineCalendarDays,
  HiOutlineServerStack,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRight,
  HiOutlineCommandLine,
} from 'react-icons/hi2';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import { billingService, type CreditPackageDto } from '@modules/billing/services/billingService';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import styles from '@assets/scss/client/client-pages.module.scss';

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'models' || tabParam === 'model' ? 'MODELS' : tabParam === 'topup' ? 'TOPUP' : 'SUBSCRIPTION';

  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>();
  const [packages, setPackages] = useState<CreditPackageDto[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTION' | 'TOPUP' | 'MODELS'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);

  // AI Models state for Models tab
  const [models, setModels] = useState<PublicModelItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelCategory, setModelCategory] = useState<string>('ALL');
  const [searchModel, setSearchModel] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    billingService
      .getPublicPackages()
      .then((data) => {
        if (isMounted && data) {
          setPackages(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load packages from database:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'MODELS' && models.length === 0) {
      setModelsLoading(true);
      modelService
        .getPublicModels()
        .then((data) => {
          if (isMounted && data) {
            setModels(data);
          }
        })
        .catch((err) => console.error('Failed to load models catalog:', err))
        .finally(() => {
          if (isMounted) setModelsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, models.length]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchCat =
        modelCategory === 'ALL' ||
        (m.category && m.category.toUpperCase() === modelCategory.toUpperCase());
      const q = searchModel.trim().toLowerCase();
      const matchQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.model_code.toLowerCase().includes(q) ||
        (m.provider && m.provider.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [models, modelCategory, searchModel]);

  const handleAction = (pkgId?: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSelectedPackageId(pkgId);
    setTopupOpen(true);
  };

  const subscriptionPackages = packages.filter((p) => p.category !== 'TOPUP');
  const topupPackages = packages.filter((p) => p.category === 'TOPUP');
  const displayedPackages = activeTab === 'SUBSCRIPTION' ? subscriptionPackages : topupPackages;

  const getProductionCapability = (pkg: CreditPackageDto): string => {
    const cre = pkg.credits_given;
    if (cre <= 1000) return '⚡ ~30 ảnh chất lượng cao hoặc 500 câu chat AI';
    if (cre <= 2500) return '⚡ ~60 ảnh FLUX / Midjourney hoặc 800 câu chat chuyên sâu';
    if (cre <= 6000) return '⚡ ~150 ảnh Midjourney 4K hoặc 65 video Full HD không chờ đợi';
    if (cre <= 16000) return '⚡ ~400 ảnh Studio 4K hoặc 180 video thương mại điện ảnh';
    return '⚡ ~950 ảnh 4K hoặc 420 video AI băng thông riêng';
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>💳</span>
            {t('client_menu.subscription', 'Quản Lý Gói & Bảng Giá')}
          </h1>
          <p>{t('subscription.subtitle', 'Lựa chọn gói dịch vụ AI tối ưu nhất cho công việc và quy mô của bạn')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => handleAction()}>
            <HiOutlineCreditCard /> {isAuthenticated ? t('subscription.topup_btn', 'Nạp Credit Ngay') : 'Đăng Nhập Để Nạp'}
          </button>
        </div>
      </div>

      {/* Current plan banner */}
      <div className={styles.currentPlanBanner}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerContent}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isAuthenticated ? t('subscription.current_plan', 'Gói Dịch Vụ Đang Dùng') : 'Cổng Kết Nối AI Gateway Chuyên Nghiệp'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                {isAuthenticated ? (user?.tier || 'Thành Viên VeloX') : 'Khám Phá Toàn Diện 150+ Mô Hình AI'}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.45 }}>
                {isAuthenticated ? (
                  <>Số dư hiện tại: <strong style={{ color: '#38bdf8' }}>💎 {(user?.credit_balance ?? 0).toLocaleString()} Credits</strong></>
                ) : (
                  'Nạp Credit linh hoạt, trải nghiệm các mô hình AI đỉnh cao thế giới (Claude 3.5 Sonnet, Midjourney, Kling, FLUX, Veo 3.1).'
                )}
              </div>
            </div>
          </div>
          <button type="button" className={`${styles.primaryBtn} ${styles.bannerActionBtn}`} onClick={() => handleAction()}>
            <HiOutlineSparkles /> {isAuthenticated ? 'Nâng Cấp Gói Ngay' : 'Đăng Ký / Đăng Nhập'}
          </button>
        </div>
      </div>

      {/* Tab Switcher: Gói Tháng vs Nạp Trực Tiếp vs Bảng Giá Models */}
      <div className={styles.subscriptionTabWrapper}>
        <div className={styles.subscriptionTabContainer}>
          <button
            type="button"
            onClick={() => setActiveTab('SUBSCRIPTION')}
            className={`${styles.subTabBtn} ${activeTab === 'SUBSCRIPTION' ? styles.subTabActiveSubscription : ''}`}
          >
            <HiOutlineCalendarDays size={18} />
            <span>Gói Hội Viên Tháng (-30%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TOPUP')}
            className={`${styles.subTabBtn} ${activeTab === 'TOPUP' ? styles.subTabActiveTopup : ''}`}
          >
            <HiOutlineBolt size={18} />
            <span>Nạp Credit VietQR (Vĩnh viễn)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MODELS')}
            className={`${styles.subTabBtn} ${activeTab === 'MODELS' ? styles.subTabActiveModels : ''}`}
          >
            <HiOutlineServerStack size={18} />
            <span>Bảng Giá 150+ Model AI</span>
          </button>
        </div>
      </div>

      {/* Tab: BẢNG GIÁ MODEL AI */}
      {activeTab === 'MODELS' ? (
        <div style={{ marginTop: '1.5rem' }}>
          {/* Header Info Banner */}
          <div className={styles.modelsHeaderBanner}>
            <div>
              <div style={{ color: '#ff6b35', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                QUY ĐỔI MINH BẠCH & TIẾT KIỆM 50-70%
              </div>
              <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                Bảng Giá Tín Dụng Chi Tiết Từng Model (1 Credit = 100 VNĐ)
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                Áp dụng tính cước linh hoạt theo Token hoặc Lượt sinh ảnh/video. Nạp bao nhiêu dùng bấy nhiêu, không ép cam kết tháng.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to="/models"
                className={styles.secondaryBtn}
                style={{ fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none' }}
              >
                Khám Phá Models <HiOutlineArrowRight size={14} />
              </Link>
              <Link
                to="/docs"
                className={styles.primaryBtn}
                style={{ fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none' }}
              >
                <HiOutlineCommandLine size={16} /> API Docs
              </Link>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className={styles.pricingFilterRow}>
            <div className={styles.filterTabs}>
              {[
                { id: 'ALL', label: 'Tất Cả' },
                { id: 'CHAT', label: 'Chat & Code' },
                { id: 'IMAGE', label: 'Hình Ảnh AI' },
                { id: 'VIDEO', label: 'Video AI' },
                { id: 'AUDIO', label: 'Giọng Nói & TTS' },
                { id: 'DEV_REQ', label: 'Agent & Dev' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.tabBtn} ${modelCategory === cat.id ? styles.tabActive : ''}`}
                  onClick={() => setModelCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className={styles.searchBox}>
              <HiOutlineMagnifyingGlass size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm model, nhà phát triển..."
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.pricingTable}>
              <thead>
                <tr>
                  <th>Mã Model (API ID)</th>
                  <th>Tên Model & Hãng</th>
                  <th>Loại</th>
                  <th>Input Tokens (1M)</th>
                  <th>Output Tokens (1M)</th>
                  <th>Đọc Cache (1M)</th>
                  <th>Giá Mỗi Lượt</th>
                  <th style={{ textAlign: 'center' }}>Sử Dụng</th>
                </tr>
              </thead>
              <tbody>
                {modelsLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      Đang đồng bộ bảng giá thời gian thực từ máy chủ VeloX...
                    </td>
                  </tr>
                ) : filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      Không tìm thấy model nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((m) => {
                    const isMedia = m.category === 'IMAGE' || m.category === 'VIDEO' || m.category === 'AUDIO';
                    return (
                      <tr key={m.id || m.model_code}>
                        <td className={styles.modelCodeCell}>
                          <span style={{ color: '#ff8c42' }}>{m.model_code}</span>
                        </td>
                        <td>
                          <div style={{ color: '#fff', fontWeight: 600 }}>{m.name}</div>
                          <span className={styles.providerCell}>{m.provider}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              background: '#1c2538',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {m.category}
                          </span>
                        </td>
                        <td className={styles.rateCell}>
                          {isMedia ? (
                            <span style={{ color: '#64748b' }}>—</span>
                          ) : m.input_credit_price ? (
                            <div>
                              <span>{m.input_credit_price.toLocaleString()} cr</span>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                ~{(m.input_credit_price * 100).toLocaleString()} ₫
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#10b981' }}>Theo lượt</span>
                          )}
                        </td>
                        <td className={styles.rateCell}>
                          {isMedia ? (
                            <span style={{ color: '#64748b' }}>—</span>
                          ) : m.output_credit_price ? (
                            <div>
                              <span>{m.output_credit_price.toLocaleString()} cr</span>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                ~{(m.output_credit_price * 100).toLocaleString()} ₫
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#10b981' }}>Theo lượt</span>
                          )}
                        </td>
                        <td className={styles.cacheCell}>
                          {isMedia ? (
                            <span style={{ color: '#64748b' }}>—</span>
                          ) : m.cache_read_credit_price ? (
                            <div>
                              <span>{m.cache_read_credit_price.toLocaleString()} cr</span>
                              <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Giảm 80%</div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td className={styles.minCostCell}>
                          {isMedia ? (
                            <span style={{ color: '#2dd4bf', fontWeight: 700 }}>
                              {m.selling_credit_price} cr{' '}
                              <small style={{ color: '#64748b' }}>
                                (~{(m.selling_credit_price * 100).toLocaleString()} ₫)
                              </small>
                            </span>
                          ) : (
                            <span>
                              <strong style={{ color: '#2dd4bf' }}>~0.05 cr</strong>{' '}
                              <small style={{ color: '#64748b' }}>(Sàn: {m.selling_credit_price || 1} cr)</small>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => navigate('/studio')}
                            style={{
                              background: '#1a2338',
                              border: '1px solid #283758',
                              color: '#fff',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Dùng Thử
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note for Developers */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              background: '#090d16',
              border: '1px solid #1a2234',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              fontSize: '0.86rem',
              color: '#94a3b8',
            }}
          >
            <div>
              💡 Dành cho lập trình viên: Endpoint bảng giá tự động JSON có sẵn tại:{' '}
              <code style={{ color: '#38bdf8', background: '#131b2e', padding: '2px 8px', borderRadius: '4px' }}>
                GET /v1/pricing
              </code>
            </div>
            <Link to="/docs" style={{ color: '#ff6b35', fontWeight: 600, textDecoration: 'none' }}>
              Xem hướng dẫn tích hợp API &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* Plans Grid: SUBSCRIPTION & TOPUP */
        isLoading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
            Đang tải thông tin bảng giá cập nhật từ hệ thống...
          </div>
        ) : (
          <div className={styles.plansGrid}>
            {displayedPackages.map((tier) => {
              const isUserCurrent =
                isAuthenticated &&
                activeTab === 'SUBSCRIPTION' &&
                (user?.tier || 'Free Member').toLowerCase().includes(tier.name.toLowerCase());
              const discountPercent =
                tier.original_price_vnd && tier.original_price_vnd > tier.price_vnd
                  ? Math.round(((tier.original_price_vnd - tier.price_vnd) / tier.original_price_vnd) * 100)
                  : 0;

              return (
                <div
                  key={tier.id}
                  className={styles.contentCard}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.75rem 1.5rem',
                    borderColor: tier.is_popular ? '#ff6b35' : '#1e2638',
                    background: tier.is_popular
                      ? 'linear-gradient(180deg, rgba(255, 107, 53, 0.05) 0%, rgba(17, 24, 39, 1) 100%)'
                      : undefined,
                    boxShadow: tier.is_popular ? '0 12px 36px rgba(255, 107, 53, 0.18)' : undefined,
                  }}
                >
                  {/* Popular or Custom Badge */}
                  {tier.is_popular && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '999px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {tier.tag_badge || 'KHUYÊN DÙNG'}
                    </span>
                  )}

                  {/* Non-popular badge */}
                  {!tier.is_popular && tier.tag_badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #334155',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {tier.tag_badge}
                    </span>
                  )}

                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{tier.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0.4rem 0 1rem', minHeight: '38px', lineHeight: 1.45 }}>
                    {tier.description || 'Gói dịch vụ AI Gateway VeloX'}
                  </div>

                  {/* Pricing Area: Structured two-tier layout avoiding text drops */}
                  <div style={{ marginBottom: '1.1rem', minHeight: '68px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
                        {tier.price_vnd > 0 ? `${tier.price_vnd.toLocaleString()} ₫` : '0 ₫'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {tier.category === 'TOPUP' ? '' : '/tháng'}
                      </span>
                    </div>

                    {tier.original_price_vnd && tier.original_price_vnd > tier.price_vnd ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {tier.original_price_vnd.toLocaleString()} ₫
                        </span>
                        {discountPercent > 0 && (
                          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            -{discountPercent}%
                          </span>
                        )}
                        <span style={{ color: '#10b981', fontSize: '0.74rem', fontWeight: 600 }}>Tiết kiệm</span>
                      </div>
                    ) : (
                      <div style={{ height: '22px' }} />
                    )}
                  </div>

                  {/* Credit Quota & Production Capacity */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#090d16',
                      border: '1px solid #1a2234',
                      borderRadius: '10px',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ color: '#2dd4bf', fontWeight: 700, fontSize: '0.98rem', whiteSpace: 'nowrap' }}>
                      💎 {tier.credits_given.toLocaleString()} Credits {tier.category === 'TOPUP' ? 'vĩnh viễn' : '/tháng'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '5px', fontWeight: 500, lineHeight: 1.45 }}>
                      {getProductionCapability(tier)}
                    </div>
                  </div>

                  {/* Feature List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem', flex: 1 }}>
                    {(tier.features || []).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                        <HiOutlineCheck color="#10b981" size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action CTA Button */}
                  <button
                    type="button"
                    className={isUserCurrent ? styles.secondaryBtn : styles.primaryBtn}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: tier.is_popular ? 'linear-gradient(135deg, #ff6b35 0%, #e0531c 100%)' : undefined,
                    }}
                    onClick={() => handleAction(tier.id)}
                  >
                    {isAuthenticated ? (isUserCurrent ? 'Gói Hiện Tại' : 'Chọn Gói Này') : 'Bắt Đầu Ngay'}
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} initialPackageId={selectedPackageId} />
    </div>
  );
};

export default SubscriptionPage;
