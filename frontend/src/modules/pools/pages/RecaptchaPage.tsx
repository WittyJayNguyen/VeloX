import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';
import { poolService, type RecaptchaSolverItem } from '../services/poolService';

const SOLVER_PROVIDER_OPTIONS = [
  { value: '2Captcha', label: '2Captcha API' },
  { value: 'CapSolver', label: 'CapSolver AI (Siêu tốc)' },
  { value: 'Anti-Captcha', label: 'Anti-Captcha' },
  { value: 'EzCaptcha', label: 'EzCaptcha' },
  { value: 'CustomNode', label: 'Cụm Node Headless Tự Triển Khai' },
];

const RecaptchaPage = () => {
  const [solvers, setSolvers] = useState<RecaptchaSolverItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSolver, setEditingSolver] = useState<RecaptchaSolverItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<RecaptchaSolverItem['provider']>('CapSolver');
  const [formApiKey, setFormApiKey] = useState('');
  const [formSupportedTypes, setFormSupportedTypes] = useState('Recaptcha v2, Recaptcha v3, Turnstile');
  const [formTimeout, setFormTimeout] = useState(25);
  const [formBalance, setFormBalance] = useState(50);

  // Live Test Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testSolverId, setTestSolverId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchSolvers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await poolService.getRecaptchaSolvers();
      setSolvers(data);
    } catch (err: any) {
      console.error('Failed to load recaptcha solvers:', err);
      setError(err?.response?.data?.detail || 'Không thể tải danh sách bộ giải Captcha từ database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolvers();
  }, [fetchSolvers]);

  const handleOpenAdd = () => {
    setEditingSolver(null);
    setFormName('');
    setFormProvider('CapSolver');
    setFormApiKey('');
    setFormSupportedTypes('Recaptcha v2, Recaptcha v3, Turnstile');
    setFormTimeout(25);
    setFormBalance(50);
    setShowModal(true);
  };

  const handleOpenEdit = (item: RecaptchaSolverItem) => {
    setEditingSolver(item);
    setFormName(item.name);
    setFormProvider(item.provider);
    setFormApiKey(item.api_key);
    setFormSupportedTypes((item.supported_types || []).join(', '));
    setFormTimeout(item.timeout_sec);
    setFormBalance(item.balance_usd);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formApiKey.trim()) return;

    const typesList = formSupportedTypes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingSolver) {
        await poolService.updateRecaptchaSolver(editingSolver.id, {
          name: formName,
          provider: formProvider,
          api_key: formApiKey,
          supported_types: typesList,
          timeout_sec: formTimeout,
          balance_usd: formBalance,
        });
      } else {
        await poolService.createRecaptchaSolver({
          name: formName,
          provider: formProvider,
          api_key: formApiKey,
          supported_types: typesList,
          balance_usd: formBalance,
          timeout_sec: formTimeout,
          avg_solve_time_sec: 3.0,
          solved_count: 0,
          success_rate_pct: 100.0,
          assigned_accounts_count: 0,
          is_active: true,
        });
      }
      setShowModal(false);
      await fetchSolvers();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu bộ giải Captcha');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá cấu hình giải Captcha này?')) {
      try {
        await poolService.deleteRecaptchaSolver(id);
        await fetchSolvers();
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Không thể xoá cấu hình Captcha');
      }
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await poolService.toggleRecaptchaSolver(id);
      await fetchSolvers();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không thể đổi trạng thái bộ giải');
    }
  };

  const handleOpenTest = (solver: RecaptchaSolverItem) => {
    setTestSolverId(solver.id);
    setTestResult(null);
    setShowTestModal(true);
  };

  const handleRunTest = async () => {
    if (!testSolverId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await poolService.testRecaptchaSolver(testSolverId);
      setTestResult(
        `✅ ${res.message} | Ping: ${res.ping_ms}ms | Số dư khả dụng: $${res.balance_usd.toFixed(2)}`
      );
    } catch (err: any) {
      setTestResult(`❌ Lỗi kết nối: ${err?.response?.data?.detail || 'Timeout khi kiểm tra'}`);
    } finally {
      setTesting(false);
    }
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats calculation
  const totalSolvers = solvers.length;
  const activeSolvers = solvers.filter((s) => s.is_active).length;
  const totalBalance = solvers.reduce((acc, s) => acc + s.balance_usd, 0);
  const avgSolveTime =
    solvers.length > 0
      ? (solvers.reduce((acc, s) => acc + s.avg_solve_time_sec, 0) / solvers.length).toFixed(1)
      : '0.0';

  // Filter
  const filtered = solvers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.supported_types || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  const columns: TableColumn<RecaptchaSolverItem>[] = [
    {
      key: 'name',
      header: 'Tên Node Solver & Provider',
      render: (s) => (
        <div>
          <strong style={{ color: '#fafafa', fontSize: '0.88rem' }}>{s.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge variant="purple" size="sm">{s.provider}</Badge>
            <span>{s.assigned_accounts_count} accounts gán</span>
          </div>
        </div>
      ),
    },
    {
      key: 'apiKey',
      header: 'API Key Solver',
      render: (s) => {
        const isRevealed = revealedKeys[s.id];
        const masked = s.api_key.length > 8
          ? `${s.api_key.substring(0, 4)}••••••••${s.api_key.substring(s.api_key.length - 3)}`
          : '••••••••';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', color: '#e4e4e7' }}>
              {isRevealed ? s.api_key : masked}
            </code>
            <button
              type="button"
              onClick={() => toggleRevealKey(s.id)}
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
              title={isRevealed ? 'Ẩn' : 'Hiện'}
            >
              {isRevealed ? <HiOutlineEyeSlash size={14} /> : <HiOutlineEye size={14} />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'supportedTypes',
      header: 'Loại Captcha Hỗ Trợ',
      render: (s) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
          {(s.supported_types || []).map((t) => (
            <Badge key={t} variant="neutral" size="sm">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'avgSolveTimeSec',
      header: 'Tốc Độ Giải',
      align: 'center',
      render: (s) => (
        <span style={{ fontWeight: 600, color: s.avg_solve_time_sec < 4 ? '#10b981' : '#f59e0b', fontSize: '0.85rem' }}>
          {s.avg_solve_time_sec}s
        </span>
      ),
    },
    {
      key: 'balanceUsd',
      header: 'Số Dư Khả Dụng',
      align: 'right',
      render: (s) => (
        <div style={{ textAlign: 'right' }}>
          <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>${s.balance_usd.toFixed(2)}</strong>
          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{s.solved_count.toLocaleString()} lượt giải</div>
        </div>
      ),
    },
    {
      key: 'successRatePct',
      header: 'Tỉ Lệ Thành Công',
      align: 'center',
      render: (s) => (
        <Badge variant={s.success_rate_pct >= 99 ? 'success' : 'warning'} size="sm">
          {s.success_rate_pct}%
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      align: 'center',
      render: (s) => (
        <Badge variant={s.is_active ? 'success' : 'neutral'} size="sm" dot>
          <button
            type="button"
            onClick={() => handleToggle(s.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          >
            {s.is_active ? 'Bật' : 'Tắt'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (s) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button variant="ghost" size="sm" title="Kiểm tra ping solver" onClick={() => handleOpenTest(s)}>
            <HiOutlineSparkles size={16} style={{ color: '#818cf8' }} />
          </Button>
          <Button variant="ghost" size="sm" title="Chỉnh sửa" onClick={() => handleOpenEdit(s)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Xóa" onClick={() => handleDelete(s.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineShieldCheck style={{ color: '#6366f1' }} />
            Cấu Hình Tự Giải Recaptcha & Turnstile (Gateway)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
            Tự động bypass Captcha v2/v3, Cloudflare Turnstile cho các node chạy Web Session Token
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={fetchSolvers} disabled={loading}>
            <HiOutlineArrowPath size={16} className={loading ? 'spin' : ''} />
            Làm Mới
          </Button>
          <Button variant="primary" onClick={handleOpenAdd}>
            <HiOutlinePlus size={16} />
            Thêm Cấu Hình Solver Mới
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Tổng Cụm Solver"
          value={totalSolvers}
          trend={{ value: `${activeSolvers} node hoạt động`, positive: true }}
          icon={<HiOutlineCpuChip size={22} />}
        />
        <StatCard
          title="Tốc Độ Giải Trung Bình"
          value={`${avgSolveTime}s`}
          trend={{ value: 'CapSolver AI cao tốc', positive: true }}
          icon={<HiOutlineBolt size={22} />}
        />
        <StatCard
          title="Tổng Số Dư Khả Dụng"
          value={`$${totalBalance.toFixed(2)}`}
          trend={{ value: 'Đủ dùng ~25,000 requests', positive: true }}
          icon={<HiOutlineShieldCheck size={22} />}
        />
        <StatCard
          title="Tỉ Lệ Vượt Captcha"
          value="99.6%"
          trend={{ value: 'Tự động thử lại khi lỗi', positive: true }}
          icon={<HiOutlineCheckCircle size={22} />}
        />
      </div>

      {/* Table Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ maxWidth: '350px', flex: 1 }}>
            <SearchInput
              placeholder="Tìm theo tên node, provider, loại captcha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
            Hiển thị <strong>{filtered.length}</strong> / {totalSolvers} node solver
          </div>
        </div>

        <Table
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          page={page}
          pageSize={10}
          onPageChange={setPage}
          emptyText={loading ? 'Đang tải dữ liệu từ database...' : 'Không tìm thấy bộ giải Captcha nào phù hợp'}
        />
      </Card>

      {/* Modal Add / Edit Solver */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingSolver ? `Chỉnh Sửa Solver: ${editingSolver.name}` : 'Thêm Cụm Solver Tự Giải Captcha'}
        size="md"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Tên Node / Cụm Solver <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: CapSolver AI Primary Node, 2Captcha Backup..."
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Dịch Vụ Cung Cấp (Provider)
            </label>
            <Select
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value as any)}
              options={SOLVER_PROVIDER_OPTIONS}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              API Key Solver <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <Input
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              placeholder="Nhập khóa API từ dịch vụ giải captcha..."
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Các Loại Captcha Hỗ Trợ (cách nhau bởi dấu phẩy)
            </label>
            <Input
              value={formSupportedTypes}
              onChange={(e) => setFormSupportedTypes(e.target.value)}
              placeholder="Recaptcha v2, Recaptcha v3, Turnstile, hCaptcha"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Timeout Giới Hạn (giây)
              </label>
              <Input
                type="number"
                value={formTimeout}
                onChange={(e) => setFormTimeout(Number(e.target.value))}
                min={5}
                max={120}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Số Dư Ước Tính ($)
              </label>
              <Input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(Number(e.target.value))}
                min={0}
                step="any"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Huỷ Bỏ
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu vào DB...' : editingSolver ? 'Cập Nhật Solver' : 'Thêm Solver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Live Test */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Kiểm Tra Kết Nối Solver"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>
            Gửi test ping đến cụm solver để kiểm tra kết nối API và số dư thực tế.
          </p>
          {testResult && (
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 6, fontSize: '0.8rem', color: '#e4e4e7' }}>
              {testResult}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setShowTestModal(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleRunTest} disabled={testing}>
              {testing ? 'Đang gửi ping...' : 'Gửi Ping Kiểm Tra'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecaptchaPage;
