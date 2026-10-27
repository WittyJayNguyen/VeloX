import React, { useState } from 'react';
import {
  HiOutlineVideoCamera, HiOutlinePhoto, HiOutlineArrowDownTray,
  HiOutlineTrash, HiOutlineClock, HiOutlineLink, HiOutlineCheck, HiOutlineCloud
} from 'react-icons/hi2';
import type { MediaJob } from '../types';

interface Props {
  job: MediaJob;
  onSelect: (job: MediaJob) => void;
  onDelete: (id: string) => void;
}

export const MediaCard: React.FC<Props> = ({ job, onSelect, onDelete }) => {
  const isVideo = job.media_type === 'VIDEO';
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.output_url) return;
    navigator.clipboard.writeText(job.output_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: '#131722', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      {/* Media Preview Box */}
      <div
        onClick={() => onSelect(job)}
        style={{
          position: 'relative', width: '100%', height: '220px',
          background: '#090d16', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
        }}
      >
        {isVideo ? (
          <video
            src={job.output_url}
            muted
            loop
            playsInline
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
            onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <img
            src={job.output_url}
            alt={job.prompt}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Media Type Badge */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
          background: isVideo ? 'rgba(168,85,247,0.85)' : 'rgba(16,185,129,0.85)',
          color: '#fff', backdropFilter: 'blur(4px)'
        }}>
          {isVideo ? <HiOutlineVideoCamera /> : <HiOutlinePhoto />}
          {job.media_type}
        </div>

        {/* CDN Badge */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '3px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
          background: 'rgba(0,0,0,0.7)', color: '#38bdf8', backdropFilter: 'blur(4px)'
        }}>
          <HiOutlineCloud size={12} /> CDN
        </div>

        {/* Render Seconds Badge */}
        {job.render_seconds && (
          <div style={{
            position: 'absolute', bottom: '10px', right: '10px',
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
            background: 'rgba(0,0,0,0.7)', color: '#94a3b8', backdropFilter: 'blur(4px)'
          }}>
            <HiOutlineClock size={12} />
            {job.render_seconds}s
          </div>
        )}
      </div>

      {/* Content Meta */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <p
            onClick={() => onSelect(job)}
            title={job.prompt}
            style={{
              margin: '0 0 10px', fontSize: '13px', color: '#e2e8f0', fontWeight: 500,
              lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'pointer'
            }}
          >
            {job.prompt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Model: <strong style={{ color: '#94a3b8' }}>{job.model_id || 'Meta AI'}</strong></span>
            <span>{job.created_at ? new Date(job.created_at).toLocaleDateString('vi-VN') : ''}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
            {job.credits_charged} Credits
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            {job.output_url && (
              <>
                <button
                  onClick={handleCopyLink}
                  title="Sao chép link CDN"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                    background: copied ? 'rgba(16,185,129,0.2)' : '#1e2433',
                    color: copied ? '#34d399' : '#38bdf8', cursor: 'pointer'
                  }}
                >
                  {copied ? <HiOutlineCheck size={14} /> : <HiOutlineLink size={14} />}
                </button>
                <a
                  href={job.output_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  title="Tải về"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: '#1e2433', color: '#cbd5e1', textDecoration: 'none'
                  }}
                >
                  <HiOutlineArrowDownTray size={14} />
                </a>
              </>
            )}
            <button
              onClick={() => onDelete(job.id)}
              title="Xóa khỏi kho"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer'
              }}
            >
              <HiOutlineTrash size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
