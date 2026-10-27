import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineKey,
  HiOutlineBolt,
  HiOutlineCpuChip,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineServerStack,
  HiOutlineCheck,
} from 'react-icons/hi2';
import { RiOpenaiFill } from 'react-icons/ri';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Textarea } from '@modules/core/design-system/Textarea';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';
import {
  getPoolsFromStorage,
  savePoolsToStorage,
  type PoolItem,
  type PoolKeyItem,
  type KeyAuthType,
  type KeyStatus,
  type PlanTier,
} from './ServicePoolPage';
import poolStyles from '@assets/scss/admin/pools-admin.module.scss';

const PLAN_OPTIONS = [
  { value: 'Free', label: 'Free Tier' },
  { value: 'Plus', label: 'Plus Tier' },
  { value: 'Pro', label: 'Pro Tier' },
  { value: 'Team', label: 'Team Tier' },
  { value: 'Enterprise', label: 'Enterprise Tier' },
];

const AUTH_TYPE_OPTIONS = [
  { value: 'API_KEY', label: 'API Key Chính Thức (sk-...)' },
  { value: 'SESSION_TOKEN', label: 'Session Token (Tự giải Recaptcha / Web Acc)' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động (Active)' },
  { value: 'PAUSED', label: 'Tạm dừng (Paused)' },
  { value: 'QUOTA_EXCEEDED', label: 'Hết hạn mức (Quota Exceeded)' },
  { value: 'ERROR', label: 'Lỗi Token / Cookie (Error)' },
];

const ApiKeysPage = () => {
  const [searchParams] = useSearchParams();
  const initialPoolFilter = searchParams.get('pool') || 'ALL';

  const [pools, setPools] = useState<PoolItem[]>(getPoolsFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState(initialPoolFilter);
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<{ poolId: string; key: PoolKeyItem } | null>(null);

  // Form Fields
  const [formPoolId, setFormPoolId] = useState('');
  const [formName, setFormName] = useState('');
  const [formAuthType, setFormAuthType] = useState<KeyAuthType>('API_KEY');
  const [formKeyVal, setFormKeyVal] = useState('');
  const [formRecapToken, setFormRecapToken] = useState('');
  const [formCookies, setFormCookies] = useState('');
  const [formMetadataJson, setFormMetadataJson] = useState('');
  const [formQuotaDaily, setFormQuotaDaily] = useState(10000);
  const [formQuotaDailyUsed, setFormQuotaDailyUsed] = useState(0);
  const [formQuotaMonthly, setFormQuotaMonthly] = useState(250000);
  const [formQuotaMonthlyUsed, setFormQuotaMonthlyUsed] = useState(0);
  const [formPoints, setFormPoints] = useState(20000);
  const [formPriority, setFormPriority] = useState(8);
  const [formPlanBadge, setFormPlanBadge] = useState<PlanTier>('Pro');
  const [formStatus, setFormStatus] = useState<KeyStatus>('ACTIVE');
  const [formDetectedModels, setFormDetectedModels] = useState<string[]>([]);

  // Auto-detect Provider State
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [detectSuccessMessage, setDetectSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialPoolFilter && initialPoolFilter !== 'ALL') {
      setFilterPool(initialPoolFilter);
    }
  }, [initialPoolFilter]);

  const savePools = (u: PoolItem[]) => {
    setPools(u);
    savePoolsToStorage(u);
  };

  const handleOpenAddKey = (targetPoolId?: string) => {
    setEditingKey(null);
    setFormPoolId(targetPoolId || (pools.length > 0 ? pools[0].id : ''));
    setFormName('');
    setFormAuthType('API_KEY');
    setFormKeyVal('');
    setFormRecapToken('');
    setFormCookies('');
    setFormMetadataJson('');
    setFormQuotaDaily(10000);
    setFormQuotaDailyUsed(0);
    setFormQuotaMonthly(250000);
    setFormQuotaMonthlyUsed(0);
    setFormPoints(20000);
    setFormPriority(8);
    setFormPlanBadge('Pro');
    setFormStatus('ACTIVE');
    setFormDetectedModels([]);
    setDetectSuccessMessage(null);
    setShowKeyModal(true);
  };

  const handleOpenEditKey = (poolId: string, k: PoolKeyItem) => {
    setEditingKey({ poolId, key: k });
    setFormPoolId(poolId);
    setFormName(k.name);
    setFormAuthType(k.authType);
    setFormKeyVal(k.keyVal);
    setFormRecapToken(k.recapToken || '');
    setFormCookies(k.cookies || '');
    setFormMetadataJson(k.metadataJson || '');
    setFormQuotaDaily(k.quotaDaily);
    setFormQuotaDailyUsed(k.quotaDailyUsed);
    setFormQuotaMonthly(k.quotaMonthly);
    setFormQuotaMonthlyUsed(k.quotaMonthlyUsed);
    setFormPoints(k.points);
    setFormPriority(k.priority);
    setFormPlanBadge(k.planBadge);
    setFormStatus(k.status);
    setFormDetectedModels(k.detectedModels || []);
    setDetectSuccessMessage(null);
    setShowKeyModal(true);
  };

  // ⚡ Nhận diện & Lấy Quota Tự Động Từ NCC
  const handleAutoDetectFromProvider = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!formKeyVal.trim()) {
      alert('Vui lòng nhập API Key hoặc Session Token trước khi nhận diện NCC.');
      return;
    }

    setAutoDetecting(true);
    setDetectSuccessMessage(null);

    // Giả lập kết nối endpoint nhà cung cấp (OpenAI / Claude / DeepSeek)
    setTimeout(() => {
      setAutoDetecting(false);

      const isSession = formAuthType === 'SESSION_TOKEN' || formKeyVal.startsWith('sess-');
      const isAnthropic = formKeyVal.startsWith('sk-ant');
      const isDeepSeek = formKeyVal.startsWith('sk-ds');

      let detectedModels = ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'text-embedding-3-large'];
      let detectedTier: PlanTier = 'Pro';
      let autoDaily = 25000;
      let autoMonthly = 500000;
      let autoPoints = 45000;
      let balanceUsd = 120.0;

      if (isSession) {
        detectedModels = ['gpt-4o', 'gpt-4o-mini', 'dall-e-3'];
        detectedTier = 'Plus';
        autoDaily = 2000;
        autoMonthly = 40000;
        autoPoints = 15000;
        balanceUsd = 20.0;
      } else if (isAnthropic) {
        detectedModels = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
        detectedTier = 'Enterprise';
        autoDaily = 15000;
        autoMonthly = 350000;
        autoPoints = 50000;
        balanceUsd = 450.0;
      } else if (isDeepSeek) {
        detectedModels = ['deepseek-chat', 'deepseek-reasoner'];
        detectedTier = 'Pro';
        autoDaily = 30000;
        autoMonthly = 600000;
        autoPoints = 35000;
        balanceUsd = 180.0;
      }

      setFormDetectedModels(detectedModels);
      setFormPlanBadge(detectedTier);
      setFormQuotaDaily(autoDaily);
      setFormQuotaMonthly(autoMonthly);
      setFormPoints(autoPoints);
      setFormStatus('ACTIVE');

      setDetectSuccessMessage(
        `Đã nhận diện thành công: ${detectedModels.length} models khả dụng | Số dư khả dụng: $${balanceUsd.toFixed(2)} | Gói: ${detectedTier}`
      );
    }, 900);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPoolId || !formKeyVal.trim()) {
      alert('Vui lòng chọn cụm Pool và nhập giá trị Key/Token.');
      return;
    }

    const keyPayload: PoolKeyItem = {
      id: editingKey ? editingKey.key.id : `key_${Date.now()}`,
      name: formName || `Key #${Date.now().toString(36).toUpperCase()}`,
      authType: formAuthType,
      keyVal: formKeyVal.trim(),
      recapToken: formRecapToken.trim() || undefined,
      cookies: formCookies.trim() || undefined,
      metadataJson: formMetadataJson.trim() || undefined,
      quotaDaily: Number(formQuotaDaily),
      quotaDailyUsed: Number(formQuotaDailyUsed),
      quotaMonthly: Number(formQuotaMonthly),
      quotaMonthlyUsed: Number(formQuotaMonthlyUsed),
      points: Number(formPoints),
      priority: Number(formPriority),
      planBadge: formPlanBadge,
      status: formStatus,
      requestsCount: editingKey ? editingKey.key.requestsCount : 0,
      detectedModels: formDetectedModels.length > 0 ? formDetectedModels : ['gpt-4o', 'gpt-4o-mini'],
      lastCheckedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      quotaRemainingUsd: formPoints > 0 ? formPoints / 100 : undefined,
    };

    if (editingKey) {
      // Key may have moved pool
      const oldPoolId = editingKey.poolId;
      if (oldPoolId === formPoolId) {
        savePools(
          pools.map((p) =>
            p.id === formPoolId
              ? {
                  ...p,
                  keys: p.keys.map((k) => (k.id === keyPayload.id ? keyPayload : k)),
                }
              : p
          )
        );
      } else {
        // Remove from old pool, add to new pool
        const updated = pools.map((p) => {
          if (p.id === oldPoolId) {
            return { ...p, keys: p.keys.filter((k) => k.id !== keyPayload.id) };
          }
          if (p.id === formPoolId) {
            return { ...p, keys: [...p.keys, keyPayload] };
          }
          return p;
        });
        savePools(updated);
      }
    } else {
      // Add new key to selected pool
      savePools(
        pools.map((p) =>
          p.id === formPoolId
            ? { ...p, keys: [...p.keys, keyPayload] }
            : p
        )
      );
    }

    setShowKeyModal(false);
  };

  const handleToggleStatus = (poolId: string, keyId: string) => {
    savePools(
      pools.map((p) =>
        p.id === poolId
          ? {
              ...p,
              keys: p.keys.map((k) => {
                if (k.id === keyId) {
                  const nextStatus: KeyStatus = k.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                  return { ...k, status: nextStatus };
                }
                return k;
              }),
            }
          : p
      )
    );
  };

  const handleDeleteKey = (poolId: string, keyId: string) => {
    if (confirm('Bạn có chắc muốn xoá API Key/Token này khỏi cụm điều phối?')) {
      savePools(
        pools.map((p) =>
          p.id === poolId ? { ...p, keys: p.keys.filter((k) => k.id !== keyId) } : p
        )
      );
    }
  };

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Flatten all keys with pool info
  const allKeys = pools.flatMap((p) =>
    p.keys.map((k) => ({
      ...k,
      poolName: p.name,
      poolId: p.id,
      poolProvider: p.provider,
      poolBaseUrl: p.baseUrl,
    }))
  );

  // Filters
  const filteredKeys = allKeys.filter((k) => {
    const matchSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keyVal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.cookies && k.cookies.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPool = filterPool === 'ALL' || k.poolId === filterPool;
    const matchPlan = filterPlan === 'ALL' || k.planBadge === filterPlan;
    const matchStatus = filterStatus === 'ALL' || k.status === filterStatus;
    return matchSearch && matchPool && matchPlan && matchStatus;
  });

  // Stats calculation
  const totalKeysCount = allKeys.length;
  const activeKeysCount = allKeys.filter((k) => k.status === 'ACTIVE').length;
  const totalPoints = allKeys.reduce((acc, k) => acc + (k.points || 0), 0);
  const errorOrExceeded = allKeys.filter((k) => k.status === 'ERROR' || k.status === 'QUOTA_EXCEEDED').length;

  const poolOptions = [{ value: 'ALL', label: 'Tất cả Pools Điều Phối' }, ...pools.map((p) => ({ value: p.id, label: `${p.name} (${p.provider})` }))];

  const columns: TableColumn<(typeof filteredKeys)[0]>[] = [
    {
      key: 'name',
      header: 'Tên Tài Khoản & Giá Trị',
      render: (k) => {
        const isRevealed = revealedKeys[k.id];
        const masked = isRevealed
          ? k.keyVal
          : k.keyVal.length > 14
          ? `${k.keyVal.substring(0, 8)}...${k.keyVal.substring(k.keyVal.length - 4)}`
          : '••••••••••••';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong style={{ color: '#fafafa' }}>{k.name}</strong>
              <span className={`${poolStyles.planBadge} ${poolStyles[k.planBadge.toLowerCase()] || ''}`}>
                {k.planBadge}
              </span>
              <Badge variant={k.authType === 'API_KEY' ? 'info' : 'purple'} size="sm">
                {k.authType === 'API_KEY' ? 'API Key' : 'Session Token'}
              </Badge>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={poolStyles.keySnippet}>
                <code>{masked}</code>
                <button
                  type="button"
                  onClick={() => toggleRevealKey(k.id)}
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: 0 }}
                  title={isRevealed ? 'Ẩn key' : 'Hiện key'}
                >
                  {isRevealed ? <HiOutlineEyeSlash size={13} /> : <HiOutlineEye size={13} />}
                </button>
              </span>

              {k.cookies && (
                <span className={poolStyles.cookieMetaTag} title="Có Cookie / JSON Metadata">
                  <HiOutlineDocumentText size={11} /> Cookie
                </span>
              )}
              {k.recapToken && (
                <span className={poolStyles.cookieMetaTag} title={`Tự giải Recaptcha: ${k.recapToken}`}>
                  <HiOutlineShieldCheck size={11} /> Recaptcha
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'poolName',
      header: 'Cụm Pool Điều Phối',
      render: (k) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Badge variant="primary" size="sm">
            {k.poolProvider === 'OpenAI' && <RiOpenaiFill size={12} style={{ marginRight: 3 }} />}
            {k.poolName}
          </Badge>
          <span style={{ fontSize: '0.68rem', color: '#71717a' }}>{k.poolProvider} Gateway</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Ưu Tiên & Điểm',
      align: 'center',
      render: (k) => {
        const isHigh = k.priority >= 8;
        const isHighest = k.priority === 10;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span
              className={`${poolStyles.priorityBadge} ${isHighest ? poolStyles.highest : isHigh ? poolStyles.high : ''}`}
              title="Độ ưu tiên xoay vòng điều phối (1 - 10)"
            >
              <HiOutlineBolt size={12} /> P{k.priority}
            </span>
            <span className={poolStyles.pointsBadge}>
              {(k.points || 0).toLocaleString()} pts
            </span>
          </div>
        );
      },
    },
    {
      key: 'quotaDaily',
      header: 'Hạn Mức Quota (Daily / Monthly)',
      render: (k) => {
        const dailyPct = k.quotaDaily > 0 ? Math.min(100, Math.round((k.quotaDailyUsed / k.quotaDaily) * 100)) : 0;
        const monthlyPct = k.quotaMonthly > 0 ? Math.min(100, Math.round((k.quotaMonthlyUsed / k.quotaMonthly) * 100)) : 0;

        const getMeterColor = (pct: number) => (pct > 90 ? poolStyles.danger : pct > 70 ? poolStyles.warning : poolStyles.safe);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            {/* Daily */}
            <div className={poolStyles.quotaMeter}>
              <div className={poolStyles.quotaLabel}>
                <span>Ngày: {k.quotaDailyUsed.toLocaleString()} / {k.quotaDaily.toLocaleString()}</span>
                <span>{dailyPct}%</span>
              </div>
              <div className={poolStyles.progressBarTrack}>
                <div
                  className={`${poolStyles.progressBarFill} ${getMeterColor(dailyPct)}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            </div>

            {/* Monthly */}
            <div className={poolStyles.quotaMeter}>
              <div className={poolStyles.quotaLabel}>
                <span>Tháng: {k.quotaMonthlyUsed.toLocaleString()} / {k.quotaMonthly.toLocaleString()}</span>
                <span>{monthlyPct}%</span>
              </div>
              <div className={poolStyles.progressBarTrack}>
                <div
                  className={`${poolStyles.progressBarFill} ${getMeterColor(monthlyPct)}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'detectedModels',
      header: 'Models Nhận Diện',
      render: (k) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
          {(k.detectedModels || []).slice(0, 3).map((m) => (
            <Badge key={m} variant="neutral" size="sm">
              {m}
            </Badge>
          ))}
          {(k.detectedModels || []).length > 3 && (
            <Badge variant="primary" size="sm">
              +{(k.detectedModels || []).length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng Thái',
      align: 'center',
      render: (k) => {
        let badgeVariant: 'success' | 'neutral' | 'warning' | 'danger' = 'success';
        let label = 'Hoạt động';

        if (k.status === 'PAUSED') {
          badgeVariant = 'neutral';
          label = 'Tạm dừng';
        } else if (k.status === 'QUOTA_EXCEEDED') {
          badgeVariant = 'warning';
          label = 'Hết Quota';
        } else if (k.status === 'ERROR') {
          badgeVariant = 'danger';
          label = 'Lỗi Token';
        }

        return (
          <Badge variant={badgeVariant} size="sm" dot>
            <button
              type="button"
              onClick={() => handleToggleStatus(k.poolId, k.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.72rem',
              }}
              title="Bấm để chuyển trạng thái Hoạt động / Tạm dừng"
            >
              {label}
            </button>
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (k) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            title="⚡ Quét & Lấy Quota Từ NCC ngay"
            onClick={() => {
              handleOpenEditKey(k.poolId, k);
              setTimeout(() => handleAutoDetectFromProvider(), 200);
            }}
          >
            <HiOutlineSparkles size={16} style={{ color: '#10b981' }} />
          </Button>
          <Button variant="ghost" size="sm" title="Chỉnh sửa key" onClick={() => handleOpenEditKey(k.poolId, k)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Xóa key" onClick={() => handleDeleteKey(k.poolId, k.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top StatCards */}
      <div className={poolStyles.statsGrid}>
        <StatCard title="Tổng Keys & Session Tokens" value={totalKeysCount} icon={<HiOutlineKey size={22} />} change="Đa nhà cung cấp" changeType="up" />
        <StatCard title="Keys Đang Hoạt Động" value={activeKeysCount} icon={<HiOutlineShieldCheck size={22} />} change={`${totalKeysCount > 0 ? Math.round((activeKeysCount / totalKeysCount) * 100) : 0}% sẵn sàng`} changeType="up" />
        <StatCard title="Tổng Điểm / Points" value={`${totalPoints.toLocaleString()} pts`} icon={<HiOutlineBolt size={22} />} change="Xoay vòng thông minh" changeType="up" />
        <StatCard title="Cảnh Báo Quota / Lỗi" value={errorOrExceeded} icon={<HiOutlineExclamationTriangle size={22} />} change={errorOrExceeded > 0 ? 'Cần nạp thêm' : 'Ổn định'} changeType={errorOrExceeded > 0 ? 'down' : 'neutral'} />
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
            <SearchInput
              placeholder="Tìm tên, mã key, session token, cookie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
            <Select options={poolOptions} value={filterPool} onChange={(e) => setFilterPool(e.target.value)} />
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả Gói (Tier)' },
                { value: 'Free', label: 'Free' },
                { value: 'Plus', label: 'Plus' },
                { value: 'Pro', label: 'Pro' },
                { value: 'Team', label: 'Team' },
                { value: 'Enterprise', label: 'Enterprise' },
              ]}
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            />
            <Select
              options={[
                { value: 'ALL', label: 'Tất cả Trạng Thái' },
                { value: 'ACTIVE', label: 'Hoạt động' },
                { value: 'PAUSED', label: 'Tạm dừng' },
                { value: 'QUOTA_EXCEEDED', label: 'Hết Quota' },
                { value: 'ERROR', label: 'Lỗi' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
          <Button variant="primary" size="md" onClick={() => handleOpenAddKey()}>
            <HiOutlinePlus size={16} /> Thêm Key / Session Token
          </Button>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card
        title="Quản Lý API Keys & Session Tokens Điều Phối"
        subtitle={`Đang hiển thị ${filteredKeys.length} khóa / tài khoản đang được quản lý`}
        headerRight={<HiOutlineCpuChip size={20} style={{ color: '#10b981' }} />}
        padding="none"
      >
        <Table columns={columns} data={filteredKeys} rowKey={(k) => `${k.poolId}_${k.id}`} page={page} pageSize={10} onPageChange={setPage} />
      </Card>

      {/* Modal Thêm / Cập Nhật Key & Token */}
      <Modal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title={editingKey ? 'Cập Nhật API Key & Session Token' : 'Thêm API Key / Session Token Mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowKeyModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveKey}>
              {editingKey ? 'Lưu Thay Đổi' : 'Tạo Khóa Mới'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* ⚡ Auto-Detect Provider Banner Box */}
          <div className={poolStyles.autoDetectBanner}>
            <div className={poolStyles.detectInfo}>
              <div className={poolStyles.detectIcon}>
                <HiOutlineBolt />
              </div>
              <div>
                <h4>Nhận Diện & Lấy Quota Tự Động Từ NCC</h4>
                <p>Tự động gọi API nhà cung cấp để quét danh sách models khả dụng, số dư và hạn mức quota.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoDetectFromProvider}
              loading={autoDetecting}
            >
              <HiOutlineSparkles size={15} style={{ color: '#10b981' }} />
              ⚡ Quét & Lấy Quota Ngay
            </Button>
          </div>

          {detectSuccessMessage && (
            <div className={poolStyles.detectSuccessToast}>
              <HiOutlineCheck size={16} />
              <span>{detectSuccessMessage}</span>
            </div>
          )}

          {/* Section 1: Gán Cụm & Nhận Diện */}
          <div className={poolStyles.formSectionTitle}>
            <HiOutlineServerStack /> Gán Cụm Pool Điều Phối & Nhận Diện
          </div>

          <div className={poolStyles.formGrid2}>
            <Select
              label="Gán Cụm Pool Điều Phối"
              options={pools.map((p) => ({ value: p.id, label: `${p.name} (${p.provider})` }))}
              value={formPoolId}
              onChange={(e) => setFormPoolId(e.target.value)}
              required
              fullWidth
            />
            <Input
              label="Tên Nhận Diện Tài Khoản / Key"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: OpenAI Team Shared #1"
              required
              fullWidth
            />
          </div>

          <div className={poolStyles.formGrid2}>
            <Select
              label="Gói Tài Khoản (Plan Badge)"
              options={PLAN_OPTIONS}
              value={formPlanBadge}
              onChange={(e) => setFormPlanBadge(e.target.value as PlanTier)}
              fullWidth
            />
            <Select
              label="Trạng Thái Hoạt Động"
              options={STATUS_OPTIONS}
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as KeyStatus)}
              fullWidth
            />
          </div>

          {/* Section 2: Loại Xác Thực & Bí Mật */}
          <div className={poolStyles.formSectionTitle}>
            <HiOutlineKey /> Loại Xác Thực & Thông Tin Bí Mật
          </div>

          <Select
            label="Loại Xác Thực"
            options={AUTH_TYPE_OPTIONS}
            value={formAuthType}
            onChange={(e) => setFormAuthType(e.target.value as KeyAuthType)}
            fullWidth
          />

          <Input
            label={formAuthType === 'API_KEY' ? 'Giá Trị API Key (Secret Key)' : 'Session Token (Mỗi Token 1 Acc Khác Nhau)'}
            value={formKeyVal}
            onChange={(e) => setFormKeyVal(e.target.value)}
            placeholder={formAuthType === 'API_KEY' ? 'sk-proj-... hoặc sk-ant-...' : 'sess-8812... hoặc bearer token'}
            required
            fullWidth
          />

          {formAuthType === 'SESSION_TOKEN' && (
            <Input
              label="Recaptcha Solver Token / Account (Tự giải Recaptcha)"
              value={formRecapToken}
              onChange={(e) => setFormRecapToken(e.target.value)}
              placeholder="VD: 2cap_solver_acc01 / anti-captcha key"
              hint="Hỗ trợ tự động vượt Recaptcha v2/v3 theo từng account độc lập"
              fullWidth
            />
          )}

          <Textarea
            label="Cookies / JSON Metadata (Tùy Chọn)"
            value={formCookies}
            onChange={(e) => setFormCookies(e.target.value)}
            placeholder="cf_clearance=...; __cf_bm=...; __Secure-next-auth.session-token=... hoặc JSON headers tùy biến"
            hint="Nhập Cookie phiên web hoặc JSON metadata bổ sung cho tài khoản này"
            fullWidth
          />

          {/* Section 3: Cấu hình Hạn Mức Quota & Giới Hạn Gọi */}
          <div className={poolStyles.formSectionTitle}>
            <HiOutlineCpuChip /> Cấu Hình Hạn Mức Quota & Giới Hạn Gọi
          </div>

          <div className={poolStyles.formGrid2}>
            <Input
              label="Hạn Mức Quota Ngày (Daily Limit - Requests)"
              type="number"
              value={formQuotaDaily}
              onChange={(e) => setFormQuotaDaily(Number(e.target.value))}
              hint="Giới hạn số lượt gọi tối đa trong 1 ngày"
              fullWidth
            />
            <Input
              label="Đã Dùng Trong Ngày (Daily Used)"
              type="number"
              value={formQuotaDailyUsed}
              onChange={(e) => setFormQuotaDailyUsed(Number(e.target.value))}
              fullWidth
            />
          </div>

          <div className={poolStyles.formGrid2}>
            <Input
              label="Hạn Mức Quota Tháng (Monthly Limit - Requests)"
              type="number"
              value={formQuotaMonthly}
              onChange={(e) => setFormQuotaMonthly(Number(e.target.value))}
              hint="Giới hạn số lượt gọi tối đa trong 1 tháng"
              fullWidth
            />
            <Input
              label="Đã Dùng Trong Tháng (Monthly Used)"
              type="number"
              value={formQuotaMonthlyUsed}
              onChange={(e) => setFormQuotaMonthlyUsed(Number(e.target.value))}
              fullWidth
            />
          </div>

          {/* Section 4: Mức Ưu Tiên & Điểm Số */}
          <div className={poolStyles.formSectionTitle}>
            <HiOutlineBolt /> Điều Phối Xoay Vòng: Ưu Tiên & Điểm Số
          </div>

          <div className={poolStyles.formGrid2}>
            <Input
              label="Số Điểm / Points (Balance / Trọng Số)"
              type="number"
              value={formPoints}
              onChange={(e) => setFormPoints(Number(e.target.value))}
              hint="Điểm khả dụng hoặc trọng số phân bổ request"
              fullWidth
            />
            <Input
              label="Mức Ưu Tiên Xoay Vòng (Priority 1 - 10)"
              type="number"
              min={1}
              max={10}
              value={formPriority}
              onChange={(e) => setFormPriority(Number(e.target.value))}
              hint="10 là ưu tiên cao nhất (gọi trước), 1 là thấp nhất"
              fullWidth
            />
          </div>

          {formDetectedModels.length > 0 && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: 6 }}>
                Models Được Nhận Diện Từ NCC:
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {formDetectedModels.map((m) => (
                  <Badge key={m} variant="primary" size="sm">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default ApiKeysPage;
