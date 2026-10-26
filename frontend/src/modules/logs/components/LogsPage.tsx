import { useState } from 'react';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineArrowDownTray,
  HiOutlineClock,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import styles from '@assets/scss/admin/common-admin.module.scss';

export interface ApiLogRecord {
  id: string;
  userEmail: string;
  endpoint: string;
  model: string;
  type: 'CHAT' | 'IMAGE' | 'VIDEO' | 'DEV_REQ';
  statusCode: number;
  durationMs: number;
  tokensConsumed: number;
  creditsDeducted: number;
  ipAddress: string;
  timestamp: string;
}

const initialLogs: ApiLogRecord[] = [
  {
    id: 'log_9011',
    userEmail: 'studio.vn@gmail.com',
    endpoint: '/v1/images/generations',
    model: 'midjourney-v6',
    type: 'IMAGE',
    statusCode: 200,
    durationMs: 2450,
    tokensConsumed: 1,
    creditsDeducted: 800,
    ipAddress: '113.161.42.18',
    timestamp: '2026-10-26 22:31:05',
  },
  {
    id: 'log_9010',
    userEmail: 'dev.anh@gmail.com',
    endpoint: '/v1/chat/completions',
    model: 'gpt-4o',
    type: 'CHAT',
    statusCode: 200,
    durationMs: 380,
    tokensConsumed: 480,
    creditsDeducted: 120,
    ipAddress: '14.169.88.22',
    timestamp: '2026-10-26 22:30:12',
  },
  {
    id: 'log_9009',
    userEmail: 'corporate@agency.com',
    endpoint: '/v1/video/generations',
    model: 'gen-3-alpha',
    type: 'VIDEO',
    statusCode: 200,
    durationMs: 14200,
    tokensConsumed: 1,
    creditsDeducted: 6000,
    ipAddress: '118.69.182.9',
    timestamp: '2026-10-26 22:28:44',
  },
  {
    id: 'log_9008',
    userEmail: 'dev.anh@gmail.com',
    endpoint: '/v1/dev/agent',
    model: 'claude-code-agent',
    type: 'DEV_REQ',
    statusCode: 200,
    durationMs: 1120,
    tokensConsumed: 1850,
    creditsDeducted: 1500,
    ipAddress: '14.169.88.22',
    timestamp: '2026-10-26 22:25:10',
  },
  {
    id: 'log_9007',
    userEmail: 'test.user@yahoo.com',
    endpoint: '/v1/chat/completions',
    model: 'claude-3-5-sonnet',
    type: 'CHAT',
    statusCode: 429,
    durationMs: 45,
    tokensConsumed: 0,
    creditsDeducted: 0,
    ipAddress: '27.72.100.4',
    timestamp: '2026-10-26 22:20:18',
  },
];

const LogsPage = () => {
  const [logs] = useState<ApiLogRecord[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Unique users list for filter
  const userOptions = Array.from(new Set(logs.map((l) => l.userEmail)));

  // Total summary calculations
  const totalTokens = logs.reduce((sum, l) => sum + l.tokensConsumed, 0);
  const totalCredits = logs.reduce((sum, l) => sum + l.creditsDeducted, 0);
  const avgLatency = Math.round(
    logs.reduce((sum, l) => sum + l.durationMs, 0) / (logs.length || 1)
  );

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = selectedUser === 'ALL' || log.userEmail === selectedUser;
    const matchesType = selectedType === 'ALL' || log.type === selectedType;
    return matchesSearch && matchesUser && matchesType;
  });

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `velox_gateway_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={styles.moduleContainer}>
      {/* 3 Summary Mini-KPIs for Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #27272a', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng Tokens Tiêu Thụ
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1', marginTop: 2 }}>
            {totalTokens.toLocaleString()} tok
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #27272a', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>
            Tổng Credits Đã Trừ
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
            {totalCredits.toLocaleString()} cr
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #27272a', borderRadius: 8, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase' }}>
            Độ Trễ Phản Hồi Trung Bình
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>
            {avgLatency} ms
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchFilterGroup}>
          <div className={styles.searchInput}>
            <HiOutlineMagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Tìm theo endpoint, model, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* User selector for viewing logs per user */}
          <select
            className={styles.selectFilter}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="ALL">Xem tất cả người dùng</option>
            {userOptions.map((u) => (
              <option key={u} value={u}>
                Lọc User: {u}
              </option>
            ))}
          </select>

          {/* Type selector (Chat, Image, Video, Dev Req) */}
          <select
            className={styles.selectFilter}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">Tất cả loại request</option>
            <option value="CHAT">Modal Chat</option>
            <option value="IMAGE">Modal Tạo Ảnh</option>
            <option value="VIDEO">Modal Tạo Video</option>
            <option value="DEV_REQ">Modal Req Dev</option>
          </select>
        </div>

        <div className={styles.actionButtonGroup}>
          <Button variant="secondary" size="md" onClick={handleExport}>
            <HiOutlineArrowDownTray size={16} /> Xuất File JSON
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderBar}>
          <div>
            <h3>Nhật Ký Yêu Cầu Gateway (Toàn Toán Thống Kê)</h3>
            <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
              Theo dõi chi tiết latency, số lượng token, credit trừ theo từng lượt gọi
            </span>
          </div>
          <span className={styles.countBadge}>{filteredLogs.length} Bản Ghi</span>
        </div>

        <table className={styles.velzonTable}>
          <thead>
            <tr>
              <th>ID & Thời Gian</th>
              <th>Khách Hàng (User)</th>
              <th>Endpoint & Model</th>
              <th>Phân Loại</th>
              <th>HTTP Code</th>
              <th>Độ Trễ</th>
              <th>Tokens Tiêu Thụ</th>
              <th>Credits Đã Trừ</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <strong style={{ color: '#6366f1', display: 'block' }}>{log.id}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{log.timestamp}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HiOutlineUser size={14} color="#71717a" />
                    <span>{log.userEmail}</span>
                  </div>
                </td>
                <td>
                  <div>
                    <code style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>
                      {log.endpoint}
                    </code>
                    <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{log.model}</div>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor:
                        log.type === 'CHAT'
                          ? 'rgba(99,102,241,0.12)'
                          : log.type === 'IMAGE'
                          ? 'rgba(16,185,129,0.12)'
                          : log.type === 'VIDEO'
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(139,92,246,0.12)',
                      color:
                        log.type === 'CHAT'
                          ? '#6366f1'
                          : log.type === 'IMAGE'
                          ? '#10b981'
                          : log.type === 'VIDEO'
                          ? '#f59e0b'
                          : '#8b5cf6',
                    }}
                  >
                    {log.type}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: log.statusCode === 200 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: log.statusCode === 200 ? '#10b981' : '#f43f5e',
                    }}
                  >
                    {log.statusCode}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.8rem' }}>
                    <HiOutlineClock size={13} color="#71717a" />
                    {log.durationMs}ms
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{log.tokensConsumed.toLocaleString()}</td>
                <td style={{ fontWeight: 700, color: log.creditsDeducted > 0 ? '#10b981' : '#71717a' }}>
                  {log.creditsDeducted > 0 ? `-${log.creditsDeducted.toLocaleString()} cr` : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsPage;
