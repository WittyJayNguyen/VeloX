import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlinePhoto,
  HiOutlineFilm,
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineArrowsPointingOut,
  HiOutlinePlay,
  HiOutlineArrowUp,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineBookOpen,
  HiOutlineChevronDown,
  HiOutlineMusicalNote,
  HiOutlineCheck,
} from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './StudioPage.module.scss';

export interface GenerationJob {
  id: string;
  type: 'image' | 'video' | 'audio';
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

// Preset Prompts for "Inspire Me"
const INSPIRATION_PROMPTS = [
  'A mystical cyberpunk samurai standing under rain in neon Tokyo, volumetric light, 8k octane render',
  'Macro shot of a futuristic crystal lotus flower with glowing fiber-optic petals in morning dew',
  'Cinematic dynamic motion of an elite athlete sprinting through a luminous hologram track, slow-motion',
  'Hyper-detailed portrait of an ancient Nordic warrior with bioluminescent glowing runic tattoos, photorealistic',
  'Surreal floating islands with cascading golden waterfalls under purple nebula aurora borealis sky',
  'Retro-futuristic 1980s synthwave sports car speeding on a laser grid highway into a sunset',
];

// Clean redundant provider prefixes from model display names
export const cleanModelDisplayName = (name: string): string => {
  if (!name) return '';
  return name.replace(/^OpenAI\s+/i, '').replace(/^Google\s+/i, '').trim();
};

// 4-Bar Sound Wave Icon (1:1 with Krea/Audio mockup)
export const SoundWaveIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="1.5" y="5" width="2" height="6" rx="1" />
    <rect x="5.5" y="2" width="2" height="12" rx="1" />
    <rect x="9.5" y="4" width="2" height="8" rx="1" />
    <rect x="13.5" y="6" width="2" height="4" rx="1" />
  </svg>
);

export const StudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, addCredits } = useAuthStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const urlCategory = searchParams.get('category') as 'image' | 'video' | 'audio' | null;
  const urlModel = searchParams.get('model');

  // Studio Mode: 'image' | 'video' | 'audio'
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>(urlCategory || 'image');
  const [dbModels, setDbModels] = useState<PublicModelItem[]>([]);
  const [selectedModelCode, setSelectedModelCode] = useState<string>('gpt-image-2.5-sunburst');
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Popover Menus
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const [isParamsMenuOpen, setIsParamsMenuOpen] = useState<boolean>(false);
  const [isInspireMenuOpen, setIsInspireMenuOpen] = useState<boolean>(false);
  const [isSpeechRecording, setIsSpeechRecording] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Media Slots for Image / Video
  const [refImage, setRefImage] = useState<string | null>(null);
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [audioTrack, setAudioTrack] = useState<string | null>(null);

  // Advanced Generation Settings
  const [resolution, setResolution] = useState<string>('1K');
  const [aspectRatio, setAspectRatio] = useState<string>('Tự động');
  const [quality, setQuality] = useState<string>('Cao');
  const [audioVoice, setAudioVoice] = useState<string>('English · American');

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

  // Load models dynamically from Admin Database via API
  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      try {
        const data = await modelService.getPublicModels();
        if (isMounted && data && data.length > 0) {
          setDbModels(data);
        }
      } catch (err) {
        console.error('Failed to load database models for studio:', err);
      }
    };
    fetchModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and merge models for current active tab (Both DB models and standard creative models)
  const availableModels = useMemo(() => {
    if (activeTab === 'image') {
      const dbImageModels = dbModels.filter((m) => m.category?.toUpperCase() === 'IMAGE');
      const standardImageModels: PublicModelItem[] = [
        { id: 'img-std-1', name: 'GPT Image 2.5 Sunburst', model_code: 'gpt-image-2.5-sunburst', provider: 'OpenAI', selling_credit_price: 35, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-2', name: 'FLUX.1 [dev/pro]', model_code: 'flux-1-dev', provider: 'Black Forest Labs', selling_credit_price: 25, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-3', name: 'Midjourney v6.1 Ultra', model_code: 'midjourney-v6.1', provider: 'Midjourney', selling_credit_price: 45, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'img-std-4', name: 'DALL-E 3 Ultra', model_code: 'dall-e-3', provider: 'OpenAI', selling_credit_price: 30, category: 'IMAGE', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      ];
      const map = new Map<string, PublicModelItem>();
      standardImageModels.forEach((m) => map.set(m.model_code, m));
      dbImageModels.forEach((m) => map.set(m.model_code, m));
      return Array.from(map.values());
    }

    if (activeTab === 'video') {
      const dbVideoModels = dbModels.filter((m) => m.category?.toUpperCase() === 'VIDEO');
      const standardVideoModels: PublicModelItem[] = [
        { id: 'vid-std-1', name: 'Seedance 2.5', model_code: 'seedance-2.5', provider: 'ByteDance', selling_credit_price: 80, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-2', name: 'Runway Gen-3 Alpha', model_code: 'runway-gen3-alpha', provider: 'Runway', selling_credit_price: 95, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-3', name: 'Minimax Video-01', model_code: 'minimax-video-01', provider: 'MiniMax', selling_credit_price: 75, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-4', name: 'Kling AI v1.5 Pro', model_code: 'kling-v1.5-pro', provider: 'Kuaishou', selling_credit_price: 75, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
        { id: 'vid-std-5', name: 'Grok Imagine Video 1.5', model_code: 'grok-imagine-video-1.5', provider: 'OpenAI', selling_credit_price: 18, category: 'VIDEO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      ];
      const map = new Map<string, PublicModelItem>();
      standardVideoModels.forEach((m) => map.set(m.model_code, m));
      dbVideoModels.forEach((m) => {
        if (!map.has(m.model_code)) {
          map.set(m.model_code, m);
        }
      });
      return Array.from(map.values());
    }

    // Audio Mode: strictly audio models
    const dbAudioModels = dbModels.filter((m) => m.category?.toUpperCase() === 'AUDIO');
    const standardAudioModels: PublicModelItem[] = [
      { id: 'aud-std-1', name: 'Eleven v3', model_code: 'eleven-multilingual-v3', provider: 'ElevenLabs', selling_credit_price: 15, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      { id: 'aud-std-2', name: 'OpenAI TTS HD', model_code: 'tts-1-hd', provider: 'OpenAI', selling_credit_price: 20, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
      { id: 'aud-std-3', name: 'Chatterbox Turbo', model_code: 'chatterbox-turbo', provider: 'Meta', selling_credit_price: 10, category: 'AUDIO', is_available: true, input_credit_price: 0, output_credit_price: 0, cache_read_credit_price: 0 },
    ];
    const map = new Map<string, PublicModelItem>();
    standardAudioModels.forEach((m) => map.set(m.model_code, m));
    dbAudioModels.forEach((m) => map.set(m.model_code, m));
    return Array.from(map.values());
  }, [activeTab, dbModels]);

  // Sync selected model code when active tab changes or models load
  useEffect(() => {
    if (urlModel && availableModels.some((m) => m.model_code === urlModel)) {
      setSelectedModelCode(urlModel);
    } else if (availableModels.length > 0) {
      if (!availableModels.some((m) => m.model_code === selectedModelCode)) {
        setSelectedModelCode(availableModels[0].model_code);
      }
    }
  }, [availableModels, urlModel]);

  // Sync with URL params
  useEffect(() => {
    if (urlCategory && ['image', 'video', 'audio'].includes(urlCategory)) {
      setActiveTab(urlCategory);
      if (urlCategory === 'image') setSelectedModelCode('gpt-image-2.5-sunburst');
      else if (urlCategory === 'video') setSelectedModelCode('seedance-2.5');
      else if (urlCategory === 'audio') setSelectedModelCode('eleven-multilingual-v3');
    }
  }, [urlCategory]);

  // Tab switch handler that automatically picks the right primary model
  const handleTabChange = (newTab: 'image' | 'video' | 'audio') => {
    setActiveTab(newTab);
    setIsModelMenuOpen(false);
    setIsParamsMenuOpen(false);
    setIsInspireMenuOpen(false);
    if (newTab === 'image') {
      setSelectedModelCode('gpt-image-2.5-sunburst');
    } else if (newTab === 'video') {
      setSelectedModelCode('seedance-2.5');
    } else if (newTab === 'audio') {
      setSelectedModelCode('eleven-multilingual-v3');
    }
  };

  const currentModel = useMemo(() => {
    return availableModels.find((m) => m.model_code === selectedModelCode) || availableModels[0];
  }, [availableModels, selectedModelCode]);

  // Compute Credits Needed
  const totalCreditsNeeded = currentModel?.selling_credit_price || (activeTab === 'image' ? 35 : activeTab === 'video' ? 80 : 15);

  // File Upload Helper
  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
        setToastMsg(`Đã tải ${label} thành công!`);
        setTimeout(() => setToastMsg(null), 2500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Paste Event Handler (Clipboard Image)
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

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMsg('Trình duyệt không hỗ trợ Web Speech API.');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }
    if (isSpeechRecording) {
      setIsSpeechRecording(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsSpeechRecording(true);
      recognition.onend = () => setIsSpeechRecording(false);
      recognition.onresult = (evt: any) => {
        const transcript = evt.results[0][0].transcript;
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.start();
    } catch (err) {
      setIsSpeechRecording(false);
    }
  };

  // Generate / Submit Job
  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    const currentCredits = user?.credit_balance ?? 991;
    if (currentCredits < totalCreditsNeeded) {
      setToastMsg(`Số dư Credit không đủ (Cần ${totalCreditsNeeded} cr). Vui lòng nạp thêm!`);
      setTopupOpen(true);
      return;
    }

    setIsGenerating(true);
    addCredits(-totalCreditsNeeded);

    const newJobId = `job-${Date.now()}`;
    const selectedModelName = cleanModelDisplayName(currentModel?.name || 'VeloX Engine');
    const newJob: GenerationJob = {
      id: newJobId,
      type: activeTab,
      prompt,
      model: selectedModelName,
      progress: 5,
      statusText: 'Đang xếp hàng trong cụm GPU...',
      aspectRatio,
      refImage,
    };

    setActiveJobs((prev) => [newJob, ...prev]);

    // Simulated Render Stages
    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 35, statusText: 'Đang sinh mẫu neural...' } : j))
      );
    }, 1200);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 75, statusText: 'Đang nâng cấp chất lượng cao...' } : j))
      );
    }, 2800);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 98, statusText: 'Hoàn tất xuất file!' } : j))
      );
    }, 4200);

    setTimeout(() => {
      setActiveJobs((prev) => prev.filter((j) => j.id !== newJobId));
      setIsGenerating(false);

      if (activeTab === 'image') {
        const demoUrls = [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
        ];
        const newImg: GeneratedImageItem = {
          id: `img-${Date.now()}`,
          url: demoUrls[Math.floor(Math.random() * demoUrls.length)],
          prompt,
          model: selectedModelName,
          aspectRatio,
          quality,
          createdAt: 'Vừa xong',
        };
        setGeneratedImages((prev) => [newImg, ...prev]);
      } else if (activeTab === 'video') {
        const newVid: GeneratedVideoItem = {
          id: `vid-${Date.now()}`,
          title: prompt.slice(0, 32) + '...',
          prompt,
          model: selectedModelName,
          poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
          duration: '5s',
          quality: '1080p FHD',
          createdAt: 'Vừa xong',
        };
        setGeneratedVideos((prev) => [newVid, ...prev]);
      }

      setToastMsg('Tác phẩm AI đã được sinh hoàn tất!');
      setTimeout(() => setToastMsg(null), 3000);
    }, 4800);
  };

  return (
    <div className={styles.studioLayout} onClick={() => {
      setIsModelMenuOpen(false);
      setIsParamsMenuOpen(false);
      setIsInspireMenuOpen(false);
    }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className={styles.toastNotice}>
          <HiOutlineCheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Canvas & Media Gallery */}
      <div className={styles.canvasContainer}>
        {/* IMAGE MODE */}
        {activeTab === 'image' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>Danh Sách Tác Phẩm Đã Tạo</span>
                <span className={styles.countBadge}>{generatedImages.length + activeJobs.length}</span>
              </h3>
            </div>

            <div className={styles.compactGalleryGrid}>
              {/* ACTIVE IMAGE JOBS */}
              {activeJobs.map((job) => (
                <div key={job.id} className={styles.activeJobCard}>
                  <div className={styles.jobVisualBox}>
                    <div className={styles.scannerLine}></div>
                    <div className={styles.matrixShimmer}></div>
                    <div className={styles.jobStatusOverlay}>
                      <div className={styles.pulseRadar}>
                        <HiOutlinePhoto size={22} className={styles.spinIcon} />
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
                      <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETED IMAGES */}
              {generatedImages.map((img) => (
                <div key={img.id} className={styles.compactMediaCard}>
                  <div
                    className={styles.mediaThumbnailBox}
                    onClick={() =>
                      setPreviewMedia({
                        type: 'image',
                        url: img.url,
                        title: 'Tác Phẩm AI',
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
                            title: 'Tác Phẩm AI',
                            prompt: img.prompt,
                            model: img.model,
                          });
                        }}
                      >
                        <HiOutlineArrowsPointingOut size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.compactDetails}>
                    <div className={styles.metaRow}>
                      <span className={styles.mediaModelBadge}>{img.model}</span>
                      {img.aspectRatio && <span className={styles.ratioPill}>{img.aspectRatio}</span>}
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
              {/* ACTIVE VIDEO JOBS */}
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
                      <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* COMPLETED VIDEOS */}
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

        {/* AUDIO MODE */}
        {activeTab === 'audio' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>Danh Sách Âm Thanh Đã Sinh</span>
                <span className={styles.countBadge}>0</span>
              </h3>
            </div>
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <HiOutlineMusicalNote size={48} color="#ff6b35" style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p>Chưa có file âm thanh nào. Hãy nhập văn bản bên dưới để tạo giọng nói AI sống động!</p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PROMPT CONTROL BAR (Chuẩn 1:1 theo mẫu thiết kế Krea/Higgsfield) */}
      <div className={styles.bottomControlPanel}>
        <div className={styles.controlContainer}>
          <div className={styles.promptInputBox} onPaste={handlePasteEvent} onClick={(e) => e.stopPropagation()}>
            {/* TOP BAR: Slots Attachment & Inspire Me */}
            <div className={styles.promptTopBar}>
              {/* Left Attachment Slots */}
              <div className={styles.slotsGroup}>
                {/* Mode Ảnh: Slot Ref */}
                {activeTab === 'image' && (
                  <button
                    type="button"
                    className={`${styles.refSlotBtn} ${refImage ? styles.slotActive : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    title="Đính kèm ảnh tham chiếu (Image-to-Image)"
                  >
                    {refImage ? (
                      <>
                        <img src={refImage} alt="Ref" className={styles.slotThumbnail} />
                        <span
                          className={styles.clearSlotBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRefImage(null);
                          }}
                        >
                          ✕
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.slotIconWithPlus}>
                          <HiOutlinePhoto size={15} />
                          <span className={styles.subPlus}>+</span>
                        </span>
                        <span className={styles.slotLabel}>Ref</span>
                      </>
                    )}
                  </button>
                )}

                {/* Mode Video: Hàng 5 Slots [Bắt đầu] -> [Kết th...] [Ref] [Video] [Âm th...] */}
                {activeTab === 'video' && (
                  <>
                    {/* 1. Bắt đầu (Start Frame) */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${startFrame ? styles.slotActive : ''}`}
                      onClick={() => startFrameInputRef.current?.click()}
                      title="Frame hình bắt đầu"
                    >
                      {startFrame ? (
                        <>
                          <img src={startFrame} alt="Start" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStartFrame(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>Bắt đầu</span>
                        </>
                      )}
                    </button>

                    <span className={styles.slotArrow}>→</span>

                    {/* 2. Kết thúc (End Frame) */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${endFrame ? styles.slotActive : ''}`}
                      onClick={() => endFrameInputRef.current?.click()}
                      title="Frame hình kết thúc"
                    >
                      {endFrame ? (
                        <>
                          <img src={endFrame} alt="End" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEndFrame(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>Kết th...</span>
                        </>
                      )}
                    </button>

                    {/* 3. Ref */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${refImage ? styles.slotActive : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      title="Ảnh tham chiếu phong cách"
                    >
                      {refImage ? (
                        <>
                          <img src={refImage} alt="Ref" className={styles.slotThumbnail} />
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRefImage(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlinePhoto size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>Ref</span>
                        </>
                      )}
                    </button>

                    {/* 4. Video nguồn */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${sourceVideo ? styles.slotActive : ''}`}
                      onClick={() => videoInputRef.current?.click()}
                      title="Video nguồn (Video-to-Video)"
                    >
                      {sourceVideo ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#2dd4bf' }}>Đã nạp</span>
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSourceVideo(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlineFilm size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>Video</span>
                        </>
                      )}
                    </button>

                    {/* 5. Âm thanh đính kèm */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${audioTrack ? styles.slotActive : ''}`}
                      onClick={() => audioInputRef.current?.click()}
                      title="Audio track lồng tiếng"
                    >
                      {audioTrack ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>Đã nạp</span>
                          <span
                            className={styles.clearSlotBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioTrack(null);
                            }}
                          >
                            ✕
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={styles.slotIconWithPlus}>
                            <HiOutlineMusicalNote size={15} />
                            <span className={styles.subPlus}>+</span>
                          </span>
                          <span className={styles.slotLabel}>Âm th...</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Right: Inspire Me Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className={styles.inspireMeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInspireMenuOpen(!isInspireMenuOpen);
                    setIsModelMenuOpen(false);
                    setIsParamsMenuOpen(false);
                  }}
                >
                  <span className={styles.sparkleIcon}>※</span>
                  <span>Truyền cảm hứng cho tôi</span>
                  <HiOutlineChevronDown size={13} />
                </button>

                {isInspireMenuOpen && (
                  <div className={`${styles.customPopoverMenu} ${styles.popoverRight}`}>
                    <div className={styles.paramGroupTitle}>Gợi ý Prompt Sáng Tạo</div>
                    {INSPIRATION_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.popoverItem}
                        onClick={() => {
                          setPrompt(p);
                          setIsInspireMenuOpen(false);
                        }}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setRefImage, 'ảnh tham chiếu')}
            />
            <input
              type="file"
              ref={startFrameInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setStartFrame, 'frame bắt đầu')}
            />
            <input
              type="file"
              ref={endFrameInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setEndFrame, 'frame kết thúc')}
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setSourceVideo, 'video nguồn')}
            />
            <input
              type="file"
              ref={audioInputRef}
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => handleGenericFileUpload(e, setAudioTrack, 'audio track')}
            />

            {/* MIDDLE ROW: Clean Borderless Textarea */}
            <textarea
              className={styles.promptTextarea}
              placeholder="Mô tả nội dung bạn muốn tạo..."
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

            {/* BOTTOM TOOLBAR: Segmented Mode, Book, Model Dropdown, Params Dropdown, Mic, Pink Submit */}
            <div className={styles.promptBottomToolbar}>
              <div className={styles.toolbarLeft}>
                {/* 1. Segmented Switcher [Ảnh] [Video] [Âm thanh] */}
                <div className={styles.modeSwitcherGroup}>
                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'image' ? styles.modeTabActive : ''}`}
                    onClick={() => handleTabChange('image')}
                    title="Tạo hình ảnh"
                  >
                    <HiOutlinePhoto size={15} />
                    {activeTab === 'image' && <span>Ảnh</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'video' ? styles.modeTabActive : ''}`}
                    onClick={() => handleTabChange('video')}
                    title="Tạo video"
                  >
                    <HiOutlineFilm size={15} />
                    {activeTab === 'video' && <span>Video</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'audio' ? styles.modeTabActive : ''}`}
                    onClick={() => handleTabChange('audio')}
                    title="Tạo âm thanh / giọng nói"
                  >
                    <SoundWaveIcon size={14} />
                    {activeTab === 'audio' && <span>Âm thanh</span>}
                  </button>
                </div>

                {/* 2. Book Icon [📖] */}
                <button
                  type="button"
                  className={styles.iconBookBtn}
                  title="Thư viện phong cách & prompt mẫu"
                  onClick={() => {
                    const randomP = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
                    setPrompt(randomP);
                    setToastMsg('Đã nạp mẫu sáng tạo từ thư viện!');
                    setTimeout(() => setToastMsg(null), 2500);
                  }}
                >
                  <HiOutlineBookOpen size={16} />
                </button>

                {/* 3. Model Dropdown ✦ [Model Name] ⌵ */}
                <div className={styles.modelPillDropdown}>
                  <button
                    type="button"
                    className={styles.modelPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModelMenuOpen(!isModelMenuOpen);
                      setIsParamsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span className={styles.starIcon}>✦</span>
                    <span>{cleanModelDisplayName(currentModel?.name || 'Chọn Model')}</span>
                    <HiOutlineChevronDown className={styles.chevron} size={12} />
                  </button>

                  {isModelMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      <div className={styles.paramGroupTitle}>
                        Mô hình {activeTab === 'image' ? 'Ảnh' : activeTab === 'video' ? 'Video' : 'Âm thanh'} ({availableModels.length})
                      </div>
                      {availableModels.map((m) => {
                        const isSelected = selectedModelCode === m.model_code;
                        return (
                          <button
                            key={m.id || m.model_code}
                            type="button"
                            className={`${styles.popoverItem} ${isSelected ? styles.popoverActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModelCode(m.model_code);
                              setIsModelMenuOpen(false);
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{cleanModelDisplayName(m.name)}</div>
                              <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{m.provider}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={styles.itemCreditBadge}>
                                {m.selling_credit_price} cr
                              </span>
                              {isSelected && <HiOutlineCheck size={14} color="#ff6b35" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Params Dropdown (1K · Tự động · Cao ⌵ hoặc 1080p · Tự động · Tự động ⌵) */}
                <div className={styles.paramsPillDropdown}>
                  <button
                    type="button"
                    className={styles.paramsPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsParamsMenuOpen(!isParamsMenuOpen);
                      setIsModelMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span>
                      {activeTab === 'image'
                        ? `${resolution} · ${aspectRatio} · ${quality}`
                        : activeTab === 'video'
                        ? `1080p · ${aspectRatio} · ${aspectRatio === 'Tự động' ? 'Tự động' : 'Chuẩn'}`
                        : audioVoice}
                    </span>
                    <HiOutlineChevronDown className={styles.chevron} size={13} />
                  </button>

                  {isParamsMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      {activeTab === 'image' && (
                        <>
                          <div className={styles.paramGroupTitle}>Độ phân giải</div>
                          <div className={styles.paramOptionsGrid}>
                            {['1K', '2K', '4K'].map((res) => (
                              <button
                                key={res}
                                type="button"
                                className={`${styles.paramChip} ${resolution === res ? styles.paramActive : ''}`}
                                onClick={() => setResolution(res)}
                              >
                                {res}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>Tỉ lệ khung hình</div>
                          <div className={styles.paramOptionsGrid}>
                            {['Tự động', '1:1', '16:9', '9:16', '4:3', '21:9'].map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {ratio}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>Chất lượng Render</div>
                          <div className={styles.paramOptionsGrid}>
                            {['Tiêu chuẩn', 'Cao', 'Ultra'].map((q) => (
                              <button
                                key={q}
                                type="button"
                                className={`${styles.paramChip} ${quality === q ? styles.paramActive : ''}`}
                                onClick={() => setQuality(q)}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'video' && (
                        <>
                          <div className={styles.paramGroupTitle}>Độ phân giải video</div>
                          <div className={styles.paramOptionsGrid}>
                            {['720p', '1080p', '4K'].map((res) => (
                              <button
                                key={res}
                                type="button"
                                className={`${styles.paramChip} ${res === '1080p' ? styles.paramActive : ''}`}
                              >
                                {res}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>Tỉ lệ khung hình</div>
                          <div className={styles.paramOptionsGrid}>
                            {['Tự động', '16:9', '9:16'].map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {ratio}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>Thời lượng</div>
                          <div className={styles.paramOptionsGrid}>
                            {['5s', '10s (Pro)'].map((dur) => (
                              <button key={dur} type="button" className={`${styles.paramChip} ${dur === '5s' ? styles.paramActive : ''}`}>
                                {dur}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'audio' && (
                        <>
                          <div className={styles.paramGroupTitle}>Ngôn ngữ & Giọng đọc</div>
                          {['English · American', 'English · British', 'Tiếng Việt · Hà Nội', 'Tiếng Việt · Sài Gòn'].map((voice) => (
                            <button
                              key={voice}
                              type="button"
                              className={`${styles.popoverItem} ${audioVoice === voice ? styles.popoverActive : ''}`}
                              onClick={() => {
                                setAudioVoice(voice);
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              <span>{voice}</span>
                              {audioVoice === voice && <HiOutlineCheck size={14} color="#ff6b35" />}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Microphone & Neon Pink Circular Submit */}
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={`${styles.micBtn} ${isSpeechRecording ? styles.micActive : ''}`}
                  onClick={toggleVoiceInput}
                  title="Nhập bằng giọng nói"
                >
                  <HiOutlineMicrophone size={20} />
                </button>

                <button
                  type="button"
                  className={styles.pinkNeonSubmitBtn}
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  title={`Tạo ngay (${totalCreditsNeeded} cr)`}
                >
                  <HiOutlineArrowUp size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Standalone Speaker Button for Video Mode */}
          {activeTab === 'video' && (
            <button
              type="button"
              className={styles.standaloneSpeakerBtn}
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isAudioMuted ? <HiOutlineSpeakerXMark size={18} /> : <HiOutlineSpeakerWave size={18} />}
            </button>
          )}
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
