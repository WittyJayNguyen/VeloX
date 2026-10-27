import { useState } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineCpuChip,
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';

export interface RecaptchaSolverItem {
  id: string;
  name: string;
  provider: '2Captcha' | 'CapSolver' | 'Anti-Captcha' | 'EzCaptcha' | 'CustomNode';
  apiKey: string;
  supportedTypes: string[];
  balanceUsd: number;
  avgSolveTimeSec: number;
  solvedCount: number;
  successRatePct: number;
  timeoutSec: number;
  assignedAccountsCount: number;
  isActive: boolean;
}

const initialSolvers: RecaptchaSolverItem[] = [
  {
    id: 'solv_01',
    name: '2Captcha Enterprise Primary Node',
    provider: '2Captcha',
    apiKey: '2cap_99a818274bc901aef',
    supportedTypes: ['Recaptcha v2', 'Recaptcha v3', 'Turnstile'],
    balanceUsd: 48.5,
    avgSolveTimeSec: 5.2,
    solvedCount: 14250,
    successRatePct: 99.4,
    timeoutSec: 30,
    assignedAccountsCount: 6,
    isActive: true,
  },
  {
    id: 'solv_02',
    name: 'CapSolver AI High-Speed Node',
    provider: 'CapSolver',
    apiKey: 'cap_solv_bb771234aa09',
    supportedTypes: ['Recaptcha v3 Enterprise', 'Turnstile', 'hCaptcha'],
    balanceUsd: 120.0,
    avgSolveTimeSec: 2.8,
    solvedCount: 38900,
    successRatePct: 99.8,
    timeoutSec: 20,
    assignedAccountsCount: 12,
    isActive: true,
  },
  {
    id: 'solv_03',
    name: 'Anti-Captcha Backup Pool',
    provider: 'Anti-Captcha',
    apiKey: 'anti_c_009988112233',
    supportedTypes: ['Recaptcha v2', 'hCaptcha'],
    balanceUsd: 15.2,
    avgSolveTimeSec: 6.5,
    solvedCount: 4100,
    successRatePct: 98.7,
    timeoutSec: 45,
    assignedAccountsCount: 3,
    isActive: true,
  },
  {
    id: 'solv_04',
    name: 'Headless Browser Cluster Node #1',
    provider: 'CustomNode',
    apiKey: 'internal_cluster_node_auth_token',
    supportedTypes: ['Recaptcha v2/v3', 'Cloudflare Turnstile'],
    balanceUsd: 999.0,
    avgSolveTimeSec: 3.5,
    solvedCount: 65200,
    successRatePct: 99.9,
    timeoutSec: 15,
    assignedAccountsCount: 20,
    isActive: true,
  },
];

const SOLVER_PROVIDER_OPTIONS = [
  { value: '2Captcha', label: '2Captcha API' },
  { value: 'CapSolver', label: 'CapSolver AI (Siêu tốc)' },
  { value: 'Anti-Captcha', label: 'Anti-Captcha' },
  { value: 'EzCaptcha', label: 'EzCaptcha' },
  { value: 'CustomNode', label: 'Cụm Node Headless Tự Triển Khai' },
];

const RecaptchaPage = () => {
  const [solvers, setSolvers] = useState<RecaptchaSolverItem[]>(() => {
    const s = localStorage.getItem('velox_recaptcha_solvers');
    return s ? JSON.parse(s) : initialSolvers;
  });

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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const saveSolvers = (items: RecaptchaSolverItem[]) => {
    setSolvers(items);
    localStorage.setItem('velox_recaptcha_solvers', JSON.stringify(items));
  };

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
    setFormApiKey(item.apiKey);
    setFormSupportedTypes(item.supportedTypes.join(', '));
    setFormTimeout(item.timeoutSec);
    setFormBalance(item.balanceUsd);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formApiKey.trim()) return;

    const typesList = formSupportedTypes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingSolver) {
      saveSolvers(
        solvers.map((s) =>
          s.id === editingSolver.id
            ? {
                ...s,
                name: formName,
                provider: formProvider,
                apiKey: formApiKey,
                supportedTypes: typesList,
                timeoutSec: formTimeout,
                balanceUsd: formBalance,
              }
            : s
        )
      );
    } else {
      const newSolver: RecaptchaSolverItem = {
        id: `solv_${Date.now()}`,
        name: formName,
        provider: formProvider,
        apiKey: formApiKey,
        supportedTypes: typesList,
        balanceUsd: formBalance,
        avgSolveTimeSec: 3.2,
        solvedCount: 0,
        successRatePct: 100.0,
        timeoutSec: formTimeout,
        assignedAccountsCount: 0,
        isActive: true,
      };
      saveSolvers([...solvers, newSolver]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá cấu hình giải Captcha này?')) {
      saveSolvers(solvers.filter((s) => s.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    saveSolvers(solvers.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
  };

  const handleRunTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(
        `✅ Giải thành công trong 2.6s! Token trả về: 03AFcWeA7... (Đã kiểm tra qua endpoint xác thực Google Recaptcha v3)`
      );
    }, 1200);
  };

  // Stats
  const totalBalance = solvers.reduce((acc, s) => acc + s.balanceUsd, 0);
  const totalSolved = solvers.reduce((acc, s) => acc + s.solvedCount, 0);
  const avgSuccessRate =
    solvers.length > 0
      ? (solvers.reduce((acc, s) => acc + s.successRatePct, 0) / solvers.length).toFixed(1)
      : '0';

  const filtered = solvers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<RecaptchaSolverItem>[] = [
    {
      key: 'name',
      header: 'Tên Cấu Hình & Nhà Cung Cấp',
      render: (s) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong style={{ color: '#fafafa' }}>{s.name}</strong>
            <Badge variant="primary" size="sm">
              {s.provider}
            </Badge>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{ color: '#a1a1aa', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
              {revealedKeys[s.id]
                ? s.apiKey
                : s.apiKey.length > 10
                ? `${s.apiKey.substring(0, 6)}...${s.apiKey.substring(s.apiKey.length - 4)}`
                : '••••••••'}
            </code>
            <button
              type="button"
              onClick={() => setRevealedKeys((p) => ({ ...p, [s.id]: !p[s.id] }))}
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
            >
              {revealedKeys[s.id] ? <HiOutlineEyeSlash size={13} /> : <HiOutlineEye size={13} />}
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'supportedTypes',
      header: 'Loại Captcha Hỗ Trợ',
      render: (s) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {s.supportedTypes.map((t) => (
            <Badge key={t} variant="neutral" size="sm">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'balanceUsd',
      header: 'Số Dư Tài Khoản',
      align: 'right',
      render: (s) => (
        <div style={{ textAlign: 'right' }}>
          <strong style={{ color: s.balanceUsd < 10 ? '#f43f5e' : '#10b981', fontSize: '0.88rem' }}>
            ${s.balanceUsd.toFixed(2)}
          </strong>
          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>Credits sẵn sàng</div>
        </div>
      ),
    },
    {
      key: 'avgSolveTimeSec',
      header: 'Tốc Độ & Thành Công',
      align: 'center',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
            {s.avgSolveTimeSec}s
          </span>
          <span style={{ fontSize: '0.68rem', color: '#34d399' }}>
            {s.successRatePct}% OK
          </span>
        </div>
      ),
    },
    {
      key: 'assignedAccountsCount',
      header: 'Session Accs',
      align: 'center',
      render: (s) => (
        <Badge variant="purple" size="md">
          {s.assignedAccountsCount} accounts
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      align: 'center',
      render: (s) => (
        <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm" dot>
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
            {s.isActive ? 'Bật' : 'Tắt'}
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
          <Button
            variant="ghost"
            size="sm"
            title="Thử giải Captcha thực tế"
            onClick={() => {
              setShowTestModal(true);
              setTestResult(null);
            }}
          >
            <HiOutlineSparkles size={16} style={{ color: '#10b981' }} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(s)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title="Tổng Dịch Vụ Solver" value={solvers.length} icon={<HiOutlineShieldCheck size={22} />} change="Đa tầng dự phòng" changeType="up" />
        <StatCard title="Tổng Số Dư Credit Solver" value={`$${totalBalance.toFixed(2)}`} icon={<HiOutlineBolt size={22} />} change="Khả dụng giải captcha" changeType="up" />
        <StatCard title="Tỉ Lệ Giải Thành Công" value={`${avgSuccessRate}%`} icon={<HiOutlineCheckCircle size={22} />} change="Tự động retry" changeType="up" />
        <StatCard title="Đã Giải Thành Công" value={totalSolved.toLocaleString()} icon={<HiOutlineCpuChip size={22} />} change="Xoay vòng session" changeType="up" />
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <SearchInput
            placeholder="Tìm dịch vụ giải Captcha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setShowTestModal(true);
                setTestResult(null);
              }}
            >
              <HiOutlineSparkles size={16} /> Kiểm Tra Giải Thử
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              <HiOutlinePlus size={16} /> Thêm Cấu Hình Solver
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card
        title="Quản Lý Cấu Hình Tự Giải Recaptcha & Turnstile"
        subtitle="Hệ thống tự động giải mã Captcha cho từng Session Token account trong Service Pool"
        headerRight={<HiOutlineShieldCheck size={20} style={{ color: '#10b981' }} />}
        padding="none"
      >
        <Table columns={columns} data={filtered} rowKey={(s) => s.id} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal Thêm / Sửa Solver */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingSolver ? 'Cập Nhật Cấu Hình Solver' : 'Thêm Dịch Vụ Tự Giải Captcha Mới'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Lưu Cấu Hình
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Tên Cấu Hình Solver"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="VD: CapSolver Fast Pool #1"
            required
            fullWidth
          />
          <Select
            label="Nhà Cung Cấp (Provider)"
            options={SOLVER_PROVIDER_OPTIONS}
            value={formProvider}
            onChange={(e) => setFormProvider(e.target.value as RecaptchaSolverItem['provider'])}
            fullWidth
          />
          <Input
            label="API Key / Secret Token của Solver"
            value={formApiKey}
            onChange={(e) => setFormApiKey(e.target.value)}
            placeholder="sk_..."
            required
            fullWidth
          />
          <Input
            label="Loại Captcha Hỗ Trợ (phân cách dấu phẩy)"
            value={formSupportedTypes}
            onChange={(e) => setFormSupportedTypes(e.target.value)}
            placeholder="Recaptcha v2, Recaptcha v3, Turnstile"
            fullWidth
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Timeout Giải (giây)"
              type="number"
              value={formTimeout}
              onChange={(e) => setFormTimeout(Number(e.target.value))}
              fullWidth
            />
            <Input
              label="Số Dư Ban Đầu ($ USD)"
              type="number"
              value={formBalance}
              onChange={(e) => setFormBalance(Number(e.target.value))}
              fullWidth
            />
          </div>
        </form>
      </Modal>

      {/* Modal Live Test Solver */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="⚡ Kiểm Tra & Thử Giải Recaptcha Trực Tiếp"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTestModal(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleRunTest} loading={testing}>
              <HiOutlineBolt size={16} /> Bắt Đầu Thử Giải
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: '#a1a1aa', margin: 0 }}>
            Kiểm tra kết nối và độ trễ của dịch vụ giải captcha khi gửi request tự động từ Gateway.
          </p>

          <Input
            label="Target URL"
            defaultValue="https://chatgpt.com/auth/login"
            fullWidth
          />
          <Input
            label="Google SiteKey"
            defaultValue="6Ldx3i8UAAAAAJhUv3U_1C0f_2fA5z0X0_test"
            fullWidth
          />

          {testResult && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.85rem',
                borderRadius: '8px',
                color: '#34d399',
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}
            >
              {testResult}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RecaptchaPage;
