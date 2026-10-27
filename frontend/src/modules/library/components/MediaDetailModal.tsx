import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineXMark, HiOutlineClipboard, HiOutlineCheck,
  HiOutlineArrowDownTray, HiOutlineVideoCamera, HiOutlinePhoto,
  HiOutlineLink, HiOutlineCommandLine, HiOutlineCloud
} from 'react-icons/hi2';
import type { MediaJob } from '../types';

interface Props {
  job: MediaJob | null;
  onClose: () => void;
}

export const MediaDetailModal: React.FC<Props> = ({ job, onClose }) => {
  const navigate = useNavigate();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!job) return null;

  const isVideo = job.media_type === 'VIDEO';

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(job.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyLink = () => {
    if (!job.output_url) return;
    navigator.clipboard.writeText(job.output_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGoToPlayground = () => {
    onClose();
    navigate('/admin/playground', { state: { initialPrompt: job.prompt, modelCode: job.model_id } });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#111520', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '18px', maxWidth: '880px', width: '100%', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)', color: '#fff'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161b2a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              background: isVideo ? 'rgba(168,85,247,0.2)' : 'rgba(16,185,129,0.2)',
              color: isVideo ? '#c084fc' : '#34d399'
            }}>
              {isVideo ? <HiOutlineVideoCamera /> : <HiOutlinePhoto />} {job.media_type}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
              background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 600
            }}>
              <HiOutlineCloud size={13} /> Cloud CDN (Zero-Disk)
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>ID: {job.id.slice(0, 8)}...</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center'
            }}
          >
            <HiOutlineXMark />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, overflowY: 'auto' }}>
          {/* Media Player Box */}
          <div style={{
            flex: '1 1 450px', background: '#070a10', display: 'flex',
            alignItems: 'center', justifyContent: 'center', minHeight: '360px', padding: '16px'
          }}>
            {isVideo ? (
              <video
                src={job.output_url}
                controls
                autoPlay
                loop
                playsInline
                style={{ maxWidth: '100%', maxHeight: '520px', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
              />
            ) : (
              <img
                src={job.output_url}
                alt={job.prompt}
                style={{ maxWidth: '100%', maxHeight: '520px', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
          </div>

          {/* Details Sidebar */}
          <div style={{ flex: '1 1 320px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Prompt Gốc
                </span>
                <button
                  onClick={handleCopyPrompt}
                  style={{
                    background: 'transparent', border: 'none', color: '#38bdf8',
                    cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {copiedPrompt ? <><HiOutlineCheck color="#34d399" /> Đã copy</> : <><HiOutlineClipboard /> Copy</>}
                </button>
              </div>

              <div style={{
                background: '#0b0f19', padding: '12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)', fontSize: '13px',
                lineHeight: '1.5', color: '#e2e8f0', marginBottom: '20px'
              }}>
                "{job.prompt}"
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Model AI:</span>
                  <strong style={{ color: '#fff' }}>{job.model_id || 'Meta AI Muse'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Lưu Trữ:</span>
                  <strong style={{ color: '#38bdf8' }}>Cloud CDN (Zero-Disk)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Thời gian sinh:</span>
                  <strong style={{ color: '#34d399' }}>{job.render_seconds ? `${job.render_seconds}s` : 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Chi phí khấu trừ:</span>
                  <strong style={{ color: '#fbbf24' }}>{job.credits_charged} Credits</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Ngày khởi tạo:</span>
                  <strong style={{ color: '#cbd5e1' }}>
                    {job.created_at ? new Date(job.created_at).toLocaleString('vi-VN') : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {job.output_url && (
                <>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)',
                      background: 'rgba(56,189,248,0.1)', color: '#38bdf8', cursor: 'pointer',
                      fontWeight: 600, fontSize: '13px'
                    }}
                  >
                    {copiedLink ? <><HiOutlineCheck color="#34d399" /> Đã Copy Link CDN</> : <><HiOutlineLink size={16} /> Sao Chép Link CDN</>}
                  </button>

                  <a
                    href={job.output_url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '10px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '13px'
                    }}
                  >
                    <HiOutlineArrowDownTray size={16} /> Tải File Gốc Về Máy
                  </a>
                </>
              )}

              <button
                onClick={handleGoToPlayground}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                  background: '#1a2030', color: '#cbd5e1', cursor: 'pointer',
                  fontWeight: 500, fontSize: '13px'
                }}
              >
                <HiOutlineCommandLine size={16} /> Tạo Lại ở Playground
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
