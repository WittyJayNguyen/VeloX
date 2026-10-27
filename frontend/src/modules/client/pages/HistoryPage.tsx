import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineClock, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

interface UsageRecord {
  id: string;
  timestamp: string;
  model: string;
  taskType: string;
  tokensUsed: number;
  creditsDeducted: number;
  status: 'SUCCESS' | 'RATE_LIMITED';
}

const SAMPLE_USAGE: UsageRecord[] = [
  { id: 'req_881', timestamp: '2026-10-27 22:45', model: 'gpt-4o', taskType: 'Chat Completion', tokensUsed: 1450, creditsDeducted: 15, status: 'SUCCESS' },
  { id: 'req_880', timestamp: '2026-10-27 21:12', model: 'claude-3-5-sonnet', taskType: 'Code Generation', tokensUsed: 3200, creditsDeducted: 32, status: 'SUCCESS' },
  { id: 'req_879', timestamp: '2026-10-27 18:30', model: 'midjourney-v6', taskType: 'Image Generation', tokensUsed: 0, creditsDeducted: 45, status: 'SUCCESS' },
  { id: 'req_878', timestamp: '2026-10-27 15:04', model: 'gemini-1.5-pro', taskType: 'Fitness Plan Analysis', tokensUsed: 2100, creditsDeducted: 18, status: 'SUCCESS' },
  { id: 'req_877', timestamp: '2026-10-26 19:22', model: 'gpt-4o-mini', taskType: 'Translation', tokensUsed: 800, creditsDeducted: 5, status: 'SUCCESS' },
  { id: 'req_876', timestamp: '2026-10-26 14:10', model: 'runway-gen3', taskType: 'Video Generation', tokensUsed: 0, creditsDeducted: 80, status: 'SUCCESS' },
];

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [filterModel, setFilterModel] = useState('ALL');
  const [records] = useState<UsageRecord[]>(SAMPLE_USAGE);

  const filtered = records.filter(r => filterModel === 'ALL' || r.model.includes(filterModel));

  const totalCreditsUsed = records.reduce((acc, cur) => acc + cur.creditsDeducted, 0);

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
              <option value="ALL">Tất cả Mô hình</option>
              <option value="gpt">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
              <option value="midjourney">Midjourney</option>
              <option value="gemini">Google Gemini</option>
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
                <th>Tác Vụ</th>
                <th>Tokens</th>
                <th>Credit Trừ</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><code style={{ color: '#38bdf8' }}>{item.id}</code></td>
                  <td>{item.timestamp}</td>
                  <td><strong>{item.model}</strong></td>
                  <td>{item.taskType}</td>
                  <td>{item.tokensUsed ? item.tokensUsed.toLocaleString() : 'N/A'}</td>
                  <td><strong style={{ color: '#ff6b35' }}>-{item.creditsDeducted} 💎</strong></td>
                  <td>
                    <span className={styles.badgeSuccess}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
