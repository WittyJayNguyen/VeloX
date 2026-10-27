import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlinePlay, HiOutlineCheckCircle } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

interface Workflow {
  id: string;
  name: string;
  category: string;
  costCredit: number;
  runs: number;
  description: string;
  lastRun: string;
}

const INITIAL_WORKFLOWS: Workflow[] = [
  { id: 'wf_1', name: 'Lập Kế Hoạch Tập Gym Cá Nhân Hóa (PulseFit)', category: 'Fitness & Health', costCredit: 12, runs: 142, description: 'Phân tích chỉ số BMI, mục tiêu tăng cơ giảm mỡ để sinh lịch tập 7 ngày chi tiết', lastRun: 'Hôm nay 10:20' },
  { id: 'wf_2', name: 'Macro Meal Planner & Calorie Tracking', category: 'Nutrition', costCredit: 8, runs: 89, description: 'Tính toán định lượng protein, carb, fat theo từng bữa ăn chuẩn khoa học', lastRun: 'Hôm qua 18:45' },
  { id: 'wf_3', name: 'Tạo Kịch Bản Video Fitness Short/Reels', category: 'Marketing', costCredit: 15, runs: 215, description: 'Viết prompt & kịch bản 30s viral thu hút học viên cho phòng tập', lastRun: '3 ngày trước' },
  { id: 'wf_4', name: 'AI Voice Trainer Hướng Dẫn Kỹ Thuật Động Tác', category: 'Audio AI', costCredit: 20, runs: 64, description: 'Chuyển văn bản bài tập thành giọng đọc cổ vũ huấn luyện viên chuyên nghiệp', lastRun: 'Tuần trước' },
];

export const WorkflowsPage: React.FC = () => {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const handleRun = (wf: Workflow) => {
    setRunningId(wf.id);
    setTimeout(() => {
      setWorkflows((prev) =>
        prev.map((item) => (item.id === wf.id ? { ...item, runs: item.runs + 1, lastRun: 'Vừa xong' } : item))
      );
      setRunningId(null);
      setRunMsg(`Đã thực thi thành công workflow "${wf.name}"! Trừ ${wf.costCredit} credit.`);
      setTimeout(() => setRunMsg(null), 3000);
    }, 1500);
  };

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>⚡</span>
            {t('client_menu.workflows', 'Workflow Của Tôi')}
          </h1>
          <p>{t('workflows.subtitle', 'Tự động hóa các tác vụ AI phức tạp với chuỗi quy trình (AI Pipeline) đa bước')}</p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryBtn} onClick={() => alert('Chức năng thiết kế kéo thả Workflow Canvas sẽ sớm ra mắt!')}>
            <HiOutlinePlus /> {t('workflows.create_new', 'Tạo Workflow Mới')}
          </button>
        </div>
      </div>

      {runMsg && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{runMsg}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⚡</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Workflow</div>
            <div className={styles.statValue}>{workflows.length} quy trình</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>🚀</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Lượt Đã Thực Thi</div>
            <div className={styles.statValue}>510 lần</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {workflows.map((wf) => (
          <div key={wf.id} className={styles.contentCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {wf.category}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#ff6b35', fontWeight: 700 }}>
                  💎 {wf.costCredit} cr/lần
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
                {wf.name}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                {wf.description}
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', paddingBottom: '0.75rem', borderBottom: '1px solid #1a2234', marginBottom: '1rem' }}>
                <span>Đã chạy: <strong>{wf.runs} lần</strong></span>
                <span>Lần cuối: {wf.lastRun}</span>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleRun(wf)}
                disabled={runningId === wf.id}
              >
                {runningId === wf.id ? (
                  <span>Đang xử lý pipeline AI...</span>
                ) : (
                  <>
                    <HiOutlinePlay /> Chạy Workflow Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowsPage;
