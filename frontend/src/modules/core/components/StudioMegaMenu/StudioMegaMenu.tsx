import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineChevronDown,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineBolt,
} from 'react-icons/hi2';
import {
  RiOpenaiFill,
  RiReactjsFill,
  RiImageAiFill,
  RiVideoAiFill,
  RiBrainAi3Fill,
} from 'react-icons/ri';
import {
  SiAnthropic,
  SiGoogle,
  SiMeta,
} from 'react-icons/si';
import styles from './StudioMegaMenu.module.scss';

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  description: string;
  credits: string;
  tag: string;
}

export interface StudioCategory {
  id: 'chat' | 'image' | 'video';
  label: string;
  icon: React.ReactNode;
  desc: string;
  models: ModelItem[];
}

export const STUDIO_CATEGORIES: StudioCategory[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <HiOutlineChatBubbleLeftRight size={20} />,
    desc: 'Hội thoại AI, lập trình, viết lách & giải quyết logic',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Omni)',
        provider: 'OpenAI',
        badge: 'HOT',
        description: 'Flagship đa phương thức, suy luận logic và kiến thức chuyên sâu đỉnh cao',
        credits: '15 cr/1k tokens',
        tag: 'Đa nhiệm cao cấp',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        badge: 'TOP CODE',
        description: 'Mô hình viết code & phân tích logic sắc bén nhất hiện nay',
        credits: '18 cr/1k tokens',
        tag: 'Lập trình & Viết lách',
      },
      {
        id: 'gemini-1-5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google DeepMind',
        description: 'Cửa sổ ngữ cảnh khổng lồ 2M token, đọc trọn tài liệu và video lớn',
        credits: '12 cr/1k tokens',
        tag: '2M Context',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek-R1',
        provider: 'DeepSeek',
        badge: 'REASONING',
        description: 'Mô hình suy luận chuỗi tư duy (Chain of Thought), giải toán & logic',
        credits: '10 cr/1k tokens',
        tag: 'Tư duy logic',
      },
      {
        id: 'llama-3-3-70b',
        name: 'Llama 3.3 (70B)',
        provider: 'Meta AI',
        description: 'Mã nguồn mở tốc độ cao, độ trễ cực thấp, tối ưu chi phí',
        credits: '6 cr/1k tokens',
        tag: 'Tốc độ cao',
      },
    ],
  },
  {
    id: 'image',
    label: 'Hình Ảnh',
    icon: <HiOutlinePhoto size={20} />,
    desc: 'Sinh ảnh nghệ thuật, nhiếp ảnh thương mại & poster từ text',
    models: [
      {
        id: 'midjourney-v6',
        name: 'Midjourney v6.1',
        provider: 'Midjourney Inc.',
        badge: 'CINEMATIC',
        description: 'Tiêu chuẩn vàng về thẩm mỹ hội họa, ánh sáng studio và bố cục điện ảnh',
        credits: '35 cr/ảnh',
        tag: 'Nhiếp ảnh & Điện ảnh',
      },
      {
        id: 'flux-1-dev',
        name: 'FLUX.1 [dev/pro]',
        provider: 'Black Forest Labs',
        badge: 'NEW',
        description: 'Độ chi tiết da người siêu thực, chính xác tuyệt đối chữ viết trong ảnh',
        credits: '25 cr/ảnh',
        tag: 'Siêu thực & Chữ viết',
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3 Ultra',
        provider: 'OpenAI',
        description: 'Hiểu ngữ cảnh prompt phức tạp và phong cách hội họa biến hóa',
        credits: '30 cr/ảnh',
        tag: 'Minh họa & Ý tưởng',
      },
      {
        id: 'sd-3-5-large',
        name: 'Stable Diffusion 3.5',
        provider: 'Stability AI',
        description: 'Hỗ trợ phong cách Anime, 3D Render và Custom LoRA không giới hạn',
        credits: '20 cr/ảnh',
        tag: 'Tùy biến cao',
      },
    ],
  },
  {
    id: 'video',
    label: 'Video',
    icon: <HiOutlineFilm size={20} />,
    desc: 'Tạo video chuyển động điện ảnh mượt mà từ văn bản hoặc ảnh gốc',
    models: [
      {
        id: 'runway-gen3',
        name: 'Runway Gen-3 Alpha',
        provider: 'Runway AI',
        badge: '4K CINEMA',
        description: 'Hiệu ứng chuyển động camera điện ảnh chuyên nghiệp, vật lý ánh sáng sống động',
        credits: '80 cr/5s video',
        tag: 'Kỹ xảo điện ảnh',
      },
      {
        id: 'luma-dream-machine',
        name: 'Luma Dream Machine 1.5',
        provider: 'Luma AI',
        badge: 'FAST',
        description: 'Thời gian sinh video cực nhanh, chuyển động nhân vật uyển chuyển mượt mà',
        credits: '70 cr/5s video',
        tag: 'Thời gian thực',
      },
      {
        id: 'kling-ai-1-5',
        name: 'Kling AI 1.5 Pro',
        provider: 'Kuaishou Technology',
        description: 'Tạo video dài đến 10s với độ phân giải Full HD và độ bám sát vật lý chuẩn',
        credits: '75 cr/video',
        tag: 'Thời lượng dài',
      },
      {
        id: 'minimax-video-01',
        name: 'Minimax Video-01',
        provider: 'Hailuo AI',
        description: 'Diễn hoạt biểu cảm gương mặt và hành động tự nhiên, khung hình 60fps',
        credits: '65 cr/video',
        tag: 'Chuyển động tự nhiên',
      },
    ],
  },
];

interface StudioMegaMenuProps {
  onCloseMenu?: () => void;
}

export const StudioMegaMenu: React.FC<StudioMegaMenuProps> = ({ onCloseMenu }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCatId, setActiveCatId] = useState<'chat' | 'image' | 'video'>('chat');

  const isStudioActive = location.pathname.startsWith('/studio');
  const currentCategory = STUDIO_CATEGORIES.find((c) => c.id === activeCatId) || STUDIO_CATEGORIES[0];

  const handleSelectModel = (catId: string, modelId: string) => {
    if (catId === 'chat') {
      navigate(`/playground?model=${modelId}`);
    } else {
      navigate(`/studio?category=${catId}&model=${modelId}`);
    }
    if (onCloseMenu) onCloseMenu();
  };

  return (
    <div className={`${styles.megaMenuWrapper} ${isStudioActive ? styles.active : ''}`}>
      {/* Trigger Link with Chevron */}
      <div className={styles.triggerButton}>
        <span className={styles.navLabel}>{t('nav.studio', 'Studio')}</span>
        <HiOutlineChevronDown className={styles.chevron} size={14} />
      </div>

      {/* Flyout Mega Panel */}
      <div className={styles.megaDropdown}>
        <div className={styles.megaContainer}>
          {/* LEFT COLUMN: Categories (Chat, Image, Video) */}
          <div className={styles.categoryColumn}>
            <div className={styles.columnHeader}>
              <span>{t('studio.tools_title', 'CÔNG CỤ SÁNG TẠO')}</span>
            </div>

            <div className={styles.categoryList}>
              {STUDIO_CATEGORIES.map((cat) => {
                const isActive = cat.id === activeCatId;
                return (
                  <div
                    key={cat.id}
                    className={`${styles.categoryItem} ${isActive ? styles.active : ''}`}
                    onMouseEnter={() => setActiveCatId(cat.id)}
                    onClick={() => {
                      setActiveCatId(cat.id);
                      if (cat.id === 'chat') {
                        navigate('/playground');
                      } else {
                        navigate(`/studio?category=${cat.id}`);
                      }
                      if (onCloseMenu) onCloseMenu();
                    }}
                  >
                    <div className={styles.catIconBox}>{cat.icon}</div>
                    <div className={styles.catInfo}>
                      <div className={styles.catTitle}>{t(`studio.cat_${cat.id}`, cat.label)}</div>
                      <div className={styles.catDesc}>{cat.desc}</div>
                    </div>
                    <HiOutlineArrowRight className={styles.catArrow} size={15} />
                  </div>
                );
              })}
            </div>

            <div className={styles.categoryFooter}>
              <Link
                to="/studio"
                className={styles.allStudioBtn}
                onClick={onCloseMenu}
              >
                <HiOutlineSparkles size={16} />
                <span>{t('studio.open_full_studio', 'Mở Studio Đầy Đủ')}</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Available Models for hovered category */}
          <div className={styles.modelsColumn}>
            <div className={styles.columnHeader}>
              <span>
                {t('studio.available_models_for', 'MÔ HÌNH KHẢ DỤNG')} • {currentCategory.label.toUpperCase()}
              </span>
              <span className={styles.modelsCountBadge}>
                {currentCategory.models.length} Model
              </span>
            </div>

            <div className={styles.modelsList}>
              {currentCategory.models.map((model) => (
                <div
                  key={model.id}
                  className={styles.modelListItem}
                  onClick={() => handleSelectModel(currentCategory.id, model.id)}
                >
                  <div className={styles.modelLeft}>
                    <div className={styles.modelIconBadge}>
                      {model.provider.includes('OpenAI') ? (
                        <RiOpenaiFill size={16} color="#10a37f" title="OpenAI" />
                      ) : model.provider.includes('Anthropic') ? (
                        <SiAnthropic size={15} color="#d97706" title="Anthropic" />
                      ) : model.provider.includes('Google') ? (
                        <SiGoogle size={14} color="#4285f4" title="Google" />
                      ) : model.provider.includes('Meta') ? (
                        <SiMeta size={14} color="#0668e1" title="Meta AI" />
                      ) : model.provider.includes('Midjourney') ? (
                        <RiImageAiFill size={16} color="#38bdf8" title="Midjourney" />
                      ) : model.provider.includes('Runway') ? (
                        <RiVideoAiFill size={16} color="#c084fc" title="Runway" />
                      ) : model.provider.includes('DeepSeek') ? (
                        <RiBrainAi3Fill size={16} color="#2dd4bf" title="DeepSeek" />
                      ) : (
                        <RiReactjsFill size={16} color="#61dafb" title="VeloX AI" />
                      )}
                    </div>
                    <div className={styles.modelInfo}>
                      <div className={styles.modelTitleRow}>
                        <span className={styles.modelName}>{model.name}</span>
                        <span className={styles.providerTag}>{model.provider}</span>
                        {model.badge && (
                          <span className={styles.modelBadge}>{model.badge}</span>
                        )}
                      </div>
                      <p className={styles.modelDesc}>{model.description}</p>
                    </div>
                  </div>

                  <div className={styles.modelRight}>
                    <span className={styles.modelTag}>{model.tag}</span>
                    <span className={styles.creditsCost}>
                      <HiOutlineBolt size={13} /> {model.credits}
                    </span>
                    <HiOutlineArrowRight className={styles.itemArrow} size={15} />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.modelsFooter}>
              <Link
                to={`/models?category=${currentCategory.id}`}
                className={styles.viewMoreLink}
                onClick={onCloseMenu}
              >
                <span>{t('studio.view_all_models', 'Xem chi tiết & bảng giá 100+ Model')}</span>
                <HiOutlineArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioMegaMenu;
