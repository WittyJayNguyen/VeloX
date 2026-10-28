import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineCheck,
  HiOutlineClipboardDocument,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineChevronDown,
  HiOutlineStop,
  HiOutlineLightBulb,
} from 'react-icons/hi2';
import { RiSparklingFill, RiOpenaiFill } from 'react-icons/ri';
import { SiAnthropic, SiGoogle, SiMeta } from 'react-icons/si';

import { useAuthStore } from '@modules/auth/states/authStore';
import { modelService, type PublicModelItem } from '@modules/models/services/modelService';
import apiClient from '@modules/core/lib/apiClient';
import TopupModal from '@modules/core/components/TopupModal/TopupModal';
import styles from './ChatPage.module.scss';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  latency_ms?: number;
  tokens?: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  model_code: string;
  system_prompt?: string;
  tone: 'creative' | 'balanced' | 'precise';
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CuratedChatModel {
  id: string;
  name: string;
  model_code: string;
  provider: string;
  badge?: string;
  description: string;
  credits: string;
  selling_credit_price: number;
}

// Curated list of high-performance LLM Chat Models
const CURATED_CHAT_MODELS: CuratedChatModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    model_code: 'gpt-4o',
    provider: 'OpenAI',
    badge: 'HOT',
    description: 'Flagship đa phương thức, suy luận logic và kiến thức chuyên sâu đỉnh cao',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    model_code: 'claude-3-5-sonnet',
    provider: 'Anthropic',
    badge: 'TOP CODE',
    description: 'Mô hình viết code & phân tích logic sắc bén nhất hiện nay',
    credits: '2 cr/tin nhắn',
    selling_credit_price: 2,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    model_code: 'deepseek-r1',
    provider: 'DeepSeek',
    badge: 'REASONING',
    description: 'Mô hình suy luận chuỗi tư duy (Chain of Thought), giải toán & logic',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    model_code: 'gemini-1-5-pro',
    provider: 'Google',
    badge: '2M CTX',
    description: 'Cửa sổ ngữ cảnh khổng lồ 2M token, đọc trọn tài liệu và mã nguồn lớn',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
  {
    id: 'llama-3-3-70b',
    name: 'Llama 3.3 (70B)',
    model_code: 'llama-3.3-70b-instruct',
    provider: 'Meta AI',
    badge: 'FAST',
    description: 'Mã nguồn mở tốc độ cao, độ trễ cực thấp, tối ưu chi phí',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    model_code: 'gpt-4o-mini',
    provider: 'OpenAI',
    badge: 'SIÊU NHANH',
    description: 'Phiên bản gọn nhẹ, tốc độ tức thì cho các tác vụ hỏi đáp nhanh',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    model_code: 'claude-3-5-haiku',
    provider: 'Anthropic',
    badge: 'TIẾT KIỆM',
    description: 'Tốc độ phản hồi cực nhanh với chi phí thấp từ Anthropic',
    credits: '1 cr/tin nhắn',
    selling_credit_price: 1,
  },
];

const STORAGE_KEY = 'velox_ai_chat_sessions_v2';

const createDefaultSession = (modelCode = 'gpt-4o'): ChatSession => ({
  id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  title: 'Đoạn chat mới',
  model_code: modelCode,
  tone: 'balanced',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Helper to render provider icon
const renderProviderIcon = (provider: string, size = 18) => {
  const p = (provider || '').toLowerCase();
  if (p.includes('openai')) return <RiOpenaiFill size={size} color="#10a37f" />;
  if (p.includes('anthropic')) return <SiAnthropic size={size} color="#d97706" />;
  if (p.includes('google')) return <SiGoogle size={size} color="#38bdf8" />;
  if (p.includes('meta')) return <SiMeta size={size} color="#3b82f6" />;
  if (p.includes('deepseek')) return <RiSparklingFill size={size} color="#6366f1" />;
  return <HiOutlineSparkles size={size} color="#10a37f" />;
};

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, syncProfile, addCredits } = useAuthStore();

  const urlModel = searchParams.get('model');

  // Enforce authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/chat')}`, { replace: true });
    } else {
      syncProfile().catch(() => {});
    }
  }, [isAuthenticated, navigate, syncProfile]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [topupOpen, setTopupOpen] = useState<boolean>(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isSysPromptModalOpen, setIsSysPromptModalOpen] = useState<boolean>(false);
  const [modelFilterProvider, setModelFilterProvider] = useState<string>('all');
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Sessions state with LocalStorage persistence
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
    }
    return [createDefaultSession(urlModel || 'gpt-4o')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  // DB models from API strictly filtered to CHAT
  const [dbChatModels, setDbChatModels] = useState<PublicModelItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist chat sessions:', e);
    }
  }, [sessions]);

  // Load public CHAT models from backend API
  useEffect(() => {
    let isMounted = true;
    modelService
      .getPublicModels({ category: 'CHAT' })
      .then((data) => {
        if (!isMounted) return;
        // Strictly ensure only CHAT & TEXT models, exclude any video/image/audio
        const filtered = data.filter((m) => {
          const cat = (m.category || '').toUpperCase();
          const code = (m.model_code || '').toLowerCase();
          if (cat !== 'CHAT' && cat !== 'TEXT' && cat !== 'LLM') return false;
          if (
            code.includes('animate') ||
            code.includes('imagine') ||
            code.includes('video') ||
            code.includes('flux') ||
            code.includes('kling') ||
            code.includes('runway') ||
            code.includes('suno') ||
            code.includes('audio') ||
            code.includes('midjourney')
          ) {
            return false;
          }
          return true;
        });
        setDbChatModels(filtered);
      })
      .catch((err) => {
        console.warn('Failed to load public chat models from API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Active Session
  const activeSession = useMemo(() => {
    const found = sessions.find((s) => s.id === activeSessionId);
    return found || sessions[0] || createDefaultSession();
  }, [sessions, activeSessionId]);

  // Combined models list (Curated + DB models)
  const allChatModels = useMemo<CuratedChatModel[]>(() => {
    const list: CuratedChatModel[] = [...CURATED_CHAT_MODELS];
    const existingCodes = new Set(list.map((m) => m.model_code.toLowerCase()));

    for (const dbm of dbChatModels) {
      if (!existingCodes.has(dbm.model_code.toLowerCase())) {
        list.push({
          id: dbm.id || dbm.model_code,
          name: dbm.name,
          model_code: dbm.model_code,
          provider: dbm.provider,
          description: dbm.description || 'Mô hình ngôn ngữ hội thoại AI từ VeloX Gateway',
          credits: `${dbm.selling_credit_price || 1} cr/tin nhắn`,
          selling_credit_price: dbm.selling_credit_price || 1,
        });
        existingCodes.add(dbm.model_code.toLowerCase());
      }
    }
    return list;
  }, [dbChatModels]);

  // Current active model details
  const currentModel = useMemo(() => {
    const found = allChatModels.find(
      (m) => m.model_code.toLowerCase() === (activeSession.model_code || '').toLowerCase()
    );
    return found || allChatModels[0];
  }, [allChatModels, activeSession.model_code]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isGenerating]);

  // Adjust textarea height automatically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Switch session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setEditingSessionId(null);
  };

  // Create new session
  const handleNewChat = () => {
    const newSession = createDefaultSession(currentModel.model_code);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputPrompt('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Delete session
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('chat.delete_confirm', 'Bạn có chắc muốn xóa cuộc trò chuyện này không?'))) {
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== id);
        if (remaining.length === 0) {
          const fresh = createDefaultSession(currentModel.model_code);
          setActiveSessionId(fresh.id);
          return [fresh];
        }
        if (activeSessionId === id) {
          setActiveSessionId(remaining[0].id);
        }
        return remaining;
      });
    }
  };

  // Rename session
  const handleStartRename = (e: React.MouseEvent, s: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditingTitle(s.title);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editingTitle.trim(), updatedAt: Date.now() } : s))
      );
    }
    setEditingSessionId(null);
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm(t('chat.clear_all_confirm', 'Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện không?'))) {
      const fresh = createDefaultSession(currentModel.model_code);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  };

  // Change model for current session
  const handleSelectModel = (modelCode: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, model_code: modelCode, updatedAt: Date.now() } : s))
    );
    setIsModelModalOpen(false);
  };

  // Change tone
  const handleSelectTone = (tone: 'creative' | 'balanced' | 'precise') => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, tone, updatedAt: Date.now() } : s))
    );
  };

  // Update System Prompt
  const handleSaveSystemPrompt = (prompt: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, system_prompt: prompt, updatedAt: Date.now() } : s))
    );
    setIsSysPromptModalOpen(false);
  };

  // Copy message
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Stop Generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    // Check credits
    const requiredCredits = currentModel.selling_credit_price || 1;
    if ((user?.credit_balance ?? 0) < requiredCredits) {
      setTopupOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Auto update title if this is the first message
    const shouldUpdateTitle = activeSession.messages.length === 0 || activeSession.title === 'Đoạn chat mới';
    const newTitle = shouldUpdateTitle
      ? textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '')
      : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setInputPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const chatMessagesPayload: Array<{ role: string; content: string }> = [];
      if (activeSession.system_prompt) {
        chatMessagesPayload.push({ role: 'system', content: activeSession.system_prompt });
      }
      for (const m of updatedMessages) {
        chatMessagesPayload.push({ role: m.role, content: m.content });
      }

      const temperature =
        activeSession.tone === 'creative' ? 0.9 : activeSession.tone === 'precise' ? 0.2 : 0.7;

      const res = await apiClient.post(
        '/playground/chat',
        {
          model_code: activeSession.model_code,
          messages: chatMessagesPayload,
          temperature,
          max_tokens: 2048,
        },
        {
          signal: abortControllerRef.current?.signal,
        }
      );

      const assistantContent =
        res.data?.content ||
        res.data?.data?.content ||
        res.data?.message ||
        'Đã nhận phản hồi từ mô hình AI.';

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        model: currentModel.name,
        provider: currentModel.provider,
        latency_ms: res.data?.latency_ms,
        tokens: res.data?.usage?.total_tokens,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...s.messages, assistantMsg],
                updatedAt: Date.now(),
              }
            : s
        )
      );

      // Deduct credits visually & sync
      addCredits(-requiredCredits);
      syncProfile().catch(() => {});
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        console.log('Chat request aborted by user');
      } else {
        const errorContent =
          err.response?.data?.detail ||
          'Xin lỗi, không thể kết nối tới mô hình AI. Vui lòng kiểm tra lại số dư credit hoặc chọn mô hình khác.';

        const assistantErrMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Lỗi:** ${errorContent}`,
          model: currentModel.name,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id ? { ...s, messages: [...s.messages, assistantErrMsg] } : s
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter sessions by search
  const filteredSessions = useMemo(() => {
    if (!searchKeyword.trim()) return sessions;
    const kw = searchKeyword.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(kw));
  }, [sessions, searchKeyword]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: [],
    };

    for (const s of filteredSessions) {
      const d = new Date(s.updatedAt || s.createdAt);
      if (d >= today) {
        groups.today.push(s);
      } else if (d >= yesterday) {
        groups.yesterday.push(s);
      } else if (d >= last7Days) {
        groups.last7Days.push(s);
      } else {
        groups.older.push(s);
      }
    }

    return groups;
  }, [filteredSessions]);

  // Filter models inside the strict chat models modal
  const filteredModalModels = useMemo(() => {
    return allChatModels.filter((m) => {
      // Filter by provider tab
      if (modelFilterProvider !== 'all') {
        const p = m.provider.toLowerCase();
        if (modelFilterProvider === 'openai' && !p.includes('openai')) return false;
        if (modelFilterProvider === 'anthropic' && !p.includes('anthropic')) return false;
        if (modelFilterProvider === 'deepseek' && !p.includes('deepseek')) return false;
        if (modelFilterProvider === 'meta_google' && !p.includes('meta') && !p.includes('google')) return false;
      }
      // Filter by search query
      if (modelSearchQuery.trim()) {
        const q = modelSearchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCode = m.model_code.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [allChatModels, modelFilterProvider, modelSearchQuery]);

  // Render markdown helper for code and formatting
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className={styles.messageText}>
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).trim().split('\n');
            const language = lines[0].trim() || 'code';
            const codeBody = lines.slice(1).join('\n') || lines[0];

            return (
              <div key={idx} className={styles.codeBlockWrapper}>
                <div className={styles.codeHeader}>
                  <span>{language}</span>
                  <button
                    type="button"
                    className={styles.copyCodeBtn}
                    onClick={() => navigator.clipboard.writeText(codeBody)}
                    title="Sao chép mã nguồn"
                  >
                    <HiOutlineClipboardDocument size={13} /> Sao chép
                  </button>
                </div>
                <pre>
                  <code>{codeBody}</code>
                </pre>
              </div>
            );
          }

          // Plain text with line breaks
          return (
            <span key={idx}>
              {part.split('\n\n').map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.chatContainer}>
      {/* ── LEFT SIDEBAR (HISTORY & NEW CHAT) ── */}
      <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <button
            type="button"
            className={styles.newChatBtn}
            onClick={handleNewChat}
            title={t('chat.new_chat_btn', '+ Tạo đoạn chat mới')}
          >
            <HiOutlinePlus size={18} />
            <span>{t('chat.new_chat', 'Đoạn chat mới')}</span>
          </button>
          <button
            type="button"
            className={styles.collapseSidebarBtn}
            onClick={() => setSidebarOpen(false)}
            title="Thu gọn cột lịch sử"
          >
            <HiOutlineBars3 size={18} />
          </button>
        </div>

        {/* Search History */}
        <div className={styles.searchBox}>
          <div className={styles.searchInputWrapper}>
            <HiOutlineMagnifyingGlass size={15} />
            <input
              type="text"
              placeholder={t('chat.search_placeholder', 'Tìm kiếm đoạn chat...')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className={styles.historyList}>
          {filteredSessions.length === 0 ? (
            <div className={styles.emptyHistory}>
              {t('chat.no_history', 'Chưa có lịch sử đoạn chat nào')}
            </div>
          ) : (
            <>
              {groupedSessions.today.length > 0 && (
                <>
                  <div className={styles.groupLabel}>{t('chat.group_today', 'Hôm nay')}</div>
                  {groupedSessions.today.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.sessionItem} ${s.id === activeSession.id ? styles.active : ''}`}
                      onClick={() => handleSelectSession(s.id)}
                    >
                      <span className={styles.sessionIcon}>
                        <HiOutlineChatBubbleLeftRight size={16} />
                      </span>
                      {editingSessionId === s.id ? (
                        <input
                          autoFocus
                          type="text"
                          className={styles.titleEditInput}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(s.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id)}
                        />
                      ) : (
                        <span className={styles.sessionTitle} title={s.title}>
                          {s.title}
                        </span>
                      )}
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, s)}
                          title={t('chat.rename_chat', 'Đổi tên')}
                        >
                          <HiOutlinePencilSquare size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title={t('chat.delete_chat', 'Xóa')}
                        >
                          <HiOutlineTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedSessions.yesterday.length > 0 && (
                <>
                  <div className={styles.groupLabel}>{t('chat.group_yesterday', 'Hôm qua')}</div>
                  {groupedSessions.yesterday.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.sessionItem} ${s.id === activeSession.id ? styles.active : ''}`}
                      onClick={() => handleSelectSession(s.id)}
                    >
                      <span className={styles.sessionIcon}>
                        <HiOutlineChatBubbleLeftRight size={16} />
                      </span>
                      <span className={styles.sessionTitle} title={s.title}>
                        {s.title}
                      </span>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, s)}
                          title={t('chat.rename_chat', 'Đổi tên')}
                        >
                          <HiOutlinePencilSquare size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title={t('chat.delete_chat', 'Xóa')}
                        >
                          <HiOutlineTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedSessions.last7Days.length > 0 && (
                <>
                  <div className={styles.groupLabel}>{t('chat.group_last_7_days', '7 ngày trước')}</div>
                  {groupedSessions.last7Days.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.sessionItem} ${s.id === activeSession.id ? styles.active : ''}`}
                      onClick={() => handleSelectSession(s.id)}
                    >
                      <span className={styles.sessionIcon}>
                        <HiOutlineChatBubbleLeftRight size={16} />
                      </span>
                      <span className={styles.sessionTitle} title={s.title}>
                        {s.title}
                      </span>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, s)}
                          title={t('chat.rename_chat', 'Đổi tên')}
                        >
                          <HiOutlinePencilSquare size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title={t('chat.delete_chat', 'Xóa')}
                        >
                          <HiOutlineTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {groupedSessions.older.length > 0 && (
                <>
                  <div className={styles.groupLabel}>{t('chat.group_older', 'Cũ hơn')}</div>
                  {groupedSessions.older.map((s) => (
                    <div
                      key={s.id}
                      className={`${styles.sessionItem} ${s.id === activeSession.id ? styles.active : ''}`}
                      onClick={() => handleSelectSession(s.id)}
                    >
                      <span className={styles.sessionIcon}>
                        <HiOutlineChatBubbleLeftRight size={16} />
                      </span>
                      <span className={styles.sessionTitle} title={s.title}>
                        {s.title}
                      </span>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, s)}
                          title={t('chat.rename_chat', 'Đổi tên')}
                        >
                          <HiOutlinePencilSquare size={13} />
                        </button>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title={t('chat.delete_chat', 'Xóa')}
                        >
                          <HiOutlineTrash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div
            className={styles.creditBalancePill}
            onClick={() => setTopupOpen(true)}
            title="Nhấp để nạp thêm Credit"
          >
            <RiSparklingFill size={13} />
            <span>{(user?.credit_balance ?? 0).toLocaleString()} cr</span>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={handleClearAllHistory}
              title={t('chat.clear_all', 'Xóa toàn bộ lịch sử')}
            >
              {t('chat.clear_all', 'Xóa tất cả')}
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ── */}
      <main className={styles.chatMain}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {!sidebarOpen && (
              <button
                type="button"
                className={styles.toggleSidebarBtn}
                onClick={() => setSidebarOpen(true)}
                title="Mở cột lịch sử"
              >
                <HiOutlineBars3 size={20} />
              </button>
            )}

            <div className={styles.chatTitleBadge}>
              <span className={styles.titleText}>{activeSession.title}</span>
              <button
                type="button"
                className={styles.editTitleBtn}
                onClick={(e) => handleStartRename(e, activeSession)}
                title={t('chat.rename_chat', 'Đổi tên')}
              >
                <HiOutlinePencilSquare size={14} />
              </button>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {/* Model Selector Header Button */}
            <button
              type="button"
              className={styles.modelSelectorHeaderBtn}
              onClick={() => setIsModelModalOpen(true)}
              title="Nhấp để đổi mô hình AI Chat"
            >
              {renderProviderIcon(currentModel.provider, 16)}
              <span className={styles.modelName}>{currentModel.name}</span>
              {currentModel.badge && <span className={styles.modelTag}>{currentModel.badge}</span>}
              <HiOutlineChevronDown size={14} />
            </button>

            {/* Quick New Chat Button */}
            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={handleNewChat}
              title={t('chat.new_chat', 'Đoạn chat mới')}
            >
              <HiOutlinePlus size={18} />
            </button>
          </div>
        </header>

        {/* Messages Pane */}
        <div className={styles.messagesPane}>
          {activeSession.messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className={styles.emptyState}>
              <div className={styles.welcomeGlowIcon}>
                <RiSparklingFill size={34} />
              </div>
              <h2 className={styles.emptyStateTitle}>Hôm nay bạn cần VeloX AI hỗ trợ gì?</h2>
              <p className={styles.emptyStateSubtitle}>
                Trò chuyện trực tiếp cùng <strong>{currentModel.name}</strong> ({currentModel.provider}). Hãy
                chọn một gợi ý bên dưới hoặc nhập câu hỏi bất kỳ để bắt đầu!
              </p>

              {/* Starter Prompt Cards */}
              <div className={styles.startersGrid}>
                <div
                  className={styles.starterCard}
                  onClick={() =>
                    handleSendMessage(
                      'Viết một hàm Python FastAPI đơn giản có xác thực JWT Bearer token và phân quyền RBAC.'
                    )
                  }
                >
                  <div className={styles.starterIcon}>💻</div>
                  <div className={styles.starterTitle}>Lập trình & API Backend</div>
                  <div className={styles.starterPrompt}>
                    Viết một hàm Python FastAPI có xác thực JWT Bearer token và phân quyền RBAC.
                  </div>
                </div>

                <div
                  className={styles.starterCard}
                  onClick={() =>
                    handleSendMessage(
                      'Lập kế hoạch ra mắt sản phẩm SaaS AI cho thị trường Việt Nam trong vòng 30 ngày.'
                    )
                  }
                >
                  <div className={styles.starterIcon}>📊</div>
                  <div className={styles.starterTitle}>Chiến lược & Kế hoạch</div>
                  <div className={styles.starterPrompt}>
                    Lập kế hoạch ra mắt sản phẩm SaaS AI cho thị trường Việt Nam trong vòng 30 ngày.
                  </div>
                </div>

                <div
                  className={styles.starterCard}
                  onClick={() =>
                    handleSendMessage(
                      'So sánh ưu nhược điểm giữa kiến trúc Microservices và Monolithic kèm ví dụ thực tế.'
                    )
                  }
                >
                  <div className={styles.starterIcon}>🧠</div>
                  <div className={styles.starterTitle}>Tư duy & Phân tích Logic</div>
                  <div className={styles.starterPrompt}>
                    So sánh ưu nhược điểm giữa kiến trúc Microservices và Monolithic chi tiết.
                  </div>
                </div>

                <div
                  className={styles.starterCard}
                  onClick={() =>
                    handleSendMessage(
                      'Soạn thảo kịch bản video ngắn 60 giây giới thiệu giải pháp AI Gateway cho doanh nghiệp.'
                    )
                  }
                >
                  <div className={styles.starterIcon}>✍️</div>
                  <div className={styles.starterTitle}>Soạn thảo & Sáng tạo</div>
                  <div className={styles.starterPrompt}>
                    Soạn thảo kịch bản video ngắn 60 giây giới thiệu giải pháp AI Gateway cho khách hàng.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Render Messages */
            activeSession.messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${
                  m.role === 'user' ? styles.userRow : styles.assistantRow
                }`}
              >
                <div className={styles.avatar}>
                  {m.role === 'user' ? (
                    'U'
                  ) : (
                    renderProviderIcon(m.provider || currentModel.provider, 18)
                  )}
                </div>

                <div className={styles.messageBubble}>
                  {m.role === 'assistant' && (
                    <div className={styles.messageHeader}>
                      <span className={styles.modelBadgeTag}>
                        <HiOutlineSparkles size={14} />
                        {m.model || currentModel.name}
                      </span>
                      {m.latency_ms !== undefined && (
                        <span className={styles.latencyTag}>⚡ {(m.latency_ms / 1000).toFixed(2)}s</span>
                      )}
                    </div>
                  )}

                  {renderMessageContent(m.content)}

                  {m.role === 'assistant' && (
                    <div className={styles.messageFooter}>
                      <button
                        type="button"
                        className={styles.msgActionBtn}
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        title="Sao chép tin nhắn"
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <HiOutlineCheck size={14} color="#10a37f" /> Đã chép
                          </>
                        ) : (
                          <>
                            <HiOutlineClipboardDocument size={14} /> Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Generating Indicator */}
          {isGenerating && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.avatar}>
                {renderProviderIcon(currentModel.provider, 18)}
              </div>
              <div className={styles.messageBubble}>
                <div className={styles.generatingRow}>
                  <div className={styles.dots}>
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>{currentModel.name} đang suy luận và xử lý câu trả lời...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── BOTTOM AREA (INPUT & STRICT CHAT MODEL SELECTOR) ── */}
        <div className={styles.bottomArea}>
          {/* Controls Bar Above Input */}
          <div className={styles.controlsBar}>
            <div className={styles.controlsLeft}>
              {/* Bottom Model Picker Button */}
              <button
                type="button"
                className={styles.bottomModelPickerBtn}
                onClick={() => setIsModelModalOpen(true)}
                title="Bấm để chọn Model Chat khác"
              >
                {renderProviderIcon(currentModel.provider, 14)}
                <span>{currentModel.name}</span>
                <HiOutlineChevronDown size={12} className={styles.chevronIcon} />
              </button>

              {/* Tone Selector */}
              <div className={styles.toneSelector}>
                <button
                  type="button"
                  className={activeSession.tone === 'creative' ? styles.active : ''}
                  onClick={() => handleSelectTone('creative')}
                  title="Sáng tạo cao (0.9)"
                >
                  Sáng tạo
                </button>
                <button
                  type="button"
                  className={activeSession.tone === 'balanced' ? styles.active : ''}
                  onClick={() => handleSelectTone('balanced')}
                  title="Cân bằng (0.7)"
                >
                  Cân bằng
                </button>
                <button
                  type="button"
                  className={activeSession.tone === 'precise' ? styles.active : ''}
                  onClick={() => handleSelectTone('precise')}
                  title="Chính xác logic (0.2)"
                >
                  Chính xác
                </button>
              </div>

              {/* System Prompt Button */}
              <button
                type="button"
                className={`${styles.sysPromptBtn} ${activeSession.system_prompt ? styles.hasSysPrompt : ''}`}
                onClick={() => setIsSysPromptModalOpen(true)}
                title="Cài đặt chỉ dẫn hệ thống (System Prompt)"
              >
                <HiOutlineAdjustmentsHorizontal size={13} />
                <span>{activeSession.system_prompt ? 'Chỉ dẫn (Bật)' : 'Chỉ dẫn AI'}</span>
              </button>
            </div>

            <div className={styles.controlsRight}>
              <span className={styles.creditEstimationBadge}>
                <RiSparklingFill size={12} color="#2dd4bf" />
                {currentModel.credits}
              </span>
            </div>
          </div>

          {/* Input Card */}
          <div className={styles.inputCard}>
            {activeSession.system_prompt && (
              <div className={styles.systemPromptBanner}>
                <HiOutlineLightBulb size={14} color="#38bdf8" />
                <span className={styles.sysText} title={activeSession.system_prompt}>
                  <strong>Chỉ dẫn:</strong> {activeSession.system_prompt}
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveSystemPrompt('')}
                  title="Gỡ bỏ chỉ dẫn"
                >
                  <HiOutlineXMark size={14} />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              className={styles.chatTextarea}
              placeholder={t(
                'chat.input_placeholder',
                'Hỏi bất kỳ điều gì hoặc yêu cầu viết code, phân tích... (Enter để gửi, Shift+Enter xuống dòng)'
              )}
              value={inputPrompt}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />

            <div className={styles.inputActionsRow}>
              <span className={styles.inputHint}>
                Enter để gửi · Shift + Enter để xuống dòng
              </span>

              {isGenerating ? (
                <button
                  type="button"
                  className={`${styles.sendBtn} ${styles.stopBtn}`}
                  onClick={handleStopGenerating}
                  title="Dừng phản hồi"
                >
                  <HiOutlineStop size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.sendBtn}
                  disabled={!inputPrompt.trim()}
                  onClick={() => handleSendMessage()}
                  title={t('chat.send_btn', 'Gửi')}
                >
                  <HiOutlinePaperAirplane size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── STRICT CHAT MODELS MODAL DIALOG ── */}
      {isModelModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModelModalOpen(false)}>
          <div className={styles.modelModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBox}>
                <h3>{t('chat.model_selector_title', 'Chọn Mô Hình Chat AI')}</h3>
                <p>
                  {t(
                    'chat.model_selector_desc',
                    'Hệ thống chỉ tải các mô hình ngôn ngữ chuyên sâu cho hội thoại & lập trình'
                  )}
                </p>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsModelModalOpen(false)}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div className={styles.modalFilterBar}>
              <div className={styles.modalSearchInput}>
                <HiOutlineMagnifyingGlass size={16} />
                <input
                  type="text"
                  placeholder={t(
                    'chat.search_model_placeholder',
                    'Tìm kiếm mô hình chat (GPT-4o, Claude, DeepSeek...)'
                  )}
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className={styles.providerTabs}>
                <button
                  type="button"
                  className={modelFilterProvider === 'all' ? styles.active : ''}
                  onClick={() => setModelFilterProvider('all')}
                >
                  Tất cả ({allChatModels.length})
                </button>
                <button
                  type="button"
                  className={modelFilterProvider === 'openai' ? styles.active : ''}
                  onClick={() => setModelFilterProvider('openai')}
                >
                  OpenAI
                </button>
                <button
                  type="button"
                  className={modelFilterProvider === 'anthropic' ? styles.active : ''}
                  onClick={() => setModelFilterProvider('anthropic')}
                >
                  Anthropic
                </button>
                <button
                  type="button"
                  className={modelFilterProvider === 'deepseek' ? styles.active : ''}
                  onClick={() => setModelFilterProvider('deepseek')}
                >
                  DeepSeek
                </button>
                <button
                  type="button"
                  className={modelFilterProvider === 'meta_google' ? styles.active : ''}
                  onClick={() => setModelFilterProvider('meta_google')}
                >
                  Meta / Google
                </button>
              </div>
            </div>

            <div className={styles.modelsGridScroll}>
              {filteredModalModels.map((m) => {
                const isSelected =
                  m.model_code.toLowerCase() === activeSession.model_code.toLowerCase();
                return (
                  <div
                    key={m.id}
                    className={`${styles.modelCardOption} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelectModel(m.model_code)}
                  >
                    <div className={styles.modelCardLeft}>
                      <div className={styles.modelCardHeader}>
                        {renderProviderIcon(m.provider, 18)}
                        <span className={styles.modelTitle}>{m.name}</span>
                        <span className={styles.providerBadge}>{m.provider}</span>
                        {m.badge && <span className={styles.badgePill}>{m.badge}</span>}
                      </div>
                      <div className={styles.modelDesc}>{m.description}</div>
                    </div>

                    <div className={styles.modelCardRight}>
                      <span className={styles.creditPriceTag}>{m.credits}</span>
                      {isSelected && (
                        <span className={styles.checkIcon}>
                          <HiOutlineCheck size={20} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SYSTEM PROMPT MODAL ── */}
      {isSysPromptModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSysPromptModalOpen(false)}>
          <div className={styles.systemPromptDialog} onClick={(e) => e.stopPropagation()}>
            <h4>Cấu Hình Chỉ Dẫn Hệ Thống (System Prompt)</h4>
            <p>
              Định hình tính cách, vai trò hoặc yêu cầu phản hồi riêng biệt cho AI trong cuộc trò chuyện này.
            </p>
            <textarea
              defaultValue={activeSession.system_prompt || ''}
              id="sysPromptInput"
              placeholder="Ví dụ: Bạn là một chuyên gia lập trình Fullstack cấp cao, trả lời bằng tiếng Việt gãy gọn và luôn đính kèm ví dụ code sạch."
            />
            <div className={styles.sysModalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsSysPromptModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={() => {
                  const val = (document.getElementById('sysPromptInput') as HTMLTextAreaElement)?.value || '';
                  handleSaveSystemPrompt(val.trim());
                }}
              >
                Lưu Chỉ Dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPUP MODAL FOR FAST VIETQR RECHARGE ── */}
      <TopupModal isOpen={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
};

export default ChatPage;
