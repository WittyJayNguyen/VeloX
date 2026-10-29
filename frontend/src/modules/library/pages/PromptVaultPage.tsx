import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineCommandLine,
  HiOutlineSquares2X2,
  HiOutlineTableCells,
  HiOutlineClipboardDocument,
  HiOutlineClipboardDocumentCheck,
  HiOutlineArrowDownTray,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineSparkles,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { libraryService } from '../services/libraryService';
import type { MediaJob, MediaVaultStats } from '../types';

export const PromptVaultPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Data states
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<MediaVaultStats>({
    total_prompts: 0,
    total_images: 0,
    total_videos: 0,
    total_credits: 0,
    models: [],
  });

  // Filter & pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [mediaType, setMediaType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [hasMediaOnly, setHasMediaOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Loading & interaction states
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<MediaJob | null>(null);

  // Fetch stats once on mount
  const fetchStats = useCallback(async () => {
    try {
      const data = await libraryService.getVaultStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load vault stats:', err);
    }
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await libraryService.getAllJobs({
        media_type: mediaType,
        model_id: selectedModel,
        has_media_only: hasMediaOnly,
        search: search.trim(),
        page,
        page_size: pageSize,
      });
      setJobs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load all media jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaType, selectedModel, hasMediaOnly, search, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('library.confirm_delete', 'Bạn có chắc chắn muốn xóa tác phẩm và prompt này khỏi kho lưu trữ?'))) return;
    try {
      await libraryService.adminDeleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedJob?.id === id) setSelectedJob(null);
      fetchStats();
    } catch (err) {
      alert(t('common.error_occurred', 'Không thể xóa mục này'));
    }
  };

  const handleOpenInPlayground = (prompt: string, modelId?: string) => {
    navigate('/admin/playground', {
      state: { prefillPrompt: prompt, prefillModel: modelId },
    });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#fff', padding: '0 4px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc',
          }}>
            <HiOutlineSparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {t('admin.nav.creative_vault', 'Kho Prompt & Tác Phẩm Hệ Thống')}
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
              }}>
                Master Vault
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {t('library.vault_subtitle', 'Lưu trữ toàn bộ prompt sáng tạo cùng kho chứa hình ảnh & video AI của tất cả người dùng.')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { fetchStats(); fetchJobs(); }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#181e2b',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HiOutlineArrowPath size={16} /> {t('common.refresh', 'Làm mới')}
          </button>
          <button
            onClick={() => navigate('/admin/playground')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
          >
            <HiOutlineCommandLine size={16} /> {t('library.go_to_playground', 'Đến Playground')}
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: '#111520',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <HiOutlineClipboardDocument size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('library.total_prompts', 'Tổng Prompts')}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {stats.total_prompts.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: '#111520',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
            <HiOutlinePhoto size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('library.total_images', 'Kho Hình Ảnh')}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {stats.total_images.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: '#111520',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <HiOutlineVideoCamera size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('library.total_videos', 'Kho Video AI')}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {stats.total_videos.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{
          background: '#111520',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '10px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
            <HiOutlineBolt size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('library.total_credits_spent', 'Tổng Credits Đã Chi')}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {Math.round(stats.total_credits).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#111520',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
      }}>
        {/* Left: Type Tabs & Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Media Type Tabs */}
          <div style={{ display: 'flex', background: '#0a0d14', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['ALL', 'IMAGE', 'VIDEO'] as const).map((tCode) => {
              const active = mediaType === tCode;
              return (
                <button
                  key={tCode}
                  onClick={() => { setMediaType(tCode); setPage(1); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? '#222838' : 'transparent',
                    color: active ? '#60a5fa' : '#94a3b8',
                    fontWeight: active ? 600 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tCode === 'ALL' && <HiOutlineSquares2X2 size={14} />}
                  {tCode === 'IMAGE' && <HiOutlinePhoto size={14} />}
                  {tCode === 'VIDEO' && <HiOutlineVideoCamera size={14} />}
                  <span>
                    {tCode === 'ALL' && t('common.all', 'Tất Cả')}
                    {tCode === 'IMAGE' && t('library.images', 'Hình Ảnh')}
                    {tCode === 'VIDEO' && t('library.videos', 'Video')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Model Filter Dropdown */}
          <select
            value={selectedModel}
            onChange={(e) => { setSelectedModel(e.target.value); setPage(1); }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#0a0d14',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">{t('library.all_models', '— Tất Cả Mô Hình AI —')}</option>
            {stats.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Only Media checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#cbd5e1',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={hasMediaOnly}
              onChange={(e) => { setHasMediaOnly(e.target.checked); setPage(1); }}
              style={{ cursor: 'pointer', accentColor: '#6366f1' }}
            />
            {t('library.has_media_only', 'Chỉ tác phẩm có file ảnh/video')}
          </label>
        </div>

        {/* Right: Search & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', minWidth: '220px', maxWidth: '320px', width: '100%' }}>
            <HiOutlineMagnifyingGlass size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('library.search_vault_placeholder', 'Tìm prompt hoặc email người tạo...')}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '8px',
                background: '#0a0d14',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#0a0d14', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setViewMode('grid')}
              title={t('common.grid_view', 'Xem dạng thẻ')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'grid' ? '#222838' : 'transparent',
                color: viewMode === 'grid' ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <HiOutlineSquares2X2 size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title={t('common.table_view', 'Xem dạng bảng dữ liệu')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? '#222838' : 'transparent',
                color: viewMode === 'table' ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <HiOutlineTableCells size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
          <div>{t('common.loading', 'Đang tải dữ liệu kho tác phẩm...')}</div>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          background: '#111520',
          borderRadius: '12px',
          border: '1px dashed rgba(255,255,255,0.12)',
        }}>
          <HiOutlineSparkles size={40} color="#64748b" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#e2e8f0' }}>
            {t('library.empty_vault_title', 'Chưa có prompt hoặc tác phẩm nào')}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {t('library.empty_vault_desc', 'Thử thay đổi bộ lọc tìm kiếm hoặc tạo thêm ảnh/video mới qua VeloX Playground.')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {jobs.map((job) => {
            const isVideo = job.media_type === 'VIDEO';
            const hasUrl = Boolean(job.output_url);
            const isCopied = copiedId === job.id;

            return (
              <div
                key={job.id}
                style={{
                  background: '#111520',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                {/* Media Preview Box */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  background: '#0a0d14',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: hasUrl ? 'pointer' : 'default',
                }}
                  onClick={() => hasUrl && setSelectedJob(job)}
                >
                  {hasUrl ? (
                    isVideo ? (
                      <video
                        src={job.output_url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    ) : (
                      <img
                        src={job.output_url}
                        alt={job.prompt}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      />
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      {isVideo ? <HiOutlineVideoCamera size={32} /> : <HiOutlinePhoto size={32} />}
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>Prompt Record Only</div>
                    </div>
                  )}

                  {/* Top-left: Media Type Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: isVideo ? 'rgba(168, 85, 247, 0.85)' : 'rgba(34, 197, 94, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 7px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  }}>
                    {isVideo ? <HiOutlineVideoCamera size={12} /> : <HiOutlinePhoto size={12} />}
                    <span>{isVideo ? 'VIDEO' : 'IMAGE'}</span>
                  </div>

                  {/* Top-right: Quick View overlay on hover */}
                  {hasUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '5px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <HiOutlineEye size={14} />
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Prompt Text Box */}
                  <div style={{
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    marginBottom: '10px',
                    position: 'relative',
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#cbd5e1',
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}>
                      {job.prompt}
                    </p>
                    <button
                      onClick={() => handleCopyPrompt(job.id, job.prompt)}
                      title={t('common.copy_prompt', 'Sao chép prompt')}
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: isCopied ? '#10b981' : '#1e2433',
                        color: isCopied ? '#fff' : '#94a3b8',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isCopied ? <HiOutlineClipboardDocumentCheck size={12} /> : <HiOutlineClipboardDocument size={12} />}
                      {isCopied ? t('common.copied', 'Đã sao chép') : t('common.copy', 'Copy')}
                    </button>
                  </div>

                  {/* Metadata Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%', overflow: 'hidden' }}>
                      <HiOutlineCpuChip size={13} color="#818cf8" />
                      <span style={{ color: '#818cf8', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {job.model_id || 'AI Model'}
                      </span>
                    </div>
                    <div>
                      {job.credits_charged > 0 && (
                        <span style={{ color: '#facc15', fontWeight: 600 }}>
                          {job.credits_charged} cr
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User info & date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', marginTop: '6px' }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                      {job.user_email || 'user@velox.ai'}
                    </span>
                    <span>
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <button
                      onClick={() => handleOpenInPlayground(job.prompt, job.model_id)}
                      title={t('library.run_in_playground', 'Chạy lại prompt này trong Playground')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#a5b4fc',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <HiOutlineCommandLine size={13} /> {t('library.remix_playground', 'Playground')}
                    </button>

                    {hasUrl && (
                      <a
                        href={job.output_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        title={t('common.download', 'Tải về')}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: '#181e2b',
                          color: '#e2e8f0',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <HiOutlineArrowDownTray size={13} />
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(job.id)}
                      title={t('common.delete', 'Xóa')}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HiOutlineTrash size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div style={{
          background: '#111520',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflowX: 'auto',
          marginBottom: '24px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0d111a', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px', width: '70px' }}>Media</th>
                <th style={{ padding: '12px 16px' }}>Prompt</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>Model</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>Người Tạo</th>
                <th style={{ padding: '12px 16px', width: '100px' }}>Credits</th>
                <th style={{ padding: '12px 16px', width: '130px' }}>Thời Gian</th>
                <th style={{ padding: '12px 16px', width: '110px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isVideo = job.media_type === 'VIDEO';
                const hasUrl = Boolean(job.output_url);
                const isCopied = copiedId === job.id;

                return (
                  <tr
                    key={job.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          background: '#0a0d14',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: hasUrl ? 'pointer' : 'default',
                        }}
                        onClick={() => hasUrl && setSelectedJob(job)}
                      >
                        {hasUrl ? (
                          isVideo ? (
                            <video src={job.output_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={job.output_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        ) : (
                          isVideo ? <HiOutlineVideoCamera size={18} color="#c084fc" /> : <HiOutlinePhoto size={18} color="#4ade80" />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', maxWidth: '380px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <p style={{
                          margin: 0,
                          fontSize: '12.5px',
                          color: '#e2e8f0',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flex: 1,
                        }}>
                          {job.prompt}
                        </p>
                        <button
                          onClick={() => handleCopyPrompt(job.id, job.prompt)}
                          title="Sao chép prompt"
                          style={{
                            background: isCopied ? '#10b981' : '#181e2b',
                            color: isCopied ? '#fff' : '#94a3b8',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {isCopied ? <HiOutlineClipboardDocumentCheck size={14} /> : <HiOutlineClipboardDocument size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#818cf8', fontWeight: 600, fontSize: '12px' }}>
                      {job.model_id || 'AI Model'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '12px' }}>
                      {job.user_email || 'user@velox.ai'}
                    </td>
                    <td style={{ padding: '10px 16px', color: '#facc15', fontWeight: 600, fontSize: '12px' }}>
                      {job.credits_charged} cr
                    </td>
                    <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px' }}>
                      {job.created_at ? new Date(job.created_at).toLocaleString() : ''}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenInPlayground(job.prompt, job.model_id)}
                          title="Chạy lại trong Playground"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#a5b4fc',
                            cursor: 'pointer',
                          }}
                        >
                          <HiOutlineCommandLine size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          title="Xóa"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#111520',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
            {t('common.showing_page', 'Trang {{current}} / {{total}} (Tổng số {{count}} tác phẩm)', {
              current: page,
              total: totalPages,
              count: total,
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#0a0d14',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="12">12 / trang</option>
              <option value="24">24 / trang</option>
              <option value="48">48 / trang</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: page <= 1 ? '#0d111a' : '#181e2b',
                color: page <= 1 ? '#475569' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {t('common.prev', 'Trước')}
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: page >= totalPages ? '#0d111a' : '#181e2b',
                color: page >= totalPages ? '#475569' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {t('common.next', 'Sau')}
            </button>
          </div>
        </div>
      )}

      {/* Detail / Full View Modal */}
      {selectedJob && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#121622',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            position: 'relative',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: selectedJob.media_type === 'VIDEO' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: selectedJob.media_type === 'VIDEO' ? '#c084fc' : '#4ade80',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {selectedJob.media_type}
                </span>
                <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>
                  {selectedJob.model_id || 'Model AI'}
                </span>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: selectedJob.output_url ? '1.2fr 1fr' : '1fr',
              overflowY: 'auto',
              flex: 1,
            }}>
              {/* Media Area */}
              {selectedJob.output_url && (
                <div style={{
                  background: '#090c12',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {selectedJob.media_type === 'VIDEO' ? (
                    <video
                      src={selectedJob.output_url}
                      controls
                      autoPlay
                      style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px' }}
                    />
                  ) : (
                    <img
                      src={selectedJob.output_url}
                      alt={selectedJob.prompt}
                      style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }}
                    />
                  )}
                </div>
              )}

              {/* Info Area */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('common.prompt', 'Prompt Sáng Tạo')}
                </h4>
                <div style={{
                  background: '#0a0d14',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}>
                  {selectedJob.prompt}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#0a0d14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{t('common.creator', 'Người Tạo')}</div>
                    <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedJob.user_email || 'guest@velox.ai'}
                    </div>
                  </div>
                  <div style={{ background: '#0a0d14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{t('common.credits', 'Chi Phí')}</div>
                    <div style={{ color: '#facc15', fontWeight: 600, marginTop: '2px' }}>
                      {selectedJob.credits_charged} credits
                    </div>
                  </div>
                  <div style={{ background: '#0a0d14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{t('common.render_time', 'Thời gian render')}</div>
                    <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>
                      {selectedJob.render_seconds ? `${selectedJob.render_seconds}s` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: '#0a0d14', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{t('common.created_at', 'Ngày khởi tạo')}</div>
                    <div style={{ color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>
                      {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleCopyPrompt(selectedJob.id, selectedJob.prompt)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#1e2433',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <HiOutlineClipboardDocument size={16} />
                    {copiedId === selectedJob.id ? t('common.copied', 'Đã sao chép') : t('common.copy_prompt', 'Sao chép Prompt')}
                  </button>

                  <button
                    onClick={() => {
                      const prompt = selectedJob.prompt;
                      const modelId = selectedJob.model_id;
                      setSelectedJob(null);
                      handleOpenInPlayground(prompt, modelId);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <HiOutlineCommandLine size={16} />
                    {t('library.remix_playground', 'Mở ở Playground')}
                  </button>

                  {selectedJob.output_url && (
                    <a
                      href={selectedJob.output_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: '#0a0d14',
                        color: '#cbd5e1',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      <HiOutlineArrowDownTray size={16} />
                      {t('common.download', 'Tải Về')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVaultPage;
