import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePhoto, HiOutlineVideoCamera, HiOutlineMagnifyingGlass,
  HiOutlineArrowPath, HiOutlineCommandLine, HiOutlineSquares2X2
} from 'react-icons/hi2';
import { libraryService } from '../services/libraryService';
import type { MediaJob } from '../types';
import { MediaCard } from '../components/MediaCard';
import { MediaDetailModal } from '../components/MediaDetailModal';

export const MediaLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [mediaType, setMediaType] = useState<'ALL' | 'VIDEO' | 'IMAGE'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<MediaJob | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await libraryService.getMyJobs({
        media_type: mediaType,
        search,
        page,
        page_size: pageSize,
      });
      setJobs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load user media library:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaType, search, page, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tác phẩm này khỏi kho lịch sử của mình?')) return;
    try {
      await libraryService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedJob?.id === id) setSelectedJob(null);
    } catch (err) {
      alert('Không thể xóa mục này');
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
            <HiOutlineSquares2X2 size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Kho Tác Phẩm Cá Nhân (My Library)</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Lưu trữ toàn bộ ảnh và video AI bạn đã tạo qua VeloX Playground hoặc Developer API.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin/playground')}
            style={{
              padding: '9px 16px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <HiOutlineCommandLine size={16} /> Đến Playground Tạo Thêm
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '14px', marginBottom: '24px', background: '#111520', padding: '14px 18px',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Type Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['ALL', 'VIDEO', 'IMAGE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setMediaType(t); setPage(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                borderRadius: '8px', border: 'none',
                background: mediaType === t ? '#6366f1' : '#1a1f2e',
                color: mediaType === t ? '#fff' : '#94a3b8',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600
              }}
            >
              {t === 'VIDEO' && <HiOutlineVideoCamera />}
              {t === 'IMAGE' && <HiOutlinePhoto />}
              {t === 'ALL' ? 'Tất cả' : t === 'VIDEO' ? 'Video' : 'Ảnh'}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <HiOutlineMagnifyingGlass style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo prompt..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: '13px', outline: 'none'
              }}
            />
          </div>

          <button
            onClick={fetchJobs}
            title="Làm mới kho"
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: '#1a1f2e', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <HiOutlineArrowPath className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Đang tải kho tác phẩm...</div>
      ) : jobs.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center', background: '#111520',
          borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: '#94a3b8'
        }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '20px', background: 'rgba(168,85,247,0.1)', color: '#c084fc', marginBottom: '16px' }}>
            <HiOutlinePhoto size={40} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '17px' }}>Kho tác phẩm đang trống</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px' }}>
            Bạn chưa tạo ảnh hoặc video nào. Hãy dùng VeloX Playground hoặc Developer API để bắt đầu sáng tạo!
          </p>
          <button
            onClick={() => navigate('/admin/playground')}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600
            }}
          >
            Mở Playground Ngay
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '16px', marginBottom: '28px'
          }}>
            {jobs.map((j) => (
              <MediaCard
                key={j.id}
                job={j}
                onSelect={(selected) => setSelectedJob(selected)}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1a1f2e', color: page <= 1 ? '#475569' : '#cbd5e1',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px'
                }}
              >
                Trang Trước
              </button>
              <span style={{ fontSize: '12px', color: '#94a3b8', margin: '0 6px' }}>
                Trang {page} / {totalPages} (Tổng: {total} tác phẩm)
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                  background: '#1a1f2e', color: page >= totalPages ? '#475569' : '#cbd5e1',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px'
                }}
              >
                Trang Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <MediaDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};

export default MediaLibraryPage;
