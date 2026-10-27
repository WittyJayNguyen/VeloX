import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineArrowDownTray, HiOutlineClock, HiOutlineCpuChip,
  HiOutlineBanknotes, HiOutlineChartBar, HiOutlinePhoto,
  HiOutlineVideoCamera, HiOutlineLink, HiOutlineCheck, HiOutlineCloud,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Select } from '@modules/core/design-system/Select';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { SearchInput, StatCard } from '@modules/core/design-system/Components';
import apiClient from '@modules/core/lib/apiClient';

export interface ApiLogRecord {
  id: string; userEmail: string; endpoint: string; model: string;
  type: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ'; statusCode: number;
  durationMs: number; tokensConsumed: number; creditsDeducted: number;
  ipAddress: string; timestamp: string;
}

export interface MediaCdnRecord {
  id: string;
  user_id?: string;
  user_email?: string;
  model_id?: string;
  media_type: 'IMAGE' | 'VIDEO';
  prompt: string;
  output_url?: string;
  credits_charged: number;
  render_seconds?: number;
  created_at?: string;
}

const initialLogs: ApiLogRecord[] = [];

const typeBadge = (t: string) => t === 'CHAT' ? 'primary' : t === 'IMAGE' ? 'success' : t === 'VIDEO' ? 'warning' : 'info' as const;

const LogsPage = () => {
  const [activeTab, setActiveTab] = useState<'API_CALLS' | 'CDN_MEDIA'>('CDN_MEDIA');

  // API Call Logs state
  const [apiLogs, setApiLogs] = useState<ApiLogRecord[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);

  // CDN Media History state
  const [mediaLogs, setMediaLogs] = useState<MediaCdnRecord[]>([]);
  const [mediaTotal, setMediaTotal] = useState(0);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaUserFilter, setMediaUserFilter] = useState('ALL');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load real API transaction logs from backend
  const fetchApiLogs = useCallback(async () => {
    try {
      const res = await apiClient.get('/logs/api-calls', {
        params: { page: 1, page_size: 50 }
      });
      if (res.data?.items && res.data.items.length > 0) {
        const mapped: ApiLogRecord[] = res.data.items.map((it: any) => ({
          id: `log_${it.id.slice(0, 8)}`,
          userEmail: it.user_email || 'user@velox.ai',
          endpoint: '/v1/chat/completions',
          model: it.model_id || 'gateway-model',
          type: 'CHAT',
          statusCode: it.status_code || 200,
          durationMs: it.duration_ms || 150,
          tokensConsumed: (it.prompt_tokens || 0) + (it.completion_tokens || 0),
          creditsDeducted: it.total_credits_charged || 0,
          ipAddress: it.ip_address || '127.0.0.1',
          timestamp: it.created_at ? new Date(it.created_at).toLocaleString('vi-VN') : '',
        }));
        setApiLogs(mapped);
      } else {
        setApiLogs([]);
      }
    } catch {
      setApiLogs([]);
    }
  }, []);

  // Load real CDN Media Generation history for all users
  const fetchMediaLogs = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await apiClient.get('/logs/all-media', {
        params: {
          media_type: mediaTypeFilter === 'ALL' ? undefined : mediaTypeFilter,
          search: mediaSearch || undefined,
          user_id: mediaUserFilter === 'ALL' ? undefined : mediaUserFilter,
          page: mediaPage,
          page_size: 20,
        }
      });
      setMediaLogs(res.data?.items || []);
      setMediaTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch CDN media history:', err);
    } finally {
      setMediaLoading(false);
    }
  }, [mediaTypeFilter, mediaSearch, mediaUserFilter, mediaPage]);

  useEffect(() => {
    fetchApiLogs();
  }, [fetchApiLogs]);

  useEffect(() => {
    if (activeTab === 'CDN_MEDIA') {
      fetchMediaLogs();
    }
  }, [activeTab, fetchMediaLogs]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // API logs calculations
  const userOptions = [{ value: 'ALL', label: 'Tất cả người dùng' }, ...Array.from(new Set(apiLogs.map((l) => l.userEmail))).map((u) => ({ value: u, label: u }))];
  const typeOptions = [{ value: 'ALL', label: 'Tất cả loại' }, { value: 'CHAT', label: 'Chat' }, { value: 'IMAGE', label: 'Image' }, { value: 'VIDEO', label: 'Video' }, { value: 'DEV_REQ', label: 'Dev Req' }];

  const totalTokens = apiLogs.reduce((s, l) => s + l.tokensConsumed, 0);
  const totalCredits = apiLogs.reduce((s, l) => s + l.creditsDeducted, 0);
  const avgLatency = Math.round(apiLogs.reduce((s, l) => s + l.durationMs, 0) / (apiLogs.length || 1));

  const filteredApiLogs = apiLogs.filter((l) => {
    const matchSearch = l.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) || l.model.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm);
    return matchSearch && (selectedUser === 'ALL' || l.userEmail === selectedUser) && (selectedType === 'ALL' || l.type === selectedType);
  });

  const handleExport = () => {
    const dataToExport = activeTab === 'API_CALLS' ? filteredApiLogs : mediaLogs;
    const dl = document.createElement('a');
    dl.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    dl.download = `velox_${activeTab.toLowerCase()}_${Date.now()}.json`;
    document.body.appendChild(dl); dl.click(); dl.remove();
  };

  const apiColumns: TableColumn<ApiLogRecord>[] = [
    { key: 'id', header: 'ID & Thời Gian', render: (l) => (<div><strong style={{ color: '#6366f1' }}>{l.id}</strong><div style={{ fontSize: '0.7rem', color: '#71717a' }}>{l.timestamp}</div></div>) },
    { key: 'userEmail', header: 'User', render: (l) => <span style={{ fontSize: '0.8rem' }}>{l.userEmail}</span> },
    { key: 'endpoint', header: 'Endpoint & Model', render: (l) => (<div><code style={{ fontSize: '0.72rem', color: '#6366f1' }}>{l.endpoint}</code><div style={{ fontSize: '0.7rem', color: '#71717a' }}>{l.model}</div></div>) },
    { key: 'type', header: 'Loại', render: (l) => <Badge variant={typeBadge(l.type)} size="sm">{l.type}</Badge> },
    { key: 'statusCode', header: 'HTTP', align: 'center', render: (l) => <Badge variant={l.statusCode === 200 ? 'success' : 'danger'} size="sm">{l.statusCode}</Badge> },
    { key: 'durationMs', header: 'Độ Trễ', render: (l) => <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><HiOutlineClock size={13} color="#71717a" />{l.durationMs}ms</span> },
    { key: 'tokensConsumed', header: 'Tokens', align: 'right', render: (l) => <span style={{ fontWeight: 600 }}>{l.tokensConsumed.toLocaleString()}</span> },
    { key: 'creditsDeducted', header: 'Credits', align: 'right', render: (l) => <span style={{ fontWeight: 700, color: l.creditsDeducted > 0 ? '#10b981' : '#71717a' }}>{l.creditsDeducted > 0 ? `-${l.creditsDeducted.toLocaleString()} cr` : '0'}</span> },
  ];

  const mediaColumns: TableColumn<MediaCdnRecord>[] = [
    {
      key: 'preview',
      header: 'Tác Phẩm',
      render: (m) => (
        <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', background: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {m.media_type === 'VIDEO' ? (
            <video src={m.output_url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={m.output_url} alt={m.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      )
    },
    {
      key: 'info',
      header: 'Prompt & Model',
      render: (m) => (
        <div style={{ maxWidth: '320px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.prompt}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
            <span>Model: <strong style={{ color: '#94a3b8' }}>{m.model_id || 'Meta AI'}</strong></span>
            <span>•</span>
            <span>{m.created_at ? new Date(m.created_at).toLocaleString('vi-VN') : '—'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'user_email',
      header: 'Người Dùng (User)',
      render: (m) => (
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>{m.user_email || 'guest@velox.ai'}</span>
          <div style={{ fontSize: '10px', color: '#64748b' }}>ID: {m.user_id ? m.user_id.slice(0, 8) : 'anon'}</div>
        </div>
      )
    },
    {
      key: 'media_type',
      header: 'Định Dạng',
      align: 'center',
      render: (m) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
          background: m.media_type === 'VIDEO' ? 'rgba(168,85,247,0.2)' : 'rgba(16,185,129,0.2)',
          color: m.media_type === 'VIDEO' ? '#c084fc' : '#34d399'
        }}>
          {m.media_type === 'VIDEO' ? <HiOutlineVideoCamera size={13} /> : <HiOutlinePhoto size={13} />}
          {m.media_type}
        </span>
      )
    },
    {
      key: 'cdn_storage',
      header: 'Lưu Trữ CDN',
      render: (m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '6px', fontSize: '11px',
            background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 600
          }}>
            <HiOutlineCloud size={13} /> Zero-Disk CDN
          </span>
          {m.output_url && (
            <button
              onClick={() => handleCopyLink(m.output_url!)}
              title="Sao chép link CDN"
              style={{
                border: 'none', background: copiedUrl === m.output_url ? 'rgba(16,185,129,0.2)' : '#1e2433',
                color: copiedUrl === m.output_url ? '#34d399' : '#94a3b8',
                borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              {copiedUrl === m.output_url ? <HiOutlineCheck size={13} /> : <HiOutlineLink size={13} />}
            </button>
          )}
        </div>
      )
    },
    {
      key: 'credits_charged',
      header: 'Phí Credits',
      align: 'right',
      render: (m) => (
        <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px' }}>
          {m.credits_charged} cr
        </span>
      )
    },
    {
      key: 'render_seconds',
      header: 'Thời Gian Render',
      align: 'right',
      render: (m) => (
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {m.render_seconds ? `${m.render_seconds}s` : '—'}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Tab Switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', background: '#111520', padding: '16px 20px',
        borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HiOutlineCloud color="#38bdf8" /> Nhật Ký Vận Hành & CDN Gateway
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Lưu trữ tác phẩm độc lập cho từng user qua Cloud CDN (Zero-Disk) • Không dùng Cloudflare R2
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: '#090d16', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('CDN_MEDIA')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'CDN_MEDIA' ? '#6366f1' : 'transparent',
              color: activeTab === 'CDN_MEDIA' ? '#fff' : '#94a3b8',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <HiOutlinePhoto size={16} /> Lịch Sử Media & CDN Từng User ({mediaTotal})
          </button>
          <button
            onClick={() => setActiveTab('API_CALLS')}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: activeTab === 'API_CALLS' ? '#6366f1' : 'transparent',
              color: activeTab === 'API_CALLS' ? '#fff' : '#94a3b8',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <HiOutlineCpuChip size={16} /> Gateway API Calls (HTTP & Tokens)
          </button>
        </div>
      </div>

      {activeTab === 'CDN_MEDIA' ? (
        <>
          {/* CDN Media Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
            <StatCard label="Tổng File Trên CDN" value={`${mediaTotal} files`} color="#38bdf8" icon={<HiOutlineCloud size={22} />} />
            <StatCard label="Lưu Trữ Server Disk" value="0 MB (Zero-Disk)" color="#10b981" icon={<HiOutlineChartBar size={22} />} />
            <StatCard label="Băng Thông Egress R2" value="0đ (Không R2)" color="#a855f7" icon={<HiOutlineBanknotes size={22} />} />
          </div>

          {/* CDN Media Toolbar */}
          <Card padding="sm">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 280px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
                  <SearchInput
                    placeholder="Tìm theo prompt tác phẩm..."
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    onClear={() => setMediaSearch('')}
                  />
                </div>
                <div style={{ flex: '0 0 130px' }}>
                  <Select
                    options={[
                      { value: 'ALL', label: 'Tất cả loại' },
                      { value: 'IMAGE', label: 'Chỉ Ảnh' },
                      { value: 'VIDEO', label: 'Chỉ Video' },
                    ]}
                    value={mediaTypeFilter}
                    onChange={(e) => setMediaTypeFilter(e.target.value as any)}
                  />
                </div>
                <div style={{ flex: '0 0 160px' }}>
                  <Select
                    options={[
                      { value: 'ALL', label: 'Tất cả user' },
                      ...Array.from(new Set(mediaLogs.map((m) => m.user_email || 'guest@velox.ai'))).map((u) => ({ value: u, label: u }))
                    ]}
                    value={mediaUserFilter}
                    onChange={(e) => setMediaUserFilter(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="md" onClick={fetchMediaLogs} disabled={mediaLoading}>
                  <HiOutlineArrowPath size={16} /> {mediaLoading ? 'Đang tải...' : 'Làm Mới'}
                </Button>
                <Button variant="secondary" size="md" onClick={handleExport}>
                  <HiOutlineArrowDownTray size={16} /> Xuất JSON
                </Button>
              </div>
            </div>
          </Card>

          {/* CDN Media Table */}
          <Card title="Danh Sách Tác Phẩm Lưu Trữ CDN Cho Từng User" subtitle={`Tìm thấy ${mediaLogs.length} tác phẩm`} padding="none">
            <Table
              columns={mediaColumns}
              data={mediaLogs}
              rowKey={(m) => m.id}
              page={mediaPage}
              pageSize={20}
              onPageChange={setMediaPage}
            />
          </Card>
        </>
      ) : (
        <>
          {/* API Calls Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
            <StatCard label="Tổng Tokens Tiêu Thụ" value={`${totalTokens.toLocaleString()} tok`} color="#6366f1" icon={<HiOutlineCpuChip size={22} />} />
            <StatCard label="Tổng Credits Đã Trừ" value={`${totalCredits.toLocaleString()} cr`} color="#10b981" icon={<HiOutlineBanknotes size={22} />} />
            <StatCard label="Độ Trễ Trung Bình" value={`${avgLatency} ms`} color="#f59e0b" icon={<HiOutlineChartBar size={22} />} />
          </div>

          {/* API Calls Toolbar */}
          <Card padding="sm">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 260px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <SearchInput placeholder="Tìm endpoint, model, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onClear={() => setSearchTerm('')} />
                </div>
                <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
                  <Select options={userOptions} value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} />
                </div>
                <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
                  <Select options={typeOptions} value={selectedType} onChange={(e) => setSelectedType(e.target.value)} />
                </div>
              </div>
              <Button variant="secondary" size="md" onClick={handleExport}><HiOutlineArrowDownTray size={16} /> Xuất JSON</Button>
            </div>
          </Card>

          {/* API Calls Table */}
          <Card title="Nhật Ký Gateway API" subtitle={`${filteredApiLogs.length} bản ghi`} padding="none">
            <Table columns={apiColumns} data={filteredApiLogs} rowKey={(l) => l.id} page={page} pageSize={10} onPageChange={setPage} />
          </Card>
        </>
      )}
    </div>
  );
};

export default LogsPage;
