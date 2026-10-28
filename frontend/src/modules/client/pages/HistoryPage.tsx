import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineClock, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import apiClient from '@modules/core/lib/apiClient';
import styles from '@assets/scss/client/client-pages.module.scss';

interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  taskType: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheTokens?: number;
  tokensUsed: number;
  creditsDeducted: number;
  status: 'SUCCESS' | 'RATE_LIMITED';
  prompt?: string;
}

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [filterModel, setFilterModel] = useState('ALL');
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true);
    apiClient
      .get('/users/me/usage-history', {
        params: { page: targetPage, page_size: targetPageSize },
      })
      .then((res) => {
        const raw = res.data?.data;
        if (Array.isArray(raw)) {
          setRecords(raw);
          setTotalRecords(raw.length);
          setTotalPages(Math.max(1, Math.ceil(raw.length / targetPageSize)));
        } else if (raw && raw.items) {
          setRecords(raw.items);
          setTotalRecords(raw.total || 0);
          setTotalPages(raw.total_pages || 1);
          setPage(raw.page || 1);
        }
      })
      .catch((err) => {
        console.error('Failed to load usage history:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory(1, pageSize);
  }, []);

  const filtered = records.filter(
    (r) =>
      filterModel === 'ALL' ||
      r.model.toLowerCase().includes(filterModel.toLowerCase()) ||
      r.taskType.toLowerCase().includes(filterModel.toLowerCase())
  );

  const totalCreditsUsed = records.reduce((acc, cur) => acc + (cur.creditsDeducted || 0), 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>⏱️</span>
            {t('client_menu.history', 'Lịch Sử Sử Dụng')}
          </h1>
          <p>{t('history.subtitle', 'Chi tiết các yêu cầu AI, số token Input/Output/Cache và lượng Credit đã tiêu thụ')}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Bản Ghi</div>
            <div className={styles.statValue}>{totalRecords || records.length} lượt</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Credit Trang Hiện Tại</div>
            <div className={styles.statValue}>{totalCreditsUsed} cr</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⚡</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Hạch Toán Token</div>
            <div className={styles.statValue}>100% Minh Bạch</div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className={styles.cardTitle} style={{ margin: 0 }}>
            <HiOutlineClock /> Danh Sách Nhật Ký Yêu Cầu & Hạch Toán Token
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineMagnifyingGlass color="#94a3b8" />
            <select
              style={{ background: '#0e131e', border: '1px solid #1f283d', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
            >
              <option value="ALL">Tất cả Mô hình & Tác vụ</option>
              <option value="codex">Codex / Code</option>
              <option value="gpt">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
              <option value="video">Video Generation</option>
              <option value="image">Image Generation</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Mã Yêu Cầu</th>
                <th>Thời Gian</th>
                <th>Mô Hình</th>
                <th>Tác Vụ & Chi Tiết</th>
                <th>Tokens (In / Out / Cache)</th>
                <th>Credit Trừ</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    Đang tải nhật ký sử dụng...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    Chưa có nhật ký sử dụng nào. Hãy bắt đầu trải nghiệm tại AI Studio hoặc qua API Gateway!
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td><code style={{ color: '#38bdf8' }}>{item.id}</code></td>
                    <td>{item.timestamp}</td>
                    <td>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600 }}>
                        {item.model}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#f1f5f9' }}>{item.taskType}</div>
                      {item.prompt && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#94a3b8',
                            marginTop: '2px',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.prompt}
                        >
                          {item.prompt}
                        </div>
                      )}
                    </td>
                    <td>
                      {(item.inputTokens || 0) > 0 || (item.outputTokens || 0) > 0 || item.tokensUsed > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span
                              style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                              title="Prompt / Input Tokens"
                            >
                              {(item.inputTokens || 0).toLocaleString()} in
                            </span>
                            <span
                              style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.12)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                              title="Completion / Output Tokens"
                            >
                              {(item.outputTokens || 0).toLocaleString()} out
                            </span>
                            {(item.cacheTokens || 0) > 0 && (
                              <span
                                style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}
                                title="Prompt Cache Read Tokens"
                              >
                                {(item.cacheTokens || 0).toLocaleString()} cache
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            Tổng: <strong>{(item.tokensUsed || (item.inputTokens || 0) + (item.outputTokens || 0)).toLocaleString()}</strong> tokens
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Media Request</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: '#ff6b35', fontSize: '0.95rem' }}>
                        -{item.creditsDeducted} 💎
                      </strong>
                    </td>
                    <td>
                      <span className={styles.badgeSuccess}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Hiển thị <strong>{records.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(page * pageSize, totalRecords)}</strong> trên tổng số <strong>{totalRecords}</strong> lượt dùng
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span>Dòng:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPage(1);
                  fetchHistory(1, newSize);
                }}
                style={{ background: '#0e131e', border: '1px solid #1f283d', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.82rem' }}
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  fetchHistory(p, pageSize);
                }}
                style={{
                  background: page <= 1 ? '#0b111e' : '#1e293b',
                  border: '1px solid #293548',
                  color: page <= 1 ? '#475569' : '#e2e8f0',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                ← Trước
              </button>

              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', padding: '0 8px' }}>
                Trang <strong>{page}</strong> / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const p = Math.min(totalPages, page + 1);
                  setPage(p);
                  fetchHistory(p, pageSize);
                }}
                style={{
                  background: page >= totalPages ? '#0b111e' : '#1e293b',
                  border: '1px solid #293548',
                  color: page >= totalPages ? '#475569' : '#e2e8f0',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Sau →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
