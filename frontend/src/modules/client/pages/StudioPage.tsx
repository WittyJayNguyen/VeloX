import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineSparkles,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineArrowsPointingOut,
  HiOutlineUser,
  HiOutlinePlay,
} from 'react-icons/hi2';
import {
  RiOpenaiFill,
  RiReactjsFill,
  RiSparklingFill,
} from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { STUDIO_CATEGORIES } from '@modules/core/components/StudioMegaMenu/StudioMegaMenu';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './StudioPage.module.scss';

export interface GenerationJob {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  model: string;
  progress: number;
  statusText: string;
  aspectRatio: string;
  refImage?: string | null;
}

export interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  quality?: string;
  createdAt: string;
}

export interface GeneratedVideoItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  poster: string;
  duration?: string;
  quality?: string;
  createdAt: string;
}

export const StudioPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, addCredits } = useAuthStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const urlCategory = searchParams.get('category') as 'chat' | 'image' | 'video' | null;
  const urlModel = searchParams.get('model');

  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video'>('image');
  const [selectedModelId, setSelectedModelId] = useState<string>('midjourney-v6');
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Advanced Generation Settings
  const [refImage, setRefImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [outputCount, setOutputCount] = useState<number>(1);
  const [quality, setQuality] = useState<'standard' | 'hd' | 'ultra_4k'>('hd');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');

  // Active generating jobs
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);

  // Modal preview
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    title: string;
    prompt: string;
    model: string;
  } | null>(null);

  // Results state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; model: string }>>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI cao cấp tại VeloX Studio. Bạn muốn tôi hỗ trợ viết code, phân tích dữ liệu, hay giải quyết vấn đề gì hôm nay?',
      model: 'gpt-4o',
    },
  ]);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
      prompt: 'A powerful athlete training in modern dark neon gym, cinematic lighting, 8k resolution',
      model: 'Midjourney v6.1',
      aspectRatio: '1:1',
      quality: 'Ultra 4K',
      createdAt: 'Vừa xong',
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      prompt: 'Futuristic AI fitness laboratory with holograms and dynamic pulse tracking',
      model: 'FLUX.1 [dev/pro]',
      aspectRatio: '16:9',
      quality: 'HD 2K',
      createdAt: '5 phút trước',
    },
    {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
      prompt: 'Hyper-detailed cyber trainer with glowing kinetic energy aura in high-tech studio',
      model: 'DALL-E 3 Ultra',
      aspectRatio: '9:16',
      quality: 'Standard',
      createdAt: '12 phút trước',
    },
    {
      id: 'img-4',
      url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
      prompt: 'Elite crossfit workout session under dramatic moody stadium floodlights',
      model: 'Midjourney v6.1',
      aspectRatio: '1:1',
      quality: 'Ultra 4K',
      createdAt: '25 phút trước',
    },
  ]);

  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([
    {
      id: 'vid-1',
      title: 'Cinematic Gym Motivation 4K',
      prompt: 'Hyper-realistic video of athlete running through neon rain city, smooth slow-motion camera orbit',
      model: 'Runway Gen-3 Alpha',
      poster: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
      duration: '5s',
      quality: '1080p FHD',
      createdAt: 'Hôm nay',
    },
    {
      id: 'vid-2',
      title: 'Dynamic Fitness Motion Slowmo',
      prompt: 'Explosive battle rope training with particles of chalk floating in golden hour light',
      model: 'Minimax Video-01',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      duration: '5s',
      quality: '720p HD',
      createdAt: 'Hôm qua',
    },
  ]);

  // Sync with URL params
  useEffect(() => {
    if (urlCategory && ['chat', 'image', 'video'].includes(urlCategory)) {
      setActiveTab(urlCategory);
    }
  }, [urlCategory]);

  useEffect(() => {
    const currentCatObj = STUDIO_CATEGORIES.find((c) => c.id === activeTab);
    if (currentCatObj) {
      if (urlModel && currentCatObj.models.some((m) => m.id === urlModel)) {
        setSelectedModelId(urlModel);
      } else {
        setSelectedModelId(currentCatObj.models[0].id);
      }
    }
  }, [activeTab, urlModel]);

  const currentCategoryObj = STUDIO_CATEGORIES.find((c) => c.id === activeTab) || STUDIO_CATEGORIES[0];
  const currentModelObj = currentCategoryObj.models.find((m) => m.id === selectedModelId) || currentCategoryObj.models[0];

  // Calculate dynamic credit cost
  const calculateTotalCredits = (): number => {
    if (activeTab === 'chat') return 15;
    if (activeTab === 'image') {
      const basePerImage = 35;
      const qualityMultiplier = quality === 'ultra_4k' ? 1.5 : quality === 'hd' ? 1.2 : 1;
      return Math.round(basePerImage * outputCount * qualityMultiplier);
    }
    if (activeTab === 'video') {
      const basePerVideo = duration === '10s' ? 140 : 80;
      return Math.round(basePerVideo * outputCount);
    }
    return 35;
  };

  const totalCreditsNeeded = calculateTotalCredits();

  // Handle Reference Image Upload & Paste
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRefImage(event.target.result as string);
        setToastMsg('Đã nạp ảnh tham chiếu thành công!');
        setTimeout(() => setToastMsg(null), 2500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setRefImage(event.target.result as string);
              setToastMsg('Đã dán ảnh tham chiếu từ Clipboard!');
              setTimeout(() => setToastMsg(null), 2500);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Generate / Submit Job
  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    const currentCredits = user?.credit_balance ?? 991;
    if (currentCredits < totalCreditsNeeded) {
      setToastMsg('Số dư credit không đủ. Vui lòng nạp thêm credit để tiếp tục tạo!');
      setTopupOpen(true);
      return;
    }

    setIsGenerating(true);

    if (activeTab === 'chat') {
      setToastMsg(`Đang khởi tạo yêu cầu với ${currentModelObj.name}...`);
      setTimeout(() => {
        addCredits(-totalCreditsNeeded);
        setChatMessages((prev) => [
          ...prev,
          { role: 'user', content: prompt, model: currentModelObj.name },
          {
            role: 'assistant',
            content: `[${currentModelObj.name}] Cảm ơn bạn đã gửi prompt: "${prompt}". Đây là câu trả lời được tối ưu hóa từ cụm mô hình AI Gateway.`,
            model: currentModelObj.name,
          },
        ]);
        setIsGenerating(false);
        setPrompt('');
      }, 1200);
      return;
    }

    // IMAGE or VIDEO -> Spawn animated Job Cards
    const jobBatchId = `job-${Date.now()}`;
    const newJobs: GenerationJob[] = Array.from({ length: outputCount }).map((_, idx) => ({
      id: `${jobBatchId}-${idx}`,
      type: activeTab,
      prompt: prompt,
      model: currentModelObj.name,
      progress: 15,
      statusText: t('studio.queued', 'Đang xếp hàng...'),
      aspectRatio: aspectRatio,
      refImage: refImage,
    }));

    setActiveJobs((prev) => [...newJobs, ...prev]);
    setToastMsg(`Đang tạo ${outputCount} job với ${currentModelObj.name}...`);

    // Progressive rendering simulation
    let progressStep = 15;
    const interval = setInterval(() => {
      progressStep += 25;
      setActiveJobs((prev) =>
        prev.map((job) => {
          if (newJobs.some((nj) => nj.id === job.id)) {
            let status = t('studio.rendering', 'Đang sinh dữ liệu...');
            if (progressStep >= 75) status = t('studio.upscaling', 'Hậu kỳ & Nâng cấp 4K...');
            if (progressStep >= 100) status = t('studio.completed', 'Hoàn tất!');
            return {
              ...job,
              progress: Math.min(progressStep, 100),
              statusText: status,
            };
          }
          return job;
        })
      );

      if (progressStep >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Deduct credit
          addCredits(-totalCreditsNeeded);

          if (activeTab === 'image') {
            const stockImages = [
              'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
            ];

            const completedImages: GeneratedImageItem[] = newJobs.map((_, idx) => ({
              id: `img-${Date.now()}-${idx}`,
              url: stockImages[idx % stockImages.length],
              prompt: prompt,
              model: currentModelObj.name,
              aspectRatio: aspectRatio,
              quality: quality === 'ultra_4k' ? 'Ultra 4K' : quality === 'hd' ? 'HD 2K' : 'Standard',
              createdAt: 'Vừa xong',
            }));

            setGeneratedImages((prev) => [...completedImages, ...prev]);
          } else if (activeTab === 'video') {
            const stockPosters = [
              'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
            ];

            const completedVideos: GeneratedVideoItem[] = newJobs.map((_, idx) => ({
              id: `vid-${Date.now()}-${idx}`,
              title: `AI Video: ${prompt.slice(0, 24)}...`,
              prompt: prompt,
              model: currentModelObj.name,
              poster: stockPosters[idx % stockPosters.length],
              duration: duration,
              quality: '1080p FHD',
              createdAt: 'Vừa xong',
            }));

            setGeneratedVideos((prev) => [...completedVideos, ...prev]);
          }

          // Remove completed jobs from active list
          setActiveJobs((prev) => prev.filter((job) => !newJobs.some((nj) => nj.id === job.id)));
          setIsGenerating(false);
          setToastMsg(`Đã hoàn tất tạo ${outputCount} ${activeTab === 'image' ? 'ảnh' : 'video'}!`);
          setTimeout(() => setToastMsg(null), 3000);
        }, 500);
      }
    }, 600);
  };

  return (
    <div className={styles.studioLayout}>
      {toastMsg && (
        <div className={styles.toastNotice}>
          <HiOutlineCheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Bar inside Studio */}
      <div className={styles.studioHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.categoryTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('chat');
                navigate('/studio?category=chat');
              }}
            >
              <HiOutlineChatBubbleLeftRight size={18} />
              <span>{t('studio.cat_chat', 'Chat')}</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'image' ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('image');
                navigate('/studio?category=image');
              }}
            >
              <HiOutlinePhoto size={18} />
              <span>{t('studio.cat_image', 'Hình Ảnh')}</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'video' ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('video');
                navigate('/studio?category=video');
              }}
            >
              <HiOutlineFilm size={18} />
              <span>{t('studio.cat_video', 'Video')}</span>
            </button>
          </div>
        </div>

        {/* Model Selector & Credit Pill */}
        <div className={styles.headerRight}>
          <div className={styles.modelSelectorBox}>
            <span className={styles.selectorLabel}>Mô hình:</span>
            <select
              className={styles.modelSelect}
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              {currentCategoryObj.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider}) — {m.credits}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.creditPill} onClick={() => setTopupOpen(true)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RiSparklingFill size={13} color="#2dd4bf" />
              {user?.credit_balance ?? 991} cr
            </span>
            <button type="button" className={styles.miniTopupBtn}>Nạp</button>
          </div>
        </div>
      </div>

      {/* Main Studio Canvas Area (Chứa Jobs, Gallery & Chat History) */}
      <div className={styles.canvasContainer}>
        {/* CHAT MODE */}
        {activeTab === 'chat' && (
          <div className={styles.chatArea}>
            <div className={styles.messagesList}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.assistantRow}`}
                >
                  <div className={styles.avatarBox}>
                    {msg.role === 'user' ? (
                      <HiOutlineUser size={18} color="#94a3b8" />
                    ) : (
                      <RiOpenaiFill size={18} color="#10a37f" />
                    )}
                  </div>
                  <div className={styles.messageBubble}>
                    <div className={styles.bubbleMeta}>{msg.model}</div>
                    <div className={styles.bubbleContent}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                  <div className={styles.avatarBox}>
                    <RiOpenaiFill size={18} color="#10a37f" />
                  </div>
                  <div className={styles.messageBubble}>
                    <div className={styles.typingIndicator}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IMAGE MODE */}
        {activeTab === 'image' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>Bộ Sưu Tập Đã Tạo</span>
                <span className={styles.countBadge}>{generatedImages.length + activeJobs.length}</span>
              </h3>
            </div>

            <div className={styles.compactGalleryGrid}>
              {/* ACTIVE GENERATION JOB CARDS (Hiệu ứng khi tạo job) */}
              {activeJobs.map((job) => (
                <div key={job.id} className={styles.activeJobCard}>
                  <div className={styles.jobVisualBox}>
                    {/* Laser Scanner Line Effect */}
                    <div className={styles.scannerLine}></div>

                    {/* Background shimmer or ref image thumbnail */}
                    {job.refImage ? (
                      <img src={job.refImage} alt="Ref" className={styles.refGhostImg} />
                    ) : (
                      <div className={styles.matrixShimmer}></div>
                    )}

                    <div className={styles.jobStatusOverlay}>
                      <div className={styles.pulseRadar}>
                        <HiOutlineSparkles size={22} className={styles.spinIcon} />
                      </div>
                      <div className={styles.jobPercent}>{job.progress}%</div>
                      <div className={styles.jobStatusText}>{job.statusText}</div>
                    </div>
                  </div>

                  <div className={styles.jobCardFooter}>
                    <div className={styles.jobModelRow}>
                      <span className={styles.jobBadge}>{job.model}</span>
                      <span className={styles.jobRatioBadge}>{job.aspectRatio}</span>
                    </div>
                    <p className={styles.jobPromptText}>{job.prompt}</p>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPACT COMPLETED IMAGE CARDS */}
              {generatedImages.map((img) => (
                <div key={img.id} className={styles.compactMediaCard}>
                  <div
                    className={styles.imageWrapper}
                    onClick={() =>
                      setPreviewMedia({
                        type: 'image',
                        url: img.url,
                        title: 'Chi tiết tác phẩm AI',
                        prompt: img.prompt,
                        model: img.model,
                      })
                    }
                  >
                    <img src={img.url} alt={img.prompt} loading="lazy" />

                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Xem toàn màn hình"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'image',
                            url: img.url,
                            title: 'Chi tiết tác phẩm AI',
                            prompt: img.prompt,
                            model: img.model,
                          });
                        }}
                      >
                        <HiOutlineArrowsPointingOut size={16} />
                      </button>

                      <a
                        href={img.url}
                        download={`velox-${img.id}.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.actionBtn}
                        title="Tải ảnh 4K"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HiOutlineArrowDownTray size={16} />
                      </a>
                    </div>
                  </div>

                  <div className={styles.compactDetails}>
                    <div className={styles.metaRow}>
                      <span className={styles.mediaModelBadge}>{img.model}</span>
                      {img.aspectRatio && (
                        <span className={styles.ratioPill}>{img.aspectRatio}</span>
                      )}
                    </div>
                    <p className={styles.mediaPrompt} title={img.prompt}>
                      {img.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO MODE */}
        {activeTab === 'video' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>Danh Sách Video Đã Tạo</span>
                <span className={styles.countBadge}>{generatedVideos.length + activeJobs.length}</span>
              </h3>
            </div>

            <div className={styles.compactGalleryGrid}>
              {/* ACTIVE VIDEO JOB CARDS */}
              {activeJobs.map((job) => (
                <div key={job.id} className={styles.activeJobCard}>
                  <div className={styles.jobVisualBox}>
                    <div className={styles.scannerLine}></div>
                    <div className={styles.matrixShimmer}></div>

                    <div className={styles.jobStatusOverlay}>
                      <div className={styles.pulseRadar}>
                        <HiOutlineFilm size={22} className={styles.spinIcon} />
                      </div>
                      <div className={styles.jobPercent}>{job.progress}%</div>
                      <div className={styles.jobStatusText}>{job.statusText}</div>
                    </div>
                  </div>

                  <div className={styles.jobCardFooter}>
                    <div className={styles.jobModelRow}>
                      <span className={styles.jobBadge}>{job.model}</span>
                      <span className={styles.jobRatioBadge}>{job.aspectRatio}</span>
                    </div>
                    <p className={styles.jobPromptText}>{job.prompt}</p>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETED VIDEO CARDS */}
              {generatedVideos.map((vid) => (
                <div key={vid.id} className={styles.compactMediaCard}>
                  <div
                    className={styles.videoThumbnailBox}
                    onClick={() =>
                      setPreviewMedia({
                        type: 'video',
                        url: vid.poster,
                        title: vid.title,
                        prompt: vid.prompt,
                        model: vid.model,
                      })
                    }
                  >
                    <img src={vid.poster} alt={vid.title} loading="lazy" />
                    <div className={styles.playIconOverlay}>
                      <HiOutlinePlay size={24} />
                    </div>

                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Xem toàn màn hình"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'video',
                            url: vid.poster,
                            title: vid.title,
                            prompt: vid.prompt,
                            model: vid.model,
                          });
                        }}
                      >
                        <HiOutlineArrowsPointingOut size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.compactDetails}>
                    <div className={styles.metaRow}>
                      <span className={styles.mediaModelBadge}>{vid.model}</span>
                      {vid.duration && (
                        <span className={styles.ratioPill}>
                          <HiOutlineClock size={11} /> {vid.duration}
                        </span>
                      )}
                    </div>
                    <h4 className={styles.videoTitle}>{vid.title}</h4>
                    <p className={styles.mediaPrompt} title={vid.prompt}>
                      {vid.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM STUDIO CONTROL PANEL: Nằm ở dưới như lúc đầu, thanh công cụ tạo và nhập prompt */}
      <div className={styles.bottomControlPanel}>
        <div className={styles.controlContainer}>
          {/* Main Input Box with Integrated Controls */}
          <div className={styles.promptInputBox} onPaste={handlePasteEvent}>
            {/* Reference Image Preview Thumbnail if attached */}
            {refImage && (
              <div className={styles.refImagePreviewRow}>
                <div className={styles.refThumbnailBox}>
                  <img src={refImage} alt="Ref preview" />
                  <button
                    type="button"
                    className={styles.removeRefBtn}
                    onClick={() => setRefImage(null)}
                    title="Gỡ ảnh tham chiếu"
                  >
                    <HiOutlineXMark size={14} />
                  </button>
                </div>
                <div className={styles.refLabelBox}>
                  <span className={styles.refTitle}>{t('studio.ref_image', 'Ảnh tham chiếu')}</span>
                  <span className={styles.refDesc}>
                    {activeTab === 'image'
                      ? 'AI sẽ phối màu & phong cách dựa trên ảnh này (Image-to-Image)'
                      : 'AI sẽ tạo chuyển động sống động từ bức ảnh này (Image-to-Video)'}
                  </span>
                </div>
              </div>
            )}

            {/* Prompt Textarea */}
            <textarea
              className={styles.promptTextarea}
              placeholder={
                activeTab === 'chat'
                  ? `Nhập câu hỏi hoặc yêu cầu cho ${currentModelObj.name}...`
                  : activeTab === 'image'
                  ? `Mô tả chi tiết hình ảnh muốn tạo (hoặc dán Ctrl+V ảnh tham chiếu vào đây)...`
                  : `Mô tả cảnh quay video và chuyển động camera cho ${currentModelObj.name}...`
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              rows={activeTab === 'chat' ? 2 : 2}
            />

            {/* Hidden File Input for Reference Image */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            {/* Bottom Actions & Parameters Bar */}
            <div className={styles.promptActionsRow}>
              <div className={styles.optionsGroup}>
                {/* 1. Nút tải/dán ảnh tham chiếu (Image & Video) */}
                {activeTab !== 'chat' && (
                  <button
                    type="button"
                    className={`${styles.optChipBtn} ${refImage ? styles.chipActive : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn tệp ảnh hoặc dán trực tiếp (Ctrl+V) ảnh tham chiếu"
                  >
                    <HiOutlinePhoto size={16} />
                    <span>{refImage ? 'Đã đính kèm ảnh' : t('studio.ref_image', 'Ảnh tham chiếu')}</span>
                  </button>
                )}

                {/* 2. Chọn Tỉ lệ khung hình (Aspect Ratio) */}
                {activeTab !== 'chat' && (
                  <div className={styles.selectControl}>
                    <span className={styles.selectLabel}>{t('studio.aspect_ratio', 'Tỉ lệ')}:</span>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className={styles.compactSelect}
                    >
                      <option value="1:1">1:1 (Vuông)</option>
                      <option value="16:9">16:9 (Ngang / YouTube)</option>
                      <option value="9:16">9:16 (Dọc / TikTok)</option>
                      <option value="4:3">4:3 (Tiêu chuẩn)</option>
                      <option value="3:4">3:4 (Chân dung)</option>
                      {activeTab === 'image' && <option value="21:9">21:9 (Cinematic)</option>}
                    </select>
                  </div>
                )}

                {/* 3. Chọn số lượng ảnh / video xuất ra */}
                {activeTab !== 'chat' && (
                  <div className={styles.selectControl}>
                    <span className={styles.selectLabel}>
                      {activeTab === 'image' ? 'Số ảnh' : 'Số video'}:
                    </span>
                    <select
                      value={outputCount}
                      onChange={(e) => setOutputCount(Number(e.target.value))}
                      className={styles.compactSelect}
                    >
                      <option value={1}>1 {activeTab === 'image' ? 'ảnh' : 'video'}</option>
                      <option value={2}>2 {activeTab === 'image' ? 'ảnh (2x)' : 'videos (2x)'}</option>
                      {activeTab === 'image' && <option value={4}>4 ảnh (4x)</option>}
                    </select>
                  </div>
                )}

                {/* 4. Chọn Chất lượng ảnh hoặc Thời lượng video */}
                {activeTab === 'image' && (
                  <div className={styles.selectControl}>
                    <span className={styles.selectLabel}>{t('studio.quality', 'Chất lượng')}:</span>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as any)}
                      className={styles.compactSelect}
                    >
                      <option value="standard">Standard (1K)</option>
                      <option value="hd">HD (2K)</option>
                      <option value="ultra_4k">Ultra (4K)</option>
                    </select>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className={styles.selectControl}>
                    <span className={styles.selectLabel}>{t('studio.duration', 'Thời lượng')}:</span>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value as any)}
                      className={styles.compactSelect}
                    >
                      <option value="5s">5 giây</option>
                      <option value="10s">10 giây (Pro)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Submit & Total Credits Cost Button */}
              <div className={styles.submitArea}>
                <div className={styles.costBadge}>
                  <HiOutlineBolt size={14} />
                  <span>{totalCreditsNeeded} cr</span>
                </div>

                <button
                  type="button"
                  className={styles.generateBtn}
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <span className={styles.spinnerPulse} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <RiReactjsFill size={16} color="#61dafb" style={{ animation: 'spin360 2s linear infinite' }} />
                      <span>Đang tạo...</span>
                    </span>
                  ) : (
                    <>
                      <HiOutlineSparkles size={16} />
                      <span>Tạo Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewMedia && (
        <div className={styles.lightboxBackdrop} onClick={() => setPreviewMedia(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setPreviewMedia(null)}
            >
              <HiOutlineXMark size={20} />
            </button>

            <div className={styles.lightboxImageWrapper}>
              <img src={previewMedia.url} alt={previewMedia.prompt} />
            </div>

            <div className={styles.lightboxMeta}>
              <div className={styles.lightboxModelRow}>
                <span className={styles.lightboxModelBadge}>{previewMedia.model}</span>
                <a
                  href={previewMedia.url}
                  download="velox-asset.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.lightboxDownloadBtn}
                >
                  <HiOutlineArrowDownTray size={15} /> Tải bản gốc Ultra 4K
                </a>
              </div>
              <p className={styles.lightboxPrompt}>{previewMedia.prompt}</p>
            </div>
          </div>
        </div>
      )}

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default StudioPage;
