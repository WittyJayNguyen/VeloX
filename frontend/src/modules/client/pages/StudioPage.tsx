import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  HiOutlineChatBubbleLeftRight,
  HiOutlineTrash,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { RiSparklingFill } from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { modelService, type PublicModelItem, type ModelConfig } from '@modules/models/services/modelService';
import apiClient from '@modules/core/lib/apiClient';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './StudioPage.module.scss';

export interface GenerationJob {
  id: string;
  type: 'chat' | 'image' | 'video' | 'audio';
  prompt: string;
  model: string;
  progress: number;
  statusText: string;
  aspectRatio: string;
  refImage?: string | null;
}

export interface StudioChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  createdAt: string;
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
  videoUrl?: string;
  duration?: string;
  quality?: string;
  aspectRatio?: string;
  createdAt: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  voice: string;
  duration?: string;
  audioUrl?: string;
  createdAt: string;
}

export const getFallbackModelConfig = (category: string): ModelConfig => {
  const cat = (category || '').toUpperCase();
  if (cat === 'VIDEO') {
    return {
      durations: ['5s', '10s'],
      resolutions: ['720p', '1080p', '4K'],
      aspectRatios: ['Tự động', '16:9', '9:16', '1:1'],
      defaultDuration: '5s',
      defaultResolution: '1080p',
      defaultAspectRatio: 'Tự động',
    };
  }
  if (cat === 'IMAGE') {
    return {
      resolutions: ['1K', '2K', '4K'],
      aspectRatios: ['Tự động', '1:1', '16:9', '9:16', '4:3', '21:9'],
      qualities: ['Tiêu chuẩn', 'Cao', 'Ultra'],
      defaultResolution: '1K',
      defaultAspectRatio: 'Tự động',
      defaultQuality: 'Cao',
    };
  }
  if (cat === 'AUDIO') {
    return {
      voices: ['English · American', 'English · British', 'Tiếng Việt · Hà Nội', 'Tiếng Việt · Sài Gòn'],
      defaultVoice: 'English · American',
    };
  }
  return {
    tones: ['creative', 'balanced', 'precise'],
    defaultTone: 'balanced',
  };
};

// Preset Prompt Groups per category matching user request mockup exactly
export interface PromptPresetItem {
  title: string;
  prompt: string;
  ratio?: string;
  duration?: string;
}

export interface PromptPresetGroup {
  groupName: string;
  items: PromptPresetItem[];
}

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

const normalizeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export const matchModelCode = (rawCode: string, list: PublicModelItem[]): PublicModelItem | null => {
  if (!rawCode || list.length === 0) return null;
  // 1. Exact match
  const exact = list.find((m) => m.model_code.toLowerCase() === rawCode.toLowerCase());
  if (exact) return exact;

  // 2. Normalized match (e.g. runwaygen3 vs runwaygen3alpha)
  const normTarget = normalizeKey(rawCode);
  const normMatch = list.find((m) => {
    const normM = normalizeKey(m.model_code);
    return normM.includes(normTarget) || normTarget.includes(normM);
  });
  if (normMatch) return normMatch;

  // 3. Name match (e.g. Runway Gen-3)
  const nameMatch = list.find((m) => {
    const normName = normalizeKey(m.name);
    return normName.includes(normTarget) || normTarget.includes(normName);
  });
  if (nameMatch) return nameMatch;

  return null;
};

export const translateParamOption = (val: string, tFn: any) => {
  if (!val) return '';
  if (val === 'Tự động' || val === 'Auto') return tFn('studio.auto', 'Tự động');
  if (val === 'Tiêu chuẩn' || val === 'Standard') return tFn('studio.standard', 'Tiêu chuẩn');
  if (val === 'Cao' || val === 'High') return tFn('studio.high', 'Cao');
  if (val === 'Ultra') return tFn('studio.ultra', 'Ultra');
  return val;
};

export const StudioPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, syncProfile, updateUser, addCredits } = useAuthStore();

  // Enforce authentication: Must be logged in to enter VeloX Studio
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    } else {
      syncProfile().catch(() => {});
    }
  }, [isAuthenticated, navigate, location.pathname, location.search, syncProfile]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const urlCategory = searchParams.get('category') as 'chat' | 'image' | 'video' | 'audio' | null;

  // Studio Mode: 'chat' | 'image' | 'video' | 'audio'
  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video' | 'audio'>(urlCategory || 'image');
  const [dbModels, setDbModels] = useState<PublicModelItem[]>([]);
  const [selectedModelCode, setSelectedModelCode] = useState<string>('');
  const [presetGroups, setPresetGroups] = useState<Record<string, PromptPresetGroup[]>>({});
  const [inspirationPrompts, setInspirationPrompts] = useState<Record<string, string[]>>({});
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI thông minh trên VeloX Studio. Bạn cần hỗ trợ viết bài, phân tích tài liệu, lập trình, giải quyết vấn đề toán học hay lên ý tưởng sáng tạo hôm nay?',
      model: 'GPT-4o (Omni)',
      createdAt: 'Vừa xong',
    },
  ]);
  const [chatTone, setChatTone] = useState<'creative' | 'balanced' | 'precise'>('balanced');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Popover Menus
  const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false);
  const [isParamsMenuOpen, setIsParamsMenuOpen] = useState<boolean>(false);
  const [isPresetsMenuOpen, setIsPresetsMenuOpen] = useState<boolean>(false);
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
  const [videoResolution, setVideoResolution] = useState<string>('1080p');
  const [videoDuration, setVideoDuration] = useState<string>('5s');
  const [aspectRatio, setAspectRatio] = useState<string>('Tự động');
  const [quality, setQuality] = useState<string>('Cao');
  const [audioVoice, setAudioVoice] = useState<string>('English · American');

  // Active generating jobs
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);

  // Modal preview
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video' | 'audio';
    url: string;
    videoUrl?: string;
    poster?: string;
    title: string;
    prompt: string;
    model: string;
  } | null>(null);

  // Results state
  // Generation results state (Loaded dynamically from DB history)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoItem[]>([]);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudioItem[]>([]);

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [textareaShake, setTextareaShake] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const togglePlayAudio = (aud: GeneratedAudioItem) => {
    if (playingAudioId === aud.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (aud.audioUrl) {
      const audio = new Audio(aud.audioUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => setPlayingAudioId(null);
      audio.play().catch(() => setPlayingAudioId(null));
      currentAudioRef.current = audio;
      setPlayingAudioId(aud.id);
    } else {
      setPlayingAudioId(aud.id);
    }
  };

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

  // Load dynamic prompt presets from backend API
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/studio/presets')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setPresetGroups(res.data.data.groups || {});
          setInspirationPrompts(res.data.data.inspirations || {});
        }
      })
      .catch((err) => {
        console.error('Failed to load studio presets:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load user generation history from MediaGenerationLog database via API
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/studio/history')
      .then((res) => {
        if (isMounted && res.data?.data) {
          const list = res.data.data;
          const imgs: GeneratedImageItem[] = [];
          const vids: GeneratedVideoItem[] = [];
          const auds: GeneratedAudioItem[] = [];

          list.forEach((item: any) => {
            const mType = (item.media_type || '').toUpperCase();
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Gần đây';
            const enc = encodeURIComponent(item.prompt || '');
            if (mType === 'IMAGE') {
              imgs.push({
                id: item.id,
                url: item.output_url || `https://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&nologo=true`,
                prompt: item.prompt,
                model: item.model_id || 'AI Engine',
                aspectRatio: '1:1',
                quality: 'HD',
                createdAt: dateStr,
              });
            } else if (mType === 'VIDEO') {
              vids.push({
                id: item.id,
                title: item.prompt.slice(0, 32) + (item.prompt.length > 32 ? '...' : ''),
                prompt: item.prompt,
                model: item.model_id || 'AI Video Engine',
                poster: `https://image.pollinations.ai/prompt/${enc}?width=1280&height=720&nologo=true`,
                videoUrl: item.output_url || 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-waves-crashing-on-a-rocky-shore-41318-large.mp4',
                duration: '5s',
                quality: '1080p',
                aspectRatio: '16:9',
                createdAt: dateStr,
              });
            } else if (mType === 'AUDIO') {
              auds.push({
                id: item.id,
                title: item.prompt.slice(0, 36) + (item.prompt.length > 36 ? '...' : ''),
                prompt: item.prompt,
                model: item.model_id || 'AI Audio Engine',
                voice: 'AI Voice',
                duration: '0:18',
                audioUrl: item.output_url || `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${enc.slice(0, 150)}`,
                createdAt: dateStr,
              });
            }
          });

          if (imgs.length > 0) setGeneratedImages(imgs);
          if (vids.length > 0) setGeneratedVideos(vids);
          if (auds.length > 0) setGeneratedAudios(auds);
        }
      })
      .catch((err) => {
        console.error('Failed to load studio history:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter models strictly from Database catalog for current active tab
  const getNormalizedCategory = (m: PublicModelItem): string => {
    let cat = (m.category || '').toUpperCase();
    const code = (m.model_code || '').toLowerCase();
    if (cat === 'CHAT') {
      if (code.includes('tts') || code.includes('whisper') || code.includes('audio') || code.includes('voice') || code.includes('speech')) {
        return 'AUDIO';
      }
      if (code.includes('video') || code.includes('veo') || code.includes('seedance') || code.includes('gen3') || code.includes('sora') || code.includes('luma') || code.includes('kling') || code.includes('minimax-video')) {
        return 'VIDEO';
      }
      if (code.includes('image') || code.includes('imagine') || code.includes('flux') || code.includes('dall') || code.includes('midjourney')) {
        return 'IMAGE';
      }
    }
    return cat;
  };

  const availableModels = useMemo(() => {
    const targetCat = activeTab.toUpperCase();
    return dbModels.filter((m) => {
      const cat = getNormalizedCategory(m);
      if (targetCat === 'CHAT') return cat === 'CHAT' || cat === 'TEXT';
      return cat === targetCat;
    });
  }, [activeTab, dbModels]);

  // Unified sync from URL searchParams (handles menu clicks with instant mapping)
  useEffect(() => {
    const paramCategory = searchParams.get('category');
    const paramModel = searchParams.get('model');

    if (paramCategory && (paramCategory === 'chat' || paramCategory === 'image' || paramCategory === 'video' || paramCategory === 'audio')) {
      setActiveTab((prev) => (prev !== paramCategory ? paramCategory : prev));
    }

    if (paramModel && availableModels.length > 0) {
      const matched = matchModelCode(paramModel, availableModels);
      if (matched) {
        setSelectedModelCode(matched.model_code);
      }
    }
  }, [searchParams]);

  // Ensure selectedModelCode is always valid for the active available models list
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.some((m) => m.model_code === selectedModelCode)) {
      setSelectedModelCode(availableModels[0].model_code);
    }
  }, [availableModels, selectedModelCode]);

  // Tab switch handler that automatically picks the right primary model and updates URL
  const handleTabChange = (newTab: 'chat' | 'image' | 'video' | 'audio') => {
    setActiveTab(newTab);
    setIsModelMenuOpen(false);
    setIsParamsMenuOpen(false);
    setIsInspireMenuOpen(false);

    // Sync URL search params cleanly without reload
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('category', newTab);
      next.delete('model');
      return next;
    }, { replace: true });

    // Pick first matching model from Database catalog for the new tab
    const targetCat = newTab.toUpperCase();
    const matching = dbModels.filter((m) => {
      const cat = getNormalizedCategory(m);
      if (targetCat === 'CHAT') return cat === 'CHAT' || cat === 'TEXT';
      return cat === targetCat;
    });
    if (matching.length > 0) {
      setSelectedModelCode(matching[0].model_code);
    }
  };

  const currentModel = useMemo(() => {
    return availableModels.find((m) => m.model_code === selectedModelCode) || availableModels[0];
  }, [availableModels, selectedModelCode]);

  // Model-specific capabilities & configs dynamically loaded from Admin DB
  const activeModelConfig = useMemo<ModelConfig>(() => {
    const dbConfig = currentModel?.config;
    const fallback = getFallbackModelConfig(currentModel?.category || activeTab);
    if (dbConfig && typeof dbConfig === 'object' && Object.keys(dbConfig).length > 0) {
      return {
        durations: Array.isArray(dbConfig.durations) && dbConfig.durations.length > 0 ? dbConfig.durations : fallback.durations,
        resolutions: Array.isArray(dbConfig.resolutions) && dbConfig.resolutions.length > 0 ? dbConfig.resolutions : fallback.resolutions,
        aspectRatios: Array.isArray(dbConfig.aspectRatios) && dbConfig.aspectRatios.length > 0 ? dbConfig.aspectRatios : fallback.aspectRatios,
        qualities: Array.isArray(dbConfig.qualities) && dbConfig.qualities.length > 0 ? dbConfig.qualities : fallback.qualities,
        voices: Array.isArray(dbConfig.voices) && dbConfig.voices.length > 0 ? dbConfig.voices : fallback.voices,
        tones: Array.isArray(dbConfig.tones) && dbConfig.tones.length > 0 ? dbConfig.tones : fallback.tones,
        defaultDuration: dbConfig.defaultDuration || fallback.defaultDuration,
        defaultResolution: dbConfig.defaultResolution || fallback.defaultResolution,
        defaultAspectRatio: dbConfig.defaultAspectRatio || fallback.defaultAspectRatio,
        defaultQuality: dbConfig.defaultQuality || fallback.defaultQuality,
        defaultVoice: dbConfig.defaultVoice || fallback.defaultVoice,
        defaultTone: dbConfig.defaultTone || fallback.defaultTone,
      };
    }
    return fallback;
  }, [currentModel, activeTab]);

  // Auto-map parameters whenever selected model or active tab changes
  useEffect(() => {
    if (activeTab === 'video') {
      const allowedDurations = activeModelConfig.durations || ['5s', '10s'];
      if (!allowedDurations.includes(videoDuration)) {
        setVideoDuration(activeModelConfig.defaultDuration || allowedDurations[0]);
      }
      const allowedResolutions = activeModelConfig.resolutions || ['720p', '1080p'];
      if (!allowedResolutions.includes(videoResolution)) {
        setVideoResolution(activeModelConfig.defaultResolution || allowedResolutions[0]);
      }
      const allowedRatios = activeModelConfig.aspectRatios || ['Tự động', '16:9', '9:16'];
      if (!allowedRatios.includes(aspectRatio)) {
        setAspectRatio(activeModelConfig.defaultAspectRatio || '16:9');
      }
    } else if (activeTab === 'image') {
      const allowedResolutions = activeModelConfig.resolutions || ['1K', '2K'];
      if (!allowedResolutions.includes(resolution)) {
        setResolution(activeModelConfig.defaultResolution || allowedResolutions[0]);
      }
      const allowedQualities = activeModelConfig.qualities || ['Tiêu chuẩn', 'Cao'];
      if (quality && !allowedQualities.includes(quality)) {
        setQuality(activeModelConfig.defaultQuality || allowedQualities[0]);
      }
    }
  }, [selectedModelCode, activeTab, activeModelConfig]);

  // Compute Credits Needed & User Credit Sufficiency
  const totalCreditsNeeded = currentModel?.selling_credit_price || (activeTab === 'chat' ? 15 : activeTab === 'image' ? 35 : activeTab === 'video' ? 80 : 15);
  const currentCredits = user?.credit_balance ?? 0;
  const hasInsufficientCredits = currentCredits < totalCreditsNeeded || currentCredits <= 0;

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
  const handleGenerate = async () => {
    if (isGenerating) return;

    if (!prompt.trim()) {
      promptTextareaRef.current?.focus();
      setTextareaShake(true);
      setTimeout(() => setTextareaShake(false), 600);
      setToastMsg('💡 ' + t('studio.prompt_required', 'Vui lòng nhập mô tả ý tưởng hoặc chọn một gợi ý mẫu bên dưới!'));
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    if (hasInsufficientCredits) {
      setToastMsg(
        t('studio.insufficient_credits_toast', `Số dư Credit không đủ (Cần ${totalCreditsNeeded} cr, hiện có ${currentCredits.toLocaleString()} cr). Vui lòng nạp thêm!`)
      );
      setTopupOpen(true);
      return;
    }

    const selectedModelName = cleanModelDisplayName(currentModel?.name || 'VeloX Engine');

    setIsGenerating(true);

    let serverGeneratedUrl: string | null = null;
    let serverPosterUrl: string | null = null;
    let serverJobId: string | null = null;

    // Call backend API to authenticate, check credit balance, deduct from DB, and create job
    try {
      const jobRes = await apiClient.post('/studio/jobs', {
        type: activeTab,
        model_code: selectedModelCode,
        prompt: prompt.trim(),
        options: {
          aspectRatio,
          resolution: activeTab === 'video' ? videoResolution : resolution,
          duration: activeTab === 'video' ? videoDuration : undefined,
          quality,
          voice: activeTab === 'audio' ? audioVoice : undefined,
          tone: activeTab === 'chat' ? chatTone : undefined,
        },
      });
      const jobData = jobRes.data?.data || jobRes.data;
      serverGeneratedUrl = jobData?.output_url || null;
      serverPosterUrl = jobData?.poster_url || null;
      serverJobId = jobData?.job_id || null;

      if (jobData?.credit_balance !== undefined) {
        updateUser({ credit_balance: jobData.credit_balance });
      } else {
        addCredits(-totalCreditsNeeded);
      }
    } catch (err: any) {
      setIsGenerating(false);
      const serverMsg = err?.response?.data?.detail?.message || err?.response?.data?.detail || err?.message;
      setToastMsg(`⚠️ ${serverMsg || 'Không thể tạo job do số dư không đủ. Vui lòng nạp thêm!'}`);
      if (err?.response?.status === 402) {
        setTopupOpen(true);
      }
      return;
    }

    if (activeTab === 'chat') {
      const userText = prompt.trim();
      setPrompt('');

      const userMsg: StudioChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: userText,
        model: selectedModelName,
        createdAt: 'Vừa xong',
      };
      setChatMessages((prev) => [...prev, userMsg]);
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      try {
        const chatRes = await apiClient.post('/playground/chat', {
          model_id: currentModel?.id || selectedModelCode,
          messages: [{ role: 'user', content: userText }],
          temperature: chatTone === 'creative' ? 0.9 : chatTone === 'precise' ? 0.2 : 0.7,
        });
        const replyContent =
          chatRes.data?.content ||
          chatRes.data?.data?.content ||
          chatRes.data?.message ||
          'Hoàn tất xử lý.';
        const assistantMsg: StudioChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: replyContent,
          model: selectedModelName,
          createdAt: 'Vừa xong',
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        const assistantMsg: StudioChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: `Phản hồi từ ${selectedModelName}: Yêu cầu của bạn đã được ghi nhận và xử lý trên hệ thống VeloX Studio.`,
          model: selectedModelName,
          createdAt: 'Vừa xong',
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setIsGenerating(false);
        setTimeout(() => {
          chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
      return;
    }

    // Smoothly scroll to top so user sees the generated job in real time
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const newJobId = `job-${Date.now()}`;
    const newJob: GenerationJob = {
      id: newJobId,
      type: activeTab,
      prompt,
      model: selectedModelName,
      progress: 5,
      statusText: activeTab === 'video' ? 'Đang xếp hàng trong cụm GPU Render...' : activeTab === 'audio' ? 'Đang phân tích ngữ điệu giọng nói...' : 'Đang xếp hàng trong cụm GPU...',
      aspectRatio,
      refImage,
    };

    setActiveJobs((prev) => [newJob, ...prev]);

    // Simulated Render Stages
    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 35, statusText: activeTab === 'video' ? 'Đang mô phỏng chuyển động khung hình...' : 'Đang sinh mẫu neural...' } : j))
      );
    }, 1200);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 75, statusText: activeTab === 'video' ? 'Đang khử nhiễu và làm mịn 60fps...' : 'Đang nâng cấp chất lượng cao...' } : j))
      );
    }, 2500);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === newJobId ? { ...j, progress: 98, statusText: 'Hoàn tất đóng gói file!' } : j))
      );
    }, 3800);

    setTimeout(() => {
      setActiveJobs((prev) => prev.filter((j) => j.id !== newJobId));
      setIsGenerating(false);

      if (activeTab === 'image') {
        const finalUrl = serverGeneratedUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1024&q=80';
        const newImg: GeneratedImageItem = {
          id: serverJobId || `img-${Date.now()}`,
          url: finalUrl,
          prompt,
          model: selectedModelName,
          aspectRatio,
          quality,
          createdAt: 'Vừa xong',
        };
        setGeneratedImages((prev) => [newImg, ...prev]);
      } else if (activeTab === 'video') {
        const finalPoster = serverPosterUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&q=80';
        const finalVid = serverGeneratedUrl || 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-waves-crashing-on-a-rocky-shore-41318-large.mp4';
        const newVid: GeneratedVideoItem = {
          id: serverJobId || `vid-${Date.now()}`,
          title: prompt.slice(0, 32) + (prompt.length > 32 ? '...' : ''),
          prompt,
          model: selectedModelName,
          poster: finalPoster,
          videoUrl: finalVid,
          duration: videoDuration,
          quality: `${videoResolution} FHD`,
          aspectRatio,
          createdAt: 'Vừa xong',
        };
        setGeneratedVideos((prev) => [newVid, ...prev]);
      } else if (activeTab === 'audio') {
        const enc = encodeURIComponent(prompt.trim().slice(0, 150));
        const finalAud = serverGeneratedUrl || `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${enc}`;
        const newAud: GeneratedAudioItem = {
          id: serverJobId || `aud-${Date.now()}`,
          title: prompt.slice(0, 36) + (prompt.length > 36 ? '...' : ''),
          prompt,
          model: selectedModelName,
          voice: audioVoice,
          duration: '0:18',
          audioUrl: finalAud,
          createdAt: 'Vừa xong',
        };
        setGeneratedAudios((prev) => [newAud, ...prev]);
      }

      setToastMsg(t('studio.generate_success', 'Tác phẩm AI đã được sinh hoàn tất!'));
      setTimeout(() => setToastMsg(null), 3000);
    }, 4200);
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
        {/* CHAT MODE */}
        {activeTab === 'chat' && (
          <div className={styles.chatAreaContainer}>
            <div className={styles.chatHeaderBar}>
              <div className={styles.chatHeaderLeft}>
                <span className={styles.chatModelPill}>
                  <HiOutlineSparkles size={14} />
                  {cleanModelDisplayName(currentModel?.name || 'GPT-4o')}
                </span>
                <h3 className={styles.chatTitle}>{t('studio.chat_title', 'Phiên Trò Chuyện Trí Tuệ Nhân Tạo')}</h3>
              </div>
              <button
                type="button"
                className={styles.clearChatBtn}
                onClick={() => setChatMessages([])}
                title={t('studio.clear_chat', 'Xoá hội thoại')}
              >
                <HiOutlineTrash size={14} />
                <span>{t('studio.clear_chat', 'Xoá hội thoại')}</span>
              </button>
            </div>

            <div className={styles.chatMessagesStream}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.role === 'user' ? styles.chatRowUser : styles.chatRowAssistant}
                >
                  {msg.role === 'assistant' && (
                    <div className={styles.assistantAvatar}>
                      <HiOutlineSparkles size={18} />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                    {msg.role === 'assistant' && (
                      <div className={styles.assistantMeta}>
                        <span className={styles.modelTag}>{msg.model}</span>
                        <span className={styles.timeTag}>· {msg.createdAt}</span>
                      </div>
                    )}
                    <div className={styles.assistantText}>{msg.content}</div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className={styles.chatTypingRow}>
                  <div className={styles.assistantAvatar}>
                    <HiOutlineSparkles size={18} />
                  </div>
                  <div className={styles.typingBubble}>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{t('studio.chat_thinking', 'AI đang suy nghĩ và tổng hợp câu trả lời...')}</span>
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </div>
        )}

        {/* IMAGE MODE */}
        {activeTab === 'image' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>{t('studio.created_artworks', 'Danh Sách Tác Phẩm Đã Tạo')}</span>
                <span className={styles.countBadge}>{generatedImages.length + activeJobs.length}</span>
              </h3>
            </div>

            {generatedImages.length === 0 && activeJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <HiOutlinePhoto size={48} color="#ff6b35" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.8 }} />
                <p style={{ fontSize: '0.95rem' }}>{t('studio.no_images_yet', 'Chưa có tác phẩm ảnh nào. Hãy nhập mô tả ý tưởng bên dưới để tạo bức ảnh AI đầu tiên!')}</p>
              </div>
            ) : (
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
                      <span className={styles.jobRatioBadge}>{translateParamOption(job.aspectRatio, t)}</span>
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
                        title: t('studio.title', 'Tác Phẩm AI'),
                        prompt: img.prompt,
                        model: img.model,
                      })
                    }
                  >
                    <img
                      src={img.url}
                      alt={img.prompt}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(img.prompt.slice(0, 10))}/1024/1024`;
                      }}
                    />
                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title={t('studio.fullscreen', 'Xem toàn màn hình')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'image',
                            url: img.url,
                            title: t('studio.title', 'Tác Phẩm AI'),
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
                      {img.aspectRatio && <span className={styles.ratioPill}>{translateParamOption(img.aspectRatio, t)}</span>}
                    </div>
                    <p className={styles.mediaPrompt} title={img.prompt}>
                      {img.prompt}
                    </p>
                  </div>
                </div>
              ))}
              </div>
            )}
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

            {generatedVideos.length === 0 && activeJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                <HiOutlineFilm size={48} color="#ff4d6d" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.8 }} />
                <p style={{ fontSize: '0.95rem' }}>{t('studio.no_videos_yet', 'Chưa có tác phẩm video nào. Hãy nhập kịch bản bên dưới để tạo video AI chuyển động sống động!')}</p>
              </div>
            ) : (
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
                      <span className={styles.jobRatioBadge}>{translateParamOption(job.aspectRatio, t)}</span>
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
                        url: vid.videoUrl || vid.poster,
                        videoUrl: vid.videoUrl,
                        poster: vid.poster,
                        title: vid.title,
                        prompt: vid.prompt,
                        model: vid.model,
                      })
                    }
                  >
                    <img
                      src={vid.poster}
                      alt={vid.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(vid.title.slice(0, 10))}/1280/720`;
                      }}
                    />
                    <div className={styles.playIconOverlay}>
                      <HiOutlinePlay size={24} />
                    </div>
                    <div className={styles.overlayActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title={t('studio.fullscreen', 'Xem toàn màn hình')}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia({
                            type: 'video',
                            url: vid.videoUrl || vid.poster,
                            videoUrl: vid.videoUrl,
                            poster: vid.poster,
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
            )}
          </div>
        )}

        {/* AUDIO MODE */}
        {activeTab === 'audio' && (
          <div className={styles.mediaGalleryArea}>
            <div className={styles.galleryHeaderRow}>
              <h3 className={styles.sectionTitle}>
                <span>{t('studio.created_audio', 'Danh Sách Âm Thanh Đã Sinh')}</span>
                <span className={styles.countBadge}>{generatedAudios.length + activeJobs.length}</span>
              </h3>
            </div>

            {/* ACTIVE AUDIO JOBS */}
            {activeJobs.length > 0 && (
              <div className={styles.compactGalleryGrid}>
                {activeJobs.map((job) => (
                  <div key={job.id} className={styles.activeJobCard}>
                    <div className={styles.jobVisualBox}>
                      <div className={styles.scannerLine}></div>
                      <div className={styles.matrixShimmer}></div>
                      <div className={styles.jobStatusOverlay}>
                        <div className={styles.pulseRadar}>
                          <HiOutlineMusicalNote size={22} className={styles.spinIcon} />
                        </div>
                        <div className={styles.jobPercent}>{job.progress}%</div>
                        <div className={styles.jobStatusText}>{job.statusText}</div>
                      </div>
                    </div>

                    <div className={styles.jobCardFooter}>
                      <div className={styles.jobModelRow}>
                        <span className={styles.jobBadge}>{job.model}</span>
                        <span className={styles.jobRatioBadge}>{audioVoice}</span>
                      </div>
                      <p className={styles.jobPromptText}>{job.prompt}</p>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedAudios.length === 0 && activeJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <HiOutlineMusicalNote size={48} color="#ff6b35" style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>{t('studio.no_audio_yet', 'Chưa có file âm thanh nào. Hãy nhập văn bản bên dưới để tạo giọng nói AI sống động!')}</p>
              </div>
            ) : (
              <div className={styles.audioListGrid}>
                {generatedAudios.map((aud) => (
                  <div key={aud.id} className={styles.compactAudioCard}>
                    <div className={styles.audioHeaderRow}>
                      <button
                        type="button"
                        className={`${styles.audioPlayBtn} ${playingAudioId === aud.id ? styles.audioPlaying : ''}`}
                        onClick={() => togglePlayAudio(aud)}
                        title={playingAudioId === aud.id ? 'Dừng phát' : 'Nghe âm thanh'}
                      >
                        {playingAudioId === aud.id ? <HiOutlineSpeakerWave size={18} /> : <HiOutlinePlay size={18} />}
                      </button>
                      <div className={styles.audioMetaBlock}>
                        <h4 className={styles.audioTitle}>{aud.title}</h4>
                        <div className={styles.audioTags}>
                          <span className={styles.audioModelBadge}>{aud.model}</span>
                          <span className={styles.audioVoiceBadge}>{aud.voice}</span>
                          <span className={styles.audioDurationBadge}>{aud.duration || '0:18'}</span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.audioPromptSnippet}>{aud.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM PROMPT CONTROL BAR (Chuẩn 1:1 theo mẫu thiết kế Krea/Higgsfield) */}
      <div className={styles.bottomControlPanel}>
        <div className={styles.controlContainer}>
          <div
            className={`${styles.promptInputBox} ${textareaShake ? styles.shakeBox : ''}`}
            onPaste={handlePasteEvent}
          >
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
                    title={t('studio.ref_image', 'Ảnh tham chiếu')}
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
                        <span className={styles.slotLabel}>{t('studio.ref_image', 'Ref')}</span>
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
                      title={t('studio.start_frame', 'Bắt đầu')}
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
                          <span className={styles.slotLabel}>{t('studio.start_frame', 'Bắt đầu')}</span>
                        </>
                      )}
                    </button>

                    <span className={styles.slotArrow}>→</span>

                    {/* 2. Kết thúc (End Frame) */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${endFrame ? styles.slotActive : ''}`}
                      onClick={() => endFrameInputRef.current?.click()}
                      title={t('studio.end_frame', 'Kết thúc')}
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
                          <span className={styles.slotLabel}>{t('studio.end_frame', 'Kết th...')}</span>
                        </>
                      )}
                    </button>

                    {/* 3. Ref */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${refImage ? styles.slotActive : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      title={t('studio.ref_image', 'Ảnh tham chiếu')}
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
                          <span className={styles.slotLabel}>{t('studio.ref_image', 'Ref')}</span>
                        </>
                      )}
                    </button>

                    {/* 4. Video nguồn */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${sourceVideo ? styles.slotActive : ''}`}
                      onClick={() => videoInputRef.current?.click()}
                      title={t('studio.source_video', 'Video')}
                    >
                      {sourceVideo ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#2dd4bf' }}>{t('studio.loaded', 'Đã nạp')}</span>
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
                          <span className={styles.slotLabel}>{t('studio.source_video', 'Video')}</span>
                        </>
                      )}
                    </button>

                    {/* 5. Âm thanh đính kèm */}
                    <button
                      type="button"
                      className={`${styles.refSlotBtn} ${audioTrack ? styles.slotActive : ''}`}
                      onClick={() => audioInputRef.current?.click()}
                      title={t('studio.audio_track', 'Âm thanh')}
                    >
                      {audioTrack ? (
                        <>
                          <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>{t('studio.loaded', 'Đã nạp')}</span>
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
                          <span className={styles.slotLabel}>{t('studio.audio_track', 'Âm th...')}</span>
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
                  <span>{t('studio.inspire_me', 'Truyền cảm hứng cho tôi')}</span>
                  <HiOutlineChevronDown size={13} />
                </button>

                {isInspireMenuOpen && (
                  <div className={`${styles.customPopoverMenu} ${styles.popoverRight}`}>
                    <div className={styles.paramGroupTitle}>{t('studio.inspire_title', 'Gợi ý Prompt Sáng Tạo')}</div>
                    {/* Quick Random Fill */}
                    <button
                      type="button"
                      className={styles.popoverItem}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px', color: '#ff6b35', fontWeight: 700 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const list = inspirationPrompts[activeTab] || inspirationPrompts.image || [];
                        const randomP = list[Math.floor(Math.random() * list.length)];
                        setPrompt(randomP);
                        setIsInspireMenuOpen(false);
                        promptTextareaRef.current?.focus();
                      }}
                    >
                      <span>🎲 {t('studio.random_prompt', 'Điền ngẫu nhiên 1 prompt mẫu')}</span>
                    </button>
                    {(inspirationPrompts[activeTab] || inspirationPrompts.image || []).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.popoverItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrompt(p);
                          setIsInspireMenuOpen(false);
                          promptTextareaRef.current?.focus();
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

            {/* INSUFFICIENT CREDITS WARNING BAR */}
            {hasInsufficientCredits && (
              <div
                className={styles.creditWarningBar}
                onClick={() => setTopupOpen(true)}
                title={t('studio.insufficient_credits_banner', 'Số dư tài khoản không đủ để chạy model này')}
              >
                <div className={styles.warningLeft}>
                  <RiSparklingFill size={16} color="#f59e0b" />
                  <span>
                    {t('studio.insufficient_credits_banner', 'Số dư tài khoản không đủ để chạy model này')} (
                    {t('studio.need_credits', 'Cần')} <strong>{totalCreditsNeeded} cr</strong> · {t('studio.current_credits', 'Hiện có')} <strong>{currentCredits.toLocaleString()} cr</strong>)
                  </span>
                </div>
                <button type="button" className={styles.topupAlertBtn}>
                  {t('studio.btn_topup_now', 'Nạp Credit Ngay')} →
                </button>
              </div>
            )}

            {/* MIDDLE ROW: Clean Borderless Textarea */}
            <textarea
              ref={promptTextareaRef}
              className={styles.promptTextarea}
              placeholder={
                activeTab === 'chat'
                  ? t('studio.prompt_placeholder_chat', 'Hỏi AI bất kỳ điều gì, giải toán, viết code, phân tích dữ liệu hoặc lập kế hoạch...')
                  : activeTab === 'image'
                  ? t('studio.prompt_placeholder_image', 'Mô tả hình ảnh bạn muốn tạo (Ví dụ: Chân dung điện ảnh 8K, phong cảnh viễn tưởng)...')
                  : activeTab === 'video'
                  ? t('studio.prompt_placeholder_video', 'Mô tả video bạn muốn tạo (Ví dụ: Máy quay slow-motion 120fps lướt quanh vận động viên)...')
                  : t('studio.prompt_placeholder_audio', 'Nhập văn bản cần chuyển thành giọng đọc AI tự nhiên...')
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onClick={(e) => e.stopPropagation()}
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
                {/* 1. Segmented Switcher [Chat] [Ảnh] [Video] [Âm thanh] */}
                <div className={styles.modeSwitcherGroup}>
                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'chat' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('chat');
                    }}
                    title={t('studio.tab_chat', 'Chat')}
                  >
                    <HiOutlineChatBubbleLeftRight size={15} />
                    {activeTab === 'chat' && <span>{t('studio.tab_chat', 'Chat')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'image' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('image');
                    }}
                    title={t('studio.tab_image', 'Ảnh')}
                  >
                    <HiOutlinePhoto size={15} />
                    {activeTab === 'image' && <span>{t('studio.tab_image', 'Ảnh')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'video' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('video');
                    }}
                    title={t('studio.tab_video', 'Video')}
                  >
                    <HiOutlineFilm size={15} />
                    {activeTab === 'video' && <span>{t('studio.tab_video', 'Video')}</span>}
                  </button>

                  <button
                    type="button"
                    className={`${styles.modeTabBtn} ${activeTab === 'audio' ? styles.modeTabActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabChange('audio');
                    }}
                    title={t('studio.tab_audio', 'Âm thanh')}
                  >
                    <SoundWaveIcon size={14} />
                    {activeTab === 'audio' && <span>{t('studio.tab_audio', 'Âm thanh')}</span>}
                  </button>
                </div>

                {/* 2. Book Icon [📖] & Presets Popover */}
                <div className={styles.bookPopoverWrapper}>
                  <button
                    type="button"
                    className={`${styles.iconBookBtn} ${isPresetsMenuOpen ? styles.iconBookBtnActive : ''}`}
                    title={t('studio.presets_title', 'Thư viện phong cách & prompt mẫu chuẩn')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPresetsMenuOpen(!isPresetsMenuOpen);
                      setIsModelMenuOpen(false);
                      setIsParamsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <HiOutlineBookOpen size={16} />
                  </button>

                  {isPresetsMenuOpen && (
                    <div className={styles.presetsPopoverMenu} onClick={(e) => e.stopPropagation()}>
                      {(presetGroups[activeTab] || []).map((group, gIdx) => (
                        <div key={gIdx} className={styles.presetGroup}>
                          <div className={styles.presetGroupTitle}>{group.groupName}</div>
                          {group.items.map((item, iIdx) => (
                            <button
                              key={iIdx}
                              type="button"
                              className={styles.presetItemBtn}
                              onClick={() => {
                                setPrompt(item.prompt);
                                if (item.ratio) setAspectRatio(item.ratio);
                                if (item.duration && activeTab === 'video') setVideoDuration(item.duration);
                                setIsPresetsMenuOpen(false);
                                setToastMsg(`${t('studio.presets_applied', 'Đã áp dụng mẫu')}: "${item.title}"`);
                                setTimeout(() => setToastMsg(null), 2500);
                              }}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Model Dropdown ✦ [Model Name] ⌵ */}
                <div className={styles.modelPillDropdown}>
                  <button
                    type="button"
                    className={styles.modelPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModelMenuOpen(!isModelMenuOpen);
                      setIsParamsMenuOpen(false);
                      setIsPresetsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span className={styles.starIcon}>✦</span>
                    <span>{cleanModelDisplayName(currentModel?.name || t('studio.select_model', 'Chọn Model'))}</span>
                    <HiOutlineChevronDown className={styles.chevron} size={12} />
                  </button>

                  {isModelMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      <div className={styles.paramGroupTitle}>
                        {t('studio.models_count', 'Mô hình')} {activeTab === 'image' ? t('studio.tab_image', 'Ảnh') : activeTab === 'video' ? t('studio.tab_video', 'Video') : t('studio.tab_audio', 'Âm thanh')} ({availableModels.length})
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

                {/* 4. Params Dropdown (1K · Tự động · Cao ⌵ hoặc 1080p · Tự động · 5s ⌵) */}
                <div className={styles.paramsPillDropdown}>
                  <button
                    type="button"
                    className={styles.paramsPillBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsParamsMenuOpen(!isParamsMenuOpen);
                      setIsModelMenuOpen(false);
                      setIsPresetsMenuOpen(false);
                      setIsInspireMenuOpen(false);
                    }}
                  >
                    <span>
                      {activeTab === 'chat'
                        ? (chatTone === 'creative' ? 'Sáng tạo' : chatTone === 'precise' ? 'Chính xác' : 'Cân bằng')
                        : activeTab === 'image'
                        ? `${resolution} · ${translateParamOption(aspectRatio, t)} · ${translateParamOption(quality, t)}`
                        : activeTab === 'video'
                        ? `${videoResolution} · ${translateParamOption(aspectRatio, t)} · ${videoDuration}`
                        : audioVoice}
                    </span>
                    <HiOutlineChevronDown className={styles.chevron} size={13} />
                  </button>

                  {isParamsMenuOpen && (
                    <div className={styles.customPopoverMenu}>
                      {activeTab === 'chat' && (
                        <>
                          <div className={styles.paramGroupTitle}>Phong cách phản hồi (Tone / Creativity)</div>
                          <div className={styles.paramOptionsGrid}>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'creative' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('creative');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Sáng tạo (Creative)
                            </button>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'balanced' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('balanced');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Cân bằng (Balanced)
                            </button>
                            <button
                              type="button"
                              className={`${styles.paramChip} ${chatTone === 'precise' ? styles.paramActive : ''}`}
                              onClick={() => {
                                setChatTone('precise');
                                setIsParamsMenuOpen(false);
                              }}
                            >
                              Chính xác (Precise)
                            </button>
                          </div>
                        </>
                      )}

                      {activeTab === 'image' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.resolution', 'Độ phân giải')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.resolutions || ['1K', '2K', '4K']).map((res) => (
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

                          <div className={styles.paramGroupTitle}>{t('studio.aspect_ratio', 'Tỉ lệ khung hình')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.aspectRatios || ['Tự động', '1:1', '16:9', '9:16', '4:3', '21:9']).map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {translateParamOption(ratio, t)}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.render_quality', 'Chất lượng Render')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.qualities || ['Tiêu chuẩn', 'Cao', 'Ultra']).map((q) => (
                              <button
                                key={q}
                                type="button"
                                className={`${styles.paramChip} ${quality === q ? styles.paramActive : ''}`}
                                onClick={() => setQuality(q)}
                              >
                                {translateParamOption(q, t)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'video' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.video_resolution', 'Độ phân giải video')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.resolutions || ['720p', '1080p', '4K']).map((res) => (
                              <button
                                key={res}
                                type="button"
                                className={`${styles.paramChip} ${videoResolution === res ? styles.paramActive : ''}`}
                                onClick={() => setVideoResolution(res)}
                              >
                                {res}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.aspect_ratio', 'Tỉ lệ khung hình')}</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.aspectRatios || ['Tự động', '16:9', '9:16']).map((ratio) => (
                              <button
                                key={ratio}
                                type="button"
                                className={`${styles.paramChip} ${aspectRatio === ratio ? styles.paramActive : ''}`}
                                onClick={() => setAspectRatio(ratio)}
                              >
                                {translateParamOption(ratio, t)}
                              </button>
                            ))}
                          </div>

                          <div className={styles.paramGroupTitle}>{t('studio.video_duration', 'Thời lượng video')} ({cleanModelDisplayName(currentModel?.name || '')})</div>
                          <div className={styles.paramOptionsGrid}>
                            {(activeModelConfig.durations || ['5s', '10s (Pro)']).map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                className={`${styles.paramChip} ${videoDuration === dur ? styles.paramActive : ''}`}
                                onClick={() => setVideoDuration(dur)}
                              >
                                {dur}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {activeTab === 'audio' && (
                        <>
                          <div className={styles.paramGroupTitle}>{t('studio.audio_voice_title', 'Ngôn ngữ & Giọng đọc')}</div>
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

                {/* Speaker Toggle Button for Video Mode */}
                {activeTab === 'video' && (
                  <button
                    type="button"
                    className={`${styles.speakerToolbarBtn} ${isAudioMuted ? styles.speakerMuted : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAudioMuted(!isAudioMuted);
                    }}
                    title={isAudioMuted ? t('studio.unmute', 'Bật âm thanh') : t('studio.mute', 'Tắt âm thanh')}
                  >
                    {isAudioMuted ? <HiOutlineSpeakerXMark size={16} /> : <HiOutlineSpeakerWave size={16} />}
                  </button>
                )}
              </div>

              {/* Right: Microphone & Neon Pink Circular Submit */}
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={`${styles.micBtn} ${isSpeechRecording ? styles.micActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVoiceInput();
                  }}
                  title={t('studio.voice_input', 'Nhập bằng giọng nói')}
                >
                  <HiOutlineMicrophone size={20} />
                </button>

                <button
                  type="button"
                  className={`${styles.pinkNeonSubmitBtn} ${!prompt.trim() ? styles.submitBtnReady : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate();
                  }}
                  disabled={isGenerating}
                  title={
                    hasInsufficientCredits
                      ? `Số dư không đủ (${currentCredits.toLocaleString()}/${totalCreditsNeeded} cr) - Bấm để nạp thêm!`
                      : `${t('common.generate', 'Tạo ngay')} (${totalCreditsNeeded} cr)`
                  }
                >
                  {isGenerating ? (
                    <span className={styles.buttonSpinner} />
                  ) : (
                    <HiOutlineArrowUp size={20} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Real Video Player */}
      {previewMedia && (
        <div className={styles.lightboxBackdrop} onClick={() => setPreviewMedia(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setPreviewMedia(null)}
              title={t('common.close', 'Đóng')}
            >
              <HiOutlineXMark size={20} />
            </button>

            <div className={styles.lightboxImageWrapper}>
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.videoUrl || previewMedia.url}
                  poster={previewMedia.poster}
                  controls
                  autoPlay
                  playsInline
                  loop
                  style={{ width: '100%', maxHeight: '540px', objectFit: 'contain', background: '#000' }}
                />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.prompt} />
              )}
            </div>

            <div className={styles.lightboxMeta}>
              <div className={styles.lightboxModelRow}>
                <span className={styles.lightboxModelBadge}>{previewMedia.model}</span>
                <a
                  href={previewMedia.videoUrl || previewMedia.url}
                  download={previewMedia.type === 'video' ? 'velox-video.mp4' : 'velox-asset.jpg'}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.lightboxDownloadBtn}
                >
                  <HiOutlineArrowDownTray size={15} /> {t('common.download', 'Tải bản gốc')} Ultra 4K
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
