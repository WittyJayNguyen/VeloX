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

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/users/me/usage-history')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setRecords(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load usage history:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = records.filter(r => filterModel === 'ALL' || r.model.toLowerCase().includes(filterModel.toLowerCase()));

  const totalCreditsUsed = records.reduce((acc, cur) => acc + (cur.creditsDeducted || 0), 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>⏱️</span>
            {t('client_menu.history', 'Lịch Sử Sử Dụng')}
          </h1>
          <p>{t('history.subtitle', 'Chi tiết các yêu cầu AI, số token xử lý và lượng Credit đã tiêu thụ')}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Yêu Cầu</div>
            <div className={styles.statValue}>{records.length} lượt</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Credit Đã Tiêu Dùng</div>
            <div className={styles.statValue}>{totalCreditsUsed} cr</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⚡</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Thời Gian Trung Bình</div>
            <div className={styles.statValue}>285 ms</div>
          </div>
        </div>
      </div>

      <div className={styles.contentCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 className={styles.cardTitle} style={{ margin: 0 }}>
            <HiOutlineClock /> Danh Sách Nhật Ký Yêu Cầu
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineMagnifyingGlass color="#94a3b8" />
            <select
              style={{ background: '#0e131e', border: '1px solid #1f283d', color: '#fff', padding: '6px 12px', borderRadius: '8px' }}
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
                <th>Tokens</th>
                <th>Credit Trừ</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
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
                      <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600 }}>
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
                            maxWidth: '320px',
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
                    <td>{item.tokensUsed ? item.tokensUsed.toLocaleString() : '—'}</td>
                    <td><strong style={{ color: '#ff6b35' }}>-{item.creditsDeducted} 💎</strong></td>
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
      </div>
    </div>
  );
};

export default HistoryPage;
