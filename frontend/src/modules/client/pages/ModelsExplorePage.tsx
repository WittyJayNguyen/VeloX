import React, { useState } from 'react';
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
} from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import { STUDIO_CATEGORIES } from '@modules/core/components/StudioMegaMenu/StudioMegaMenu';
import styles from '@assets/scss/client/client-pages.module.scss';

export const ModelsExplorePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Flatten all models with their category
  const allModels = STUDIO_CATEGORIES.flatMap((cat) =>
    cat.models.map((m) => ({
      ...m,
      categoryId: cat.id,
      categoryLabel: cat.label,
    }))
  );

  const filteredModels = allModels.filter((m) => {
    const matchCategory = filterCategory === 'ALL' || m.categoryId === filterCategory;
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <RiOpenaiFill size={30} color="#10a37f" />
            </span>
            {t('nav.models', 'Thư Viện Mô Hình AI (AI Models)')}
          </h1>
          <p>{t('models_page.subtitle', 'Khám phá hơn 100+ mô hình AI thế hệ mới nhất cho Chat, Tạo Ảnh và Video với chi phí tối ưu')}</p>
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
      <div className={styles.contentCard} style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={filterCategory === 'ALL' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
              onClick={() => setFilterCategory('ALL')}
            >
              Tất Cả ({allModels.length})
            </button>
            <button
              type="button"
              className={filterCategory === 'chat' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('chat')}
            >
              <HiOutlineChatBubbleLeftRight size={15} color="#10a37f" /> Chat ({allModels.filter((m) => m.categoryId === 'chat').length})
            </button>
            <button
              type="button"
              className={filterCategory === 'image' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('image')}
            >
              <HiOutlinePhoto size={15} color="#38bdf8" /> Hình Ảnh ({allModels.filter((m) => m.categoryId === 'image').length})
            </button>
            <button
              type="button"
              className={filterCategory === 'video' ? styles.primaryBtn : styles.secondaryBtn}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setFilterCategory('video')}
            >
              <HiOutlineFilm size={15} color="#c084fc" /> Video ({allModels.filter((m) => m.categoryId === 'video').length})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d121c', border: '1px solid #243048', padding: '0.4rem 0.85rem', borderRadius: '10px' }}>
            <HiOutlineMagnifyingGlass color="#94a3b8" />
            <input
              type="text"
              placeholder="Tìm theo tên model, nhà phát triển..."
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.86rem', width: '220px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={styles.contentCard}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', marginBottom: 0 }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {model.provider}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>
                    {model.name}
                  </h3>
                </div>
                {model.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: 'rgba(255, 107, 53, 0.15)',
                      color: '#ff6b35',
                      border: '1px solid rgba(255, 107, 53, 0.4)',
                      padding: '2px 7px',
                      borderRadius: '999px',
                    }}
                  >
                    {model.badge}
                  </span>
                )}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                {model.description}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#0e131e', borderRadius: '8px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', background: '#192336', padding: '2px 7px', borderRadius: '4px' }}>
                  {model.tag}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <HiOutlineBolt size={14} /> {model.credits}
                </span>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/studio?category=${model.categoryId}&model=${model.id}`)}
              >
                <span>Thử Nghiệm Trong Studio</span>
                <HiOutlineArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelsExplorePage;
