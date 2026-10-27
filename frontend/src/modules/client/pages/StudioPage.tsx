import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineSparkles,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import { STUDIO_CATEGORIES } from '@modules/core/components/StudioMegaMenu/StudioMegaMenu';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './StudioPage.module.scss';

export const StudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, addCredits } = useAuthStore();

  const urlCategory = searchParams.get('category') as 'chat' | 'image' | 'video' | null;
  const urlModel = searchParams.get('model');

  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video'>('chat');
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Results state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; model: string }>>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI cao cấp tại VeloX Studio. Bạn muốn tôi hỗ trợ viết code, phân tích dữ liệu, hay giải quyết vấn đề gì hôm nay?',
      model: 'gpt-4o',
    },
  ]);

  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; url: string; prompt: string; model: string }>>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      prompt: 'A powerful athlete training in modern dark neon gym, cinematic lighting, 8k resolution',
      model: 'midjourney-v6',
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Futuristic AI fitness laboratory with holograms and dynamic pulse tracking',
      model: 'flux-1-dev',
    },
  ]);

  const [generatedVideos, setGeneratedVideos] = useState<Array<{ id: string; title: string; prompt: string; model: string; poster: string }>>([
    {
      id: 'vid-1',
      title: 'Cinematic Gym Motivation 4K',
      prompt: 'Hyper-realistic video of athlete running through neon rain city, smooth slow-motion camera orbit',
      model: 'runway-gen3',
      poster: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
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

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    const creditCost = activeTab === 'chat' ? 15 : activeTab === 'image' ? 35 : 80;
    const currentCredits = user?.credit_balance ?? 991;

    if (currentCredits < creditCost) {
      setToastMsg('Số dư credit của bạn không đủ. Vui lòng nạp thêm credit để tiếp tục sáng tạo!');
      setTopupOpen(true);
      return;
    }

    setIsGenerating(true);
    setToastMsg(`Đang khởi tạo yêu cầu với ${currentModelObj.name}...`);

    setTimeout(() => {
      // Deduct credit
      addCredits(-creditCost);

      if (activeTab === 'chat') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'user', content: prompt, model: currentModelObj.name },
          {
            role: 'assistant',
            content: `[${currentModelObj.name}] Cảm ơn bạn đã gửi prompt: "${prompt}". Đây là phản hồi phân tích chi tiết từ mô hình ${currentModelObj.name} với độ chính xác cao và tối ưu hóa ngữ cảnh.`,
            model: currentModelObj.name,
          },
        ]);
      } else if (activeTab === 'image') {
        setGeneratedImages((prev) => [
          {
            id: `img-${Date.now()}`,
            url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
            prompt: prompt,
            model: currentModelObj.name,
          },
          ...prev,
        ]);
      } else if (activeTab === 'video') {
        setGeneratedVideos((prev) => [
          {
            id: `vid-${Date.now()}`,
            title: `AI Video: ${prompt.slice(0, 30)}...`,
            prompt: prompt,
            model: currentModelObj.name,
            poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
          },
          ...prev,
        ]);
      }

      setIsGenerating(false);
      setPrompt('');
      setToastMsg(`Đã tạo thành công với ${currentModelObj.name}! Trừ ${creditCost} credit.`);
      setTimeout(() => setToastMsg(null), 3000);
    }, 1800);
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
              <span>Chat</span>
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
              <span>Hình Ảnh</span>
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
              <span>Video</span>
            </button>
          </div>
        </div>

        {/* Model Selector Pill */}
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
            <span>💎 {user?.credit_balance ?? 991} cr</span>
            <button type="button" className={styles.miniTopupBtn}>Nạp</button>
          </div>
        </div>
      </div>

      {/* Main Studio Canvas Area */}
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
                    {msg.role === 'user' ? '👤' : '⚡'}
                  </div>
                  <div className={styles.messageBubble}>
                    <div className={styles.bubbleMeta}>{msg.model}</div>
                    <div className={styles.bubbleContent}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                  <div className={styles.avatarBox}>⚡</div>
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
            <div className={styles.galleryGrid}>
              {generatedImages.map((img) => (
                <div key={img.id} className={styles.mediaCard}>
                  <div className={styles.imageWrapper}>
                    <img src={img.url} alt={img.prompt} />
                  </div>
                  <div className={styles.mediaDetails}>
                    <div className={styles.mediaModelBadge}>{img.model}</div>
                    <p className={styles.mediaPrompt}>{img.prompt}</p>
                    <a href={img.url} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
                      <HiOutlineArrowDownTray size={14} /> Tải ảnh gốc 4K
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO MODE */}
        {activeTab === 'video' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.videoGrid}>
              {generatedVideos.map((vid) => (
                <div key={vid.id} className={styles.videoCard}>
                  <div className={styles.videoThumbnailBox}>
                    <img src={vid.poster} alt={vid.title} />
                    <div className={styles.playIconOverlay}>▶</div>
                  </div>
                  <div className={styles.mediaDetails}>
                    <div className={styles.mediaModelBadge}>{vid.model}</div>
                    <h4 className={styles.videoTitle}>{vid.title}</h4>
                    <p className={styles.mediaPrompt}>{vid.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Input Prompt Bar */}
        <div className={styles.promptBarWrapper}>
          <div className={styles.promptInputBox}>
            <textarea
              className={styles.promptTextarea}
              placeholder={
                activeTab === 'chat'
                  ? `Nhập câu hỏi hoặc yêu cầu cho ${currentModelObj.name}...`
                  : activeTab === 'image'
                  ? `Mô tả hình ảnh bạn muốn tạo với ${currentModelObj.name} (ví dụ: Cinematic lighting, 8k, modern gym)...`
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
              rows={2}
            />

            <div className={styles.promptActions}>
              <div className={styles.costBadge}>
                <HiOutlineBolt size={14} />
                <span>
                  {activeTab === 'chat' ? '15' : activeTab === 'image' ? '35' : '80'} cr/lần
                </span>
              </div>

              <button
                type="button"
                className={styles.generateBtn}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <span className={styles.spinnerIcon}>⌛</span>
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

      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default StudioPage;
