import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineCommandLine,
  HiOutlineSparkles,
  HiOutlineCpuChip,
  HiOutlineKey,
  HiOutlineBolt,
  HiOutlineArrowPath,
  HiOutlineCodeBracket,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineShieldCheck,
  HiOutlinePhoto,
  HiOutlineClock,
  HiOutlineArrowsPointingOut,
  HiOutlineXMark,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { modelService } from '@modules/models/services/modelService';
import type { ModelCatalogItem } from '@modules/models/services/modelService';
import { playgroundService } from '../services/playgroundService';
import type {
  PlaygroundMessage,
  PlaygroundKeyOption,
  ConnectionTestResult,
  PlaygroundResponseData,
} from '../types/playground.types';
import styles from '@assets/scss/modules/playground.module.scss';

const PRESETS = [
  { label: '🎬 Tạo Video Muse', prompt: 'Imagine a video of ocean waves crashing on cliffs at golden sunset', modelCode: 'imagine-animate' },
  { label: '🎨 Tạo Ảnh Muse', prompt: 'Imagine a hyper-realistic cinematic red supercar speeding on neon city streets at midnight', modelCode: 'imagine-flash' },
  { label: '👋 Test Meta AI Chat', prompt: 'Xin chào! Hãy giới thiệu về bản thân bạn và khả năng của mô hình Llama 3.3.', modelCode: 'llama-3.3-70b-instruct' },
  { label: '💻 Viết Code Python', prompt: 'Viết một hàm Python FastAPI đơn giản có xác thực JWT Bearer token.', modelCode: 'gpt-4o' },
  { label: '⚡ Test Uptime & Latency', prompt: 'Báo cáo trạng thái phản hồi máy ảo và độ trễ gateway hiện tại.', modelCode: 'meta-ai-chat' },
];

const PlaygroundPage: React.FC = () => {

  // Models & Keys state
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('velox_playground_model') || 'imagine-animate';
  });
  const [keys, setKeys] = useState<PlaygroundKeyOption[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>(() => {
    return localStorage.getItem('velox_playground_key_id') || 'auto';
  });

  // Parameters
  const [temperature, setTemperature] = useState<number>(() => {
    const s = localStorage.getItem('velox_playground_temp');
    return s ? parseFloat(s) : 0.7;
  });
  const [maxTokens, setMaxTokens] = useState<number>(() => {
    const s = localStorage.getItem('velox_playground_tokens');
    return s ? parseInt(s, 10) : 1024;
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('velox_playground_sys_prompt') || '';
  });
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);

  // Media Generation Parameters (Aspect ratio, duration, num_outputs, reference image)
  const [aspectRatio, setAspectRatio] = useState<string>(() => {
    return localStorage.getItem('velox_playground_aspect_ratio') || '1:1';
  });
  const [durationSec, setDurationSec] = useState<number>(() => {
    const s = localStorage.getItem('velox_playground_duration_sec');
    return s ? parseInt(s, 10) : 5;
  });
  const [numOutputs, setNumOutputs] = useState<number>(() => {
    const s = localStorage.getItem('velox_playground_num_outputs');
    return s ? parseInt(s, 10) : 1;
  });
  const [quality, setQuality] = useState<string>(() => {
    return localStorage.getItem('velox_playground_quality') || 'hd';
  });
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat conversation state with localStorage persistence
  const [messages, setMessages] = useState<PlaygroundMessage[]>(() => {
    try {
      const s = localStorage.getItem('velox_playground_messages');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('velox_playground_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('velox_playground_key_id', selectedKeyId);
  }, [selectedKeyId]);

  useEffect(() => {
    localStorage.setItem('velox_playground_aspect_ratio', aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem('velox_playground_duration_sec', String(durationSec));
  }, [durationSec]);

  useEffect(() => {
    localStorage.setItem('velox_playground_num_outputs', String(numOutputs));
  }, [numOutputs]);

  useEffect(() => {
    try {
      localStorage.setItem('velox_playground_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save playground messages to localStorage:', e);
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('velox_playground_temp', String(temperature));
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('velox_playground_tokens', String(maxTokens));
  }, [maxTokens]);

  useEffect(() => {
    localStorage.setItem('velox_playground_sys_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('velox_playground_quality', quality);
  }, [quality]);

  // Panel state
  const [activeTab, setActiveTab] = useState<'params' | 'inspector'>('params');
  const [lastRequestPayload, setLastRequestPayload] = useState<any>(null);
  const [lastResponseData, setLastResponseData] = useState<PlaygroundResponseData | null>(null);

  // Live Ping state
  const [pingLoading, setPingLoading] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<ConnectionTestResult | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }
    setReferenceImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setNumOutputs(1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    setReferenceImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load models & keys on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modelsData, keysData] = await Promise.all([
        modelService.getModels(),
        playgroundService.getKeys(),
      ]);
      setModels(modelsData);
      setKeys(keysData);

      // Check if previously selected model is in list; if so, keep it!
      if (modelsData.length > 0) {
        const savedModel = localStorage.getItem('velox_playground_model');
        const exists = savedModel && modelsData.some((m) => m.model_code === savedModel);
        if (exists) {
          setSelectedModel(savedModel);
        } else if (!modelsData.some((m) => m.model_code === selectedModel)) {
          setSelectedModel(modelsData[0].model_code);
        }
      }

      // Check if previously selected key is in list
      const savedKey = localStorage.getItem('velox_playground_key_id');
      if (savedKey && (savedKey === 'auto' || keysData.some((k) => k.id === savedKey))) {
        setSelectedKeyId(savedKey);
      } else {
        const museKey = keysData.find((k) => k.name.toLowerCase().includes('muse'));
        if (museKey) {
          setSelectedKeyId(museKey.id);
        }
      }
    } catch (err) {
      console.error('Failed to load playground initial data:', err);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentModelObj = models.find((m) => m.model_code === selectedModel);
  const catUpper = (currentModelObj?.category || '').toUpperCase();

  const isVideoModel =
    catUpper === 'VIDEO' ||
    (!catUpper && (
      selectedModel.toLowerCase().includes('video') ||
      selectedModel.toLowerCase().includes('animate') ||
      selectedModel.toLowerCase().includes('veo') ||
      selectedModel.toLowerCase().includes('seedance') ||
      selectedModel.toLowerCase().includes('minimax')
    ));

  const isImageModel =
    !isVideoModel &&
    (catUpper === 'IMAGE' ||
      (!catUpper && (
        selectedModel.toLowerCase().includes('imagine') ||
        selectedModel.toLowerCase().includes('image')
      )));

  const isAudioModel = catUpper === 'AUDIO' || (!catUpper && selectedModel.toLowerCase().includes('tts'));
  const isChatModel = !isVideoModel && !isImageModel && !isAudioModel;

  // Grouped models for organized select dropdown
  const videoModels = models.filter((m) => m.category?.toUpperCase() === 'VIDEO');
  const imageModels = models.filter((m) => m.category?.toUpperCase() === 'IMAGE');
  const chatModels = models.filter((m) => !['VIDEO', 'IMAGE', 'AUDIO'].includes(m.category?.toUpperCase() || ''));
  const audioModels = models.filter((m) => m.category?.toUpperCase() === 'AUDIO');

  // Expected completion time calculation
  const getEstimatedTime = () => {
    if (isVideoModel) {
      if (durationSec === 3) return '~25 - 45s';
      if (durationSec === 5) return '~45 - 75s';
      return '~70 - 110s';
    }
    if (isImageModel) {
      if (numOutputs === 1) return '~5 - 10s';
      if (numOutputs === 2) return '~8 - 15s';
      return '~12 - 20s';
    }
    return '~0.8 - 2.0s';
  };

  // Live elapsed time timer when request is executing
  useEffect(() => {
    let interval: any = null;
    if (loading) {
      const startTime = Date.now();
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Handle Send Prompt
  const handleSendPrompt = async () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || loading) return;

    const userMsg: PlaygroundMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    const payload = {
      model_code: selectedModel,
      messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      key_id: selectedKeyId !== 'auto' ? selectedKeyId : undefined,
      temperature,
      max_tokens: maxTokens,
      system_prompt: systemPrompt || undefined,
      aspect_ratio: aspectRatio,
      duration_sec: isVideoModel ? durationSec : undefined,
      num_outputs: referenceImage ? 1 : (isImageModel ? numOutputs : 1),
      quality: isImageModel ? quality : undefined,
      reference_image: referenceImage || undefined,
    };
    setLastRequestPayload(payload);

    try {
      const res = await playgroundService.sendPrompt(payload);
      setLastResponseData(res);

      const assistantMsg: PlaygroundMessage = {
        id: res.id,
        role: 'assistant',
        content: res.content,
        media_url: res.media_url,
        media_urls: res.media_urls,
        timestamp: new Date().toLocaleTimeString(),
        latency_ms: res.latency_ms,
        tokens: res.usage.total_tokens,
        provider: res.provider,
        model_code: res.model_code,
        key_name: res.key_name,
        debug_info: res.debug_info,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      playgroundService.getKeys().then(setKeys).catch(() => {});
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err.message || 'Lỗi khi gửi yêu cầu tới mô hình';
      const errorMsg: PlaygroundMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `❌ **Yêu cầu thất bại:** ${errMsg}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Ping
  const handleTestConnection = async () => {
    if (selectedKeyId === 'auto') {
      alert('Vui lòng chọn một API Key / Token cụ thể để test kết nối.');
      return;
    }
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await playgroundService.testConnection(selectedKeyId);
      setPingResult(res);
    } catch (err: any) {
      setPingResult({
        key_name: 'Selected Key',
        provider: 'Unknown',
        is_live: false,
        latency_ms: 0,
        status_code: 500,
        message: err.message || 'Lỗi kiểm tra kết nối',
        details: {},
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastResponseData(null);
    try {
      localStorage.removeItem('velox_playground_messages');
    } catch {}
  };

  return (
    <div className={styles.playgroundContainer}>
      {/* Top Header Bar */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          {/* Model Selector */}
          <div className={styles.selectorGroup}>
            <span className={styles.label}>
              <HiOutlineCpuChip size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Model:
            </span>
            <select
              className={styles.selectControl}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {videoModels.length > 0 && (
                <optgroup label="🎬 Mô Hình Video (Video Generation)">
                  {videoModels.map((m) => (
                    <option key={m.id} value={m.model_code}>
                      🎬 {m.name} ({m.provider})
                    </option>
                  ))}
                </optgroup>
              )}
              {imageModels.length > 0 && (
                <optgroup label="🎨 Mô Hình Hình Ảnh (Image Generation)">
                  {imageModels.map((m) => (
                    <option key={m.id} value={m.model_code}>
                      🎨 {m.name} ({m.provider})
                    </option>
                  ))}
                </optgroup>
              )}
              {chatModels.length > 0 && (
                <optgroup label="💬 Mô Hình Chat & Lý Luận (Chat / LLM)">
                  {chatModels.map((m) => (
                    <option key={m.id} value={m.model_code}>
                      💬 {m.name} ({m.provider})
                    </option>
                  ))}
                </optgroup>
              )}
              {audioModels.length > 0 && (
                <optgroup label="🔊 Mô Hình Giọng Nói (TTS / Audio)">
                  {audioModels.map((m) => (
                    <option key={m.id} value={m.model_code}>
                      🔊 {m.name} ({m.provider})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Dynamic Mode Badge */}
          <div
            className={styles.modelBadge}
            style={{
              borderColor: isVideoModel ? 'rgba(236, 72, 153, 0.5)' : isImageModel ? 'rgba(56, 189, 248, 0.5)' : isChatModel ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 191, 36, 0.5)',
              background: isVideoModel ? 'rgba(236, 72, 153, 0.12)' : isImageModel ? 'rgba(56, 189, 248, 0.12)' : isChatModel ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
              color: isVideoModel ? '#f472b6' : isImageModel ? '#38bdf8' : isChatModel ? '#34d399' : '#fbbf24',
              fontWeight: 700,
            }}
          >
            <span>
              {isVideoModel
                ? '🎬 CHẾ ĐỘ VIDEO'
                : isImageModel
                ? '🎨 CHẾ ĐỘ SINH ẢNH'
                : isChatModel
                ? '💬 CHẾ ĐỘ CHAT & LÝ LUẬN'
                : '🔊 CHẾ ĐỘ ÂM THANH'}
            </span>
            <span>•</span>
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{currentModelObj?.provider || 'Gateway'}</span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>⏱️ {getEstimatedTime()}</span>
          </div>

          {/* Key Selector */}
          <div className={styles.selectorGroup}>
            <span className={styles.label}>
              <HiOutlineKey size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Key / Pool:
            </span>
            <select
              className={styles.selectControl}
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
            >
              <option value="auto">⚡ Tự động định tuyến (Auto Pool)</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.provider} - {k.auth_type})
                  {k.quota_daily ? ` — Quota: ${k.quota_daily_used ?? 0}/${k.quota_daily.toLocaleString()}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.presetBtn}
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            title="Thiết lập chỉ dẫn hệ thống"
          >
            <HiOutlineCodeBracket size={14} style={{ display: 'inline', marginRight: 4 }} />
            {showSystemPrompt ? 'Ẩn System Prompt' : 'System Prompt'}
          </button>

          <button
            className={styles.presetBtn}
            onClick={clearChat}
            disabled={messages.length === 0}
            title="Xóa toàn bộ tin nhắn"
          >
            <HiOutlineTrash size={14} style={{ display: 'inline', marginRight: 4 }} />
            Xóa hội thoại
          </button>
        </div>
      </div>

      {/* Presets Toolbar */}
      <div className={styles.presetsBar}>
        <span className={styles.presetTitle}>Mẫu thử nhanh:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            className={styles.presetBtn}
            onClick={() => {
              setInputPrompt(p.prompt);
              if (p.modelCode && models.some((m) => m.model_code === p.modelCode)) {
                setSelectedModel(p.modelCode);
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Split */}
      <div className={styles.mainWorkspace}>
        {/* Chat / Execution Area */}
        <section className={styles.chatSection}>
          <div className={styles.messagesViewport}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <HiOutlineCommandLine />
                </div>
                <h3>VeloX Admin AI Playground</h3>
                <p>
                  Kiểm tra trực tiếp độ trễ, lưu lượng và kết quả phản hồi của mô hình{' '}
                  <strong style={{ color: '#818cf8' }}>{selectedModel}</strong> qua các API Key và phiên Web Session
                  đã kích hoạt trong hệ thống.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.messageRow} ${
                    m.role === 'user' ? styles.userRow : styles.assistantRow
                  }`}
                >
                  <div className={styles.avatar}>
                    {m.role === 'user' ? 'U' : <HiOutlineSparkles size={16} />}
                  </div>
                  <div className={styles.messageBubble}>
                    <div className={styles.messageContent}>{m.content}</div>

                    {/* Multi-item Grid if media_urls has multiple items */}
                    {m.media_urls && m.media_urls.length > 1 ? (
                      <div className={styles.mediaGrid}>
                        {m.media_urls.map((url, idx) => (
                          <div key={idx} className={styles.mediaGridItem}>
                            {url.startsWith('data:video') || url.includes('.mp4') ? (
                              <video
                                controls
                                autoPlay
                                muted
                                playsInline
                                loop
                                src={url}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img src={url} alt={`Muse generated ${idx + 1}`} />
                            )}
                            <div className={styles.mediaItemOverlay}>
                              <a
                                href={url}
                                download={url.startsWith('data:video') ? `muse_video_${idx + 1}.mp4` : url.includes('webp') ? `muse_image_${idx + 1}.webp` : `muse_image_${idx + 1}.png`}
                                className={styles.overlayBtn}
                                title="Tải về máy"
                              >
                                ⬇️ Tải #{idx + 1}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : m.media_url ? (
                      <div className={styles.mediaPreview}>
                        {m.media_url.startsWith('data:video') || m.media_url.includes('.mp4') ? (
                          <video
                            controls
                            autoPlay
                            muted
                            playsInline
                            loop
                            src={m.media_url}
                            style={{
                              width: '100%',
                              borderRadius: 8,
                              display: 'block',
                              maxHeight: 480,
                              objectFit: 'contain',
                              background: '#090d16',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            }}
                          />
                        ) : (
                          <img
                            src={m.media_url}
                            alt="Generated media preview"
                            style={{ width: '100%', borderRadius: 8, display: 'block' }}
                          />
                        )}
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                          <a
                            href={m.media_url}
                            download={m.media_url.startsWith('data:video') ? 'muse_video.mp4' : m.media_url.includes('webp') ? 'muse_image.webp' : 'muse_image.png'}
                            className={styles.presetBtn}
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            ⬇️ Tải xuống {m.media_url.startsWith('data:video') ? 'Video' : 'Ảnh'}
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {m.role === 'assistant' && (
                      <div className={styles.messageMeta}>
                        {m.latency_ms !== undefined && (
                          <span className={styles.pill}>
                            ⚡ {(m.latency_ms / 1000).toFixed(1)}s ({m.latency_ms} ms)
                          </span>
                        )}
                        {m.tokens !== undefined && (
                          <span className={styles.pill}>📊 {m.tokens} tokens</span>
                        )}
                        {m.key_name && (
                          <span className={styles.pill}>🔑 {m.key_name}</span>
                        )}
                        {m.debug_info?.live_authenticated && (
                          <span className={styles.liveSessionBadge}>● Live Session</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                <div className={styles.avatar}>
                  <HiOutlineArrowPath size={16} className="animate-spin" />
                </div>
                <div className={styles.messageBubble}>
                  <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                        {isVideoModel
                          ? `🎬 Đang render video ${durationSec}s bằng mô hình Muse...`
                          : isImageModel
                          ? `🎨 Đang render ${numOutputs} ảnh bằng mô hình Muse...`
                          : `⚡ Đang điều phối qua Gateway tới ${selectedModel}...`}
                      </span>
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                        }}
                      >
                        ⏱️ {elapsedTime.toFixed(1)}s (Dự kiến: {getEstimatedTime()})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {isVideoModel
                        ? `Muse đang xử lý kết xuất video ${durationSec}s theo tỷ lệ ${aspectRatio}. Kết nối đang được giữ liên tục cho đến khi Muse hoàn tất...`
                        : isImageModel
                        ? `Muse đang trích xuất đồng thời ${numOutputs} ảnh tỷ lệ ${aspectRatio}. Kết nối đang được giữ liên tục cho đến khi có kết quả...`
                        : `Vui lòng đợi cho đến khi mô hình hoàn tất xử lý và phản hồi dữ liệu.`}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputAreaContainer}>
            {showSystemPrompt && (
              <div className={styles.systemPromptRow}>
                <span>System:</span>
                <input
                  type="text"
                  placeholder="Chỉ dẫn phong cách phản hồi cho AI (System instruction)..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>
            )}

            {/* Reference Image Preview Chip */}
            {referenceImage && (
              <div className={styles.referenceImageBar}>
                <div className={styles.refThumbnail}>
                  <img src={referenceImage} alt="Ref preview" />
                </div>
                <div className={styles.refInfo}>
                  <span className={styles.refTitle}>Ảnh tham chiếu (Reference Image)</span>
                  <span className={styles.refName}>{referenceImageName || 'image.png'}</span>
                </div>
                <button
                  type="button"
                  className={styles.removeRefBtn}
                  onClick={handleRemoveImage}
                  title="Xóa ảnh tham chiếu"
                >
                  <HiOutlineXMark size={14} />
                </button>
              </div>
            )}

            <div className={styles.promptInputRow}>
              <textarea
                placeholder={
                  isVideoModel
                    ? "🎬 [Chế độ Video] Nhập mô tả kịch bản video bạn muốn tạo... (ví dụ: Drone quay cảnh sóng biển hoàng hôn rực rỡ)"
                    : isImageModel
                    ? `🎨 [Chế độ Sinh Ảnh] Nhập mô tả ảnh bạn muốn tạo (${referenceImage ? '1 ảnh từ ảnh mẫu' : `${numOutputs} ảnh`})... (ví dụ: Chân dung cô gái Việt Nam trong tà áo dài)`
                    : "💬 [Chế độ Chat LLM] Nhập câu hỏi hoặc prompt thử nghiệm... (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
                }
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendPrompt}
                disabled={loading || !inputPrompt.trim()}
              >
                <HiOutlinePaperAirplane size={17} />
                <span>Gửi Test</span>
              </button>
            </div>

            {/* Media Controls Toolbar */}
            <div className={styles.mediaToolbar}>
              {/* Dynamic Mode Badge on Toolbar */}
              <div
                className={styles.toolbarGroup}
                style={{
                  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                  paddingRight: 10,
                  marginRight: 4,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isVideoModel ? '#f472b6' : isImageModel ? '#38bdf8' : isChatModel ? '#34d399' : '#fbbf24',
                  }}
                >
                  {isVideoModel ? '🎬 Render Video' : isImageModel ? '🎨 Sinh Hình Ảnh' : isChatModel ? '💬 Chat LLM' : '🔊 Âm Thanh'}
                </span>
              </div>

              {(isImageModel || isVideoModel) && (
                /* Kích thước / Tỉ lệ khung hình */
                <div className={styles.toolbarGroup}>
                  <span className={styles.toolbarLabel}>
                    <HiOutlineArrowsPointingOut size={13} />
                    Kích thước:
                  </span>
                  <div className={styles.pillGroup}>
                    {[
                      { val: '1:1', label: '1:1 Vuông' },
                      { val: '16:9', label: '16:9 Ngang' },
                      { val: '9:16', label: '9:16 Dọc' },
                      { val: '4:3', label: '4:3' },
                      { val: '3:4', label: '3:4' },
                    ].map((ratio) => (
                      <button
                        key={ratio.val}
                        type="button"
                        className={`${styles.toolbarPill} ${aspectRatio === ratio.val ? styles.active : ''}`}
                        onClick={() => setAspectRatio(ratio.val)}
                        title={`Tỉ lệ ${ratio.label}`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nếu là Video Model: Chọn độ dài video */}
              {isVideoModel && (
                <div className={styles.toolbarGroup}>
                  <span className={styles.toolbarLabel}>
                    <HiOutlineClock size={13} />
                    Thời lượng video:
                  </span>
                  <div className={styles.pillGroup}>
                    {[
                      { val: 3, label: '3s (~14s)' },
                      { val: 5, label: '5s (~20s)' },
                      { val: 10, label: '10s (~30s)' },
                    ].map((dur) => (
                      <button
                        key={dur.val}
                        type="button"
                        className={`${styles.toolbarPill} ${durationSec === dur.val ? styles.active : ''}`}
                        onClick={() => setDurationSec(dur.val)}
                        title={`Thời lượng video ${dur.val} giây`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nếu là Image Model: Chọn số lượng ảnh tạo đồng thời */}
              {isImageModel && (
                <div className={styles.toolbarGroup}>
                  <span className={styles.toolbarLabel}>
                    <HiOutlineSquares2X2 size={13} />
                    Số lượng:
                  </span>
                  <div className={styles.pillGroup}>
                    {referenceImage ? (
                      <span
                        className={styles.toolbarPill}
                        style={{ opacity: 0.9, cursor: 'default', background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}
                      >
                        1 ảnh (1:1 với ảnh mẫu)
                      </span>
                    ) : (
                      [
                        { val: 1, label: '1 ảnh (~4s)' },
                        { val: 2, label: '2 ảnh (~5s)' },
                        { val: 4, label: '4 ảnh (~6s)' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          className={`${styles.toolbarPill} ${numOutputs === item.val ? styles.active : ''}`}
                          onClick={() => setNumOutputs(item.val)}
                          title={`Tạo đồng thời ${item.val} ảnh Muse`}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Nếu là Image Model: Chọn chất lượng ảnh */}
              {isImageModel && (
                <div className={styles.toolbarGroup}>
                  <span className={styles.toolbarLabel}>
                    <HiOutlineSparkles size={13} />
                    Chất lượng:
                  </span>
                  <div className={styles.pillGroup}>
                    {[
                      { val: 'standard', label: '1080p' },
                      { val: 'hd', label: 'HD 2K' },
                      { val: '4k', label: 'Ultra 4K' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        className={`${styles.toolbarPill} ${quality === item.val ? styles.active : ''}`}
                        onClick={() => setQuality(item.val)}
                        title={`Độ phân giải & chi tiết ${item.label}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nếu là Chat Model: Hiển thị trạng thái gateway */}
              {isChatModel && (
                <div className={styles.toolbarGroup}>
                  <span className={styles.toolbarLabel} style={{ color: '#38bdf8' }}>
                    ⚡ Phản hồi trực tiếp từ Gateway (Dự kiến: {getEstimatedTime()})
                  </span>
                </div>
              )}

              {/* Ảnh tham chiếu upload (Áp dụng cho Image & Video) */}
              {(isImageModel || isVideoModel) && (
                <div className={styles.toolbarGroup}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    className={`${styles.attachBtn} ${referenceImage ? styles.hasFile : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh tham chiếu từ máy tính"
                  >
                    <HiOutlinePhoto size={14} />
                    <span>{referenceImage ? '✓ Đã có ảnh mẫu' : '📎 Thêm ảnh tham chiếu'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Settings & Inspector Panel */}
        <aside className={styles.sidePanel}>
          <div className={styles.panelTabs}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'params' ? styles.active : ''}`}
              onClick={() => setActiveTab('params')}
            >
              <HiOutlineAdjustmentsHorizontal size={14} style={{ display: 'inline', marginRight: 4 }} />
              Cấu Hình Tham Số
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'inspector' ? styles.active : ''}`}
              onClick={() => setActiveTab('inspector')}
            >
              <HiOutlineBolt size={14} style={{ display: 'inline', marginRight: 4 }} />
              Debug Inspector
            </button>
          </div>

          <div className={styles.panelContent}>
            {activeTab === 'params' ? (
              <>
                {/* Temperature Slider */}
                <div className={styles.paramGroup}>
                  <div className={styles.paramHeader}>
                    <span>Temperature</span>
                    <span className={styles.paramValue}>{temperature}</span>
                  </div>
                  <div className={styles.paramDesc}>
                    Kiểm soát tính sáng tạo (0.0: Chính xác, 1.0+: Sáng tạo).
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>

                {/* Max Tokens Slider */}
                <div className={styles.paramGroup}>
                  <div className={styles.paramHeader}>
                    <span>Max Tokens</span>
                    <span className={styles.paramValue}>{maxTokens}</span>
                  </div>
                  <div className={styles.paramDesc}>
                    Số token tối đa cho mỗi phản hồi trả về.
                  </div>
                  <input
                    type="range"
                    min="128"
                    max="4096"
                    step="64"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                </div>

                {/* Media Parameters Group */}
                {(isImageModel || isVideoModel) && (
                  <div className={styles.paramGroup}>
                    <div className={styles.paramHeader}>
                      <span>Tỉ lệ khung hình (Aspect Ratio)</span>
                      <span className={styles.paramValue}>{aspectRatio}</span>
                    </div>
                    <div className={styles.paramDesc}>
                      Áp dụng cho các mô hình sinh ảnh/video Muse & Meta AI.
                    </div>
                    <div className={styles.pillGroup} style={{ marginTop: 8 }}>
                      {['1:1', '16:9', '9:16', '4:3', '3:4'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          className={`${styles.toolbarPill} ${aspectRatio === r ? styles.active : ''}`}
                          onClick={() => setAspectRatio(r)}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isVideoModel && (
                  <div className={styles.paramGroup}>
                    <div className={styles.paramHeader}>
                      <span>Thời lượng video</span>
                      <span className={styles.paramValue}>{durationSec}s (~{durationSec === 3 ? '14s' : durationSec === 5 ? '20s' : '30s'})</span>
                    </div>
                    <div className={styles.paramDesc}>
                      Độ dài render clip video khi sử dụng mô hình Muse video.
                    </div>
                    <div className={styles.pillGroup} style={{ marginTop: 8 }}>
                      {[3, 5, 10].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`${styles.toolbarPill} ${durationSec === d ? styles.active : ''}`}
                          onClick={() => setDurationSec(d)}
                        >
                          {d} giây
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isImageModel && (
                  <div className={styles.paramGroup}>
                    <div className={styles.paramHeader}>
                      <span>Số lượng ảnh đồng thời (Batch Output)</span>
                      <span className={styles.paramValue}>
                        {referenceImage ? '1 ảnh (1:1 với ảnh mẫu)' : `${numOutputs} ảnh`}
                      </span>
                    </div>
                    <div className={styles.paramDesc}>
                      {referenceImage
                        ? 'Khi có ảnh tham chiếu, mô hình Muse sẽ tạo 1 ảnh chuyển đổi chất lượng cao tương ứng với ảnh mẫu.'
                        : 'Mô hình Muse hỗ trợ trích xuất đồng thời lên tới 4 ảnh trong 1 lần chạy (~5-8s). Hoạt động thực tế trên phiên web.'}
                    </div>
                    {!referenceImage && (
                      <div className={styles.pillGroup} style={{ marginTop: 8 }}>
                        {[
                          { val: 1, label: '1 ảnh (~4s)' },
                          { val: 2, label: '2 ảnh (~5s)' },
                          { val: 4, label: '4 ảnh (~6s)' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            className={`${styles.toolbarPill} ${numOutputs === item.val ? styles.active : ''}`}
                            onClick={() => setNumOutputs(item.val)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Image Quality Settings */}
                {isImageModel && (
                  <div className={styles.paramGroup}>
                    <div className={styles.paramHeader}>
                      <span>Chất lượng hình ảnh (Quality)</span>
                      <span className={styles.paramValue}>
                        {quality === 'standard' ? 'Tiêu chuẩn (1080p)' : quality === 'hd' ? 'HD 2K (Sắc nét)' : 'Ultra HD 4K (Cực nét)'}
                      </span>
                    </div>
                    <div className={styles.paramDesc}>
                      Tăng cường độ phân giải chi tiết và kết xuất khử răng cưa theo chuẩn Meta Imagine.
                    </div>
                    <div className={styles.pillGroup} style={{ marginTop: 8 }}>
                      {[
                        { val: 'standard', label: '1080p Tiêu chuẩn' },
                        { val: 'hd', label: 'HD 2K' },
                        { val: '4k', label: 'Ultra HD 4K' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          className={`${styles.toolbarPill} ${quality === item.val ? styles.active : ''}`}
                          onClick={() => setQuality(item.val)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Ping Key Test */}
                <div className={styles.pingCard}>
                  <div className={styles.pingHeader}>
                    <span>Kiểm tra phiên Key trực tiếp</span>
                    <HiOutlineShieldCheck size={16} color="#34d399" />
                  </div>
                  <div className={styles.paramDesc}>
                    Gửi yêu cầu kiểm tra trạng thái máy ảo Meta AI Hatch hoặc API Key.
                  </div>
                  <button
                    className={styles.pingBtn}
                    onClick={handleTestConnection}
                    disabled={pingLoading || selectedKeyId === 'auto'}
                  >
                    <HiOutlineBolt size={14} />
                    <span>{pingLoading ? 'Đang ping...' : 'Ping Test Key / Session'}</span>
                  </button>

                  {pingResult && (
                    <div
                      className={`${styles.pingResult} ${
                        pingResult.is_live ? styles.success : styles.error
                      }`}
                    >
                      <div>
                        <strong>{pingResult.key_name}</strong>: {pingResult.message}
                      </div>
                      {pingResult.latency_ms > 0 && (
                        <div style={{ marginTop: 4, opacity: 0.85 }}>
                          Độ trễ: {pingResult.latency_ms} ms | HTTP {pingResult.status_code}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Debug Inspector Tab */}
                <div className={styles.inspectorBox}>
                  <span className={styles.inspectorLabel}>Payload Gửi Đi:</span>
                  <pre>
                    {lastRequestPayload
                      ? JSON.stringify(lastRequestPayload, null, 2)
                      : '// Chưa có request nào được gửi'}
                  </pre>
                </div>

                <div className={styles.inspectorBox}>
                  <span className={styles.inspectorLabel}>Phản Hồi & Telemetry:</span>
                  <pre>
                    {lastResponseData
                      ? JSON.stringify(
                          {
                            id: lastResponseData.id,
                            latency_ms: lastResponseData.latency_ms,
                            provider: lastResponseData.provider,
                            key_used: lastResponseData.key_name,
                            usage: lastResponseData.usage,
                            debug_info: lastResponseData.debug_info,
                          },
                          null,
                          2
                        )
                      : '// Chưa có phản hồi từ mô hình'}
                  </pre>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PlaygroundPage;
