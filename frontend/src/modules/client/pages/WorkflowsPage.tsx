import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlinePlus,
  HiOutlinePlay,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineDocumentDuplicate,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import styles from '@assets/scss/client/client-pages.module.scss';

interface Workflow {
  id: string;
  name: string;
  category: string;
  costCredit: number;
  runs: number;
  description: string;
  lastRun: string;
  promptTemplate?: string;
  isCustom?: boolean;
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_1',
    name: 'Tạo Kịch Bản Video TikTok/Reels Viral 60s',
    category: 'Video & Marketing',
    costCredit: 15,
    runs: 242,
    description: 'Tự động phân tích xu hướng, sinh kịch bản 3 cảnh (Hook - Story - CTA) tối ưu tỉ lệ xem hết video.',
    lastRun: 'Hôm nay 10:20',
    promptTemplate: 'Hãy tạo kịch bản 60 giây dạng Shorts/TikTok về chủ đề: {input}. Bao gồm: Hook gây sốc 3 giây đầu, 3 luận điểm chính cuốn hút, và Call-to-Action kêu gọi bình luận.',
  },
  {
    id: 'wf_2',
    name: 'Bài Viết Chuẩn SEO Top Google & Tóm Tắt Tin Tức',
    category: 'Content & SEO',
    costCredit: 10,
    runs: 189,
    description: 'Nghiên cứu từ khóa LSI, tạo outline bài viết chuyên sâu 1,500 từ chuẩn cấu trúc Schema & Meta description.',
    lastRun: 'Hôm qua 18:45',
    promptTemplate: 'Viết bài viết chuẩn SEO chuyên sâu 1,500 từ về từ khóa/chủ đề: {input}. Gồm cấu trúc Heading H1, H2, H3, FAQ Schema và meta description tối ưu CTR.',
  },
  {
    id: 'wf_3',
    name: 'Trích Xuất Dữ Liệu & Tóm Tắt Tài Liệu Báo Cáo',
    category: 'Research & Data',
    costCredit: 12,
    runs: 135,
    description: 'Phân tích nhanh tài liệu, trích xuất 5 luận điểm chính, bảng biểu thống kê và các rủi ro cần lưu ý.',
    lastRun: '2 ngày trước',
    promptTemplate: 'Phân tích tài liệu sau và trích xuất thành 5 gạch đầu dòng then chốt, bảng số liệu định lượng và khuyến nghị hành động: {input}',
  },
  {
    id: 'wf_4',
    name: 'Chuyển Đổi Kịch Bản Thành Giọng Lồng Tiếng AI (TTS)',
    category: 'Audio & Voice',
    costCredit: 20,
    runs: 98,
    description: 'Làm mượt ngữ điệu văn bản tiếng Việt, chèn nhịp ngắt nghỉ tự nhiên và chuẩn bị audio stream chất lượng cao.',
    lastRun: 'Tuần trước',
    promptTemplate: 'Chuẩn hóa văn bản sau sang kịch bản lồng tiếng chuyên nghiệp có đánh dấu nhịp ngắt ([pause 0.5s], [nhấn mạnh]): {input}',
  },
];

export const WorkflowsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, syncProfile } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Content & Marketing');
  const [newCost, setNewCost] = useState(15);
  const [newDesc, setNewDesc] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  // Runner Modal
  const [runningWf, setRunningWf] = useState<Workflow | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [copiedRes, setCopiedRes] = useState(false);

  const storageKey = 'velox_custom_workflows';

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const custom: Workflow[] = JSON.parse(saved);
        setWorkflows([...DEFAULT_WORKFLOWS, ...custom]);
        return;
      } catch {
        // Fallback
      }
    }
    setWorkflows(DEFAULT_WORKFLOWS);
  }, []);

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newWf: Workflow = {
      id: `wf_custom_${Date.now()}`,
      name: newName.trim(),
      category: newCat,
      costCredit: Number(newCost) || 10,
      runs: 0,
      description: newDesc.trim() || 'Workflow tự động hóa tùy chỉnh người dùng',
      lastRun: 'Chưa chạy',
      promptTemplate: newPrompt.trim() || 'Xử lý yêu cầu: {input}',
      isCustom: true,
    };

    const customSaved = localStorage.getItem(storageKey);
    const existing: Workflow[] = customSaved ? JSON.parse(customSaved) : [];
    const updatedCustom = [newWf, ...existing];
    localStorage.setItem(storageKey, JSON.stringify(updatedCustom));

    setWorkflows([...DEFAULT_WORKFLOWS, ...updatedCustom]);
    setIsCreateOpen(false);
    setNewName('');
    setNewDesc('');
    setNewPrompt('');
    setToast('Đã tạo Workflow mới thành công!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteCustom = (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa workflow "${name}"?`)) return;
    const customSaved = localStorage.getItem(storageKey);
    if (customSaved) {
      const existing: Workflow[] = JSON.parse(customSaved);
      const updated = existing.filter((w) => w.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    setToast(`Đã xóa workflow "${name}".`);
    setTimeout(() => setToast(null), 3000);
  };

  const openRunner = (wf: Workflow) => {
    setRunningWf(wf);
    setInputVal('');
    setExecutionResult(null);
  };

  const handleExecute = async () => {
    if (!runningWf) return;
    if (!inputVal.trim()) {
      alert('Vui lòng nhập chủ đề hoặc dữ liệu đầu vào cho quy trình!');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    // Simulate AI pipeline generation
    setTimeout(() => {
      let outputText = '';
      if (runningWf.category.includes('Video')) {
        outputText = `🎬 [KỊCH BẢN TIKTOK/REELS VIRAL 60S]\n\nChủ đề: ${inputVal}\n\n⏱️ [00:00 - 00:05] HOOK GÂY BÃO:\n"Đừng bao giờ làm điều này nếu bạn không muốn hối hận vào năm 2026..." (Hiệu ứng zoom cận mặt, âm thanh 'whoosh')\n\n⏱️ [00:05 - 00:35] NỘI DUNG CHÍNH (THE VALUE):\n- Luận điểm 1: Sai lầm phổ biến nhất mà 90% mọi người gặp phải với ${inputVal}.\n- Luận điểm 2: Bí kíp tối ưu hóa từ chuyên gia VeloX giúp tiết kiệm 80% thời gian.\n- Luận điểm 3: Case study thực tế đạt hiệu quả gấp 3 lần ngay trong tuần đầu tiên.\n\n⏱️ [00:35 - 00:50] BÍ QUYẾT BẤT NGỜ:\n"Và điều quan trọng nhất: Hãy áp dụng ngay nguyên tắc 2 phút mỗi ngày!"\n\n⏱️ [00:50 - 00:60] CALL TO ACTION:\n"Bạn đã thử cách này chưa? Thả bình luận bên dưới để nhận tài liệu chi tiết từ mình nhé! Like & Follow kênh!"`;
      } else if (runningWf.category.includes('SEO')) {
        outputText = `📝 [BÀI VIẾT CHUẨN SEO TOP GOOGLE]\n\nTiêu đề H1: Hướng Dẫn Toàn Diện Về ${inputVal} Mới Nhất 2026\nMeta Description: Khám phá phương pháp ${inputVal} tối ưu nhất giúp nâng cao hiệu suất vượt trội. Cập nhật chi tiết quy trình từng bước từ chuyên gia.\n\n## 1. Giới thiệu tổng quan về ${inputVal}\nTrong bối cảnh công nghệ phát triển mạnh mẽ...\n\n## 2. Lợi ích then chốt không thể bỏ qua\n- Tăng tốc độ thực thi\n- Tiết kiệm chi phí vận hành\n- Đảm bảo tính ổn định và bảo mật cao\n\n## 3. Các bước triển khai thực tế\nBước 1: Khởi tạo và thiết lập môi trường chuẩn\nBước 2: Kết nối API và tích hợp hệ thống\nBước 3: Tối ưu hóa hiệu năng và kiểm thử\n\n## 4. FAQ - Câu hỏi thường gặp\n- Q: Chi phí triển khai là bao nhiêu?\n- A: Tùy thuộc vào quy mô, bạn có thể bắt đầu hoàn toàn miễn phí với VeloX AI.`;
      } else {
        outputText = `⚡ [KẾT QUẢ XỬ LÝ QUY TRÌNH PIPELINE AI]\n\nQuy trình: ${runningWf.name}\nĐầu vào: "${inputVal}"\n\nĐã phân tích và trích xuất thành công 5 điểm cốt lõi:\n1. Phân tích ngữ cảnh đầu vào: Đã định tuyến qua Model Context Protocol.\n2. Xử lý ngữ nghĩa chuyên sâu: Đảm bảo độ chính xác dữ liệu.\n3. Khuyến nghị hành động: Ứng dụng ngay vào dự án thực tế.\n\nChi phí thực thi: -${runningWf.costCredit} credits VeloX.\nThời gian phản hồi: 850ms.`;
      }

      setExecutionResult(outputText);
      setIsExecuting(false);

      // Update runs count
      setWorkflows((prev) =>
        prev.map((item) =>
          item.id === runningWf.id ? { ...item, runs: item.runs + 1, lastRun: 'Vừa xong' } : item
        )
      );

      // Trigger profile refresh to reflect credit usage if any
      syncProfile();
    }, 1400);
  };

  const copyResult = () => {
    if (!executionResult) return;
    navigator.clipboard.writeText(executionResult);
    setCopiedRes(true);
    setTimeout(() => setCopiedRes(false), 2000);
  };

  const totalRuns = workflows.reduce((acc, cur) => acc + cur.runs, 0);

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
          <button type="button" className={styles.primaryBtn} onClick={() => setIsCreateOpen(true)}>
            <HiOutlinePlus /> {t('workflows.create_new', 'Tạo Workflow Mới')}
          </button>
        </div>
      </div>

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
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
            <div className={styles.statValue}>{totalRuns.toLocaleString()} lần</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Số Dư Hiện Tại</div>
            <div className={styles.statValue}>{user?.credit_balance?.toLocaleString() ?? 0} cr</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: '#ff6b35', fontWeight: 700 }}>
                    💎 {wf.costCredit} cr/lần
                  </span>
                  {wf.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(wf.id, wf.name)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      title="Xóa workflow này"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
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
                onClick={() => openRunner(wf)}
              >
                <HiOutlinePlay /> Chạy Workflow Ngay
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Runner Modal */}
      {runningWf && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              maxWidth: '650px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>{runningWf.category}</span>
                <h3 style={{ margin: '4px 0 0', color: '#fff', fontSize: '1.25rem' }}>{runningWf.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRunningWf(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '0 0 1.25rem' }}>
              {runningWf.description}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Nhập chủ đề hoặc nội dung cần xử lý *
              </label>
              <textarea
                rows={3}
                required
                placeholder="vd: Chiến lược ra mắt ứng dụng AI tại thị trường Đông Nam Á..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#fff',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                <span>Định dạng: Pipeline AI tự động</span>
                <span style={{ color: '#ff6b35', fontWeight: 600 }}>Chi phí: 💎 {runningWf.costCredit} credits</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: executionResult ? '1.5rem' : '0' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setRunningWf(null)}
                disabled={isExecuting}
              >
                Đóng
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleExecute}
                disabled={isExecuting || !inputVal.trim()}
              >
                {isExecuting ? (
                  <>Đang thực thi pipeline AI...</>
                ) : (
                  <>
                    <HiOutlineSparkles /> Bắt Đầu Chạy (Trừ {runningWf.costCredit} cr)
                  </>
                )}
              </button>
            </div>

            {/* Result Box */}
            {executionResult && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineCheckCircle /> Kết Quả Sinh Thành Công:
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={copyResult}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    <HiOutlineDocumentDuplicate /> {copiedRes ? 'Đã Chép' : 'Sao Chép Kết Quả'}
                  </button>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {executionResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Workflow Modal */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Tạo Workflow Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Tên Workflow *
                </label>
                <input
                  type="text"
                  required
                  placeholder="vd: Tự Động Phân Tích Báo Cáo Tài Chính"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                    Phân loại danh mục
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#fff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="Content & Marketing">Content & Marketing</option>
                    <option value="Video & Reels">Video & Reels</option>
                    <option value="Data & Analytics">Data & Analytics</option>
                    <option value="Audio & Voice AI">Audio & Voice AI</option>
                    <option value="Automation & Code">Automation & Code</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                    Chi phí Credit/lần
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#fff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Mô tả tác vụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt những gì quy trình này sẽ thực hiện..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Prompt Template (sử dụng <code>{'{input}'}</code> làm placeholder)
                </label>
                <textarea
                  rows={3}
                  placeholder="Hãy phân tích chuyên sâu về {input} và đưa ra kết quả chi tiết..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={!newName.trim()}
                >
                  Lưu & Khởi Tạo Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsPage;
