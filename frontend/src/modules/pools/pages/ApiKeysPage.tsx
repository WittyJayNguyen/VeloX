import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineKey,
  HiOutlineBolt,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineServerStack,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineArrowTopRightOnSquare,
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
  poolService,
  type PoolItem,
  type PoolKeyItem,
  type KeyAuthType,
  type KeyStatus,
  type PlanTier,
} from '../services/poolService';
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

interface EnrichedKeyItem extends PoolKeyItem {
  poolName: string;
  poolProvider: string;
}

const ApiKeysPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPoolFilter = searchParams.get('pool') || 'ALL';

  const [pools, setPools] = useState<PoolItem[]>([]);
  const [keys, setKeys] = useState<PoolKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPool, setFilterPool] = useState(initialPoolFilter);
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Key Modal State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<PoolKeyItem | null>(null);

  // View Models Modal State
  const [viewModelsKey, setViewModelsKey] = useState<EnrichedKeyItem | null>(null);
  const [modelsModalSearch, setModelsModalSearch] = useState('');

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
  const [formDetailedModels, setFormDetailedModels] = useState<Array<{ code: string; input_cost_per_1m: number; output_cost_per_1m: number; cache_read_cost_per_1m: number }>>([]);

  // Auto-detect Provider State
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [detectSuccessMessage, setDetectSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialPoolFilter && initialPoolFilter !== 'ALL') {
      setFilterPool(initialPoolFilter);
    }
  }, [initialPoolFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [poolsData, keysData] = await Promise.all([
        poolService.getPools(),
        poolService.getPoolKeys(),
      ]);
      setPools(poolsData);
      setKeys(keysData);
    } catch (err: any) {
      console.error('Failed to load pools and keys:', err);
      setError(err?.response?.data?.detail || 'Không thể tải danh sách Keys từ server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleOpenEditKey = (k: PoolKeyItem) => {
    setEditingKey(k);
    setFormPoolId(k.pool_id);
    setFormName(k.name);
    setFormAuthType(k.auth_type);
    setFormKeyVal(k.key_val);
    setFormRecapToken(k.recap_token || '');
    setFormCookies(k.cookies || '');
    setFormMetadataJson(k.metadata_json || '');
    setFormQuotaDaily(k.quota_daily);
    setFormQuotaDailyUsed(k.quota_daily_used);
    setFormQuotaMonthly(k.quota_monthly);
    setFormQuotaMonthlyUsed(k.quota_monthly_used);
    setFormPoints(k.points);
    setFormPriority(k.priority);
    setFormPlanBadge(k.plan_badge);
    setFormStatus(k.status);
    setFormDetectedModels(k.detected_models || []);
    setDetectSuccessMessage(null);
    setShowKeyModal(true);
  };

  // ⚡ Nhận diện & Lấy Quota Tự Động Từ NCC qua API
  const handleAutoDetectFromProvider = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const testKeyVal = formKeyVal.trim() || (formCookies.trim() ? 'sess_autodetect' : '');
    if (!testKeyVal && !formCookies.trim()) {
      alert('Vui lòng nhập API Key hoặc dán Session Cookies của tài khoản trước khi nhận diện NCC.');
      return;
    }

    const selectedPool = pools.find((p) => p.id === formPoolId);
    const provider = selectedPool?.provider || 'OpenAI';
    const baseUrl = selectedPool?.base_url;

    setAutoDetecting(true);
    setDetectSuccessMessage(null);

    try {
      const res = await poolService.detectKeyModels(
        testKeyVal,
        provider,
        formPoolId,
        baseUrl,
        formAuthType,
        formCookies.trim()
      );
      if (res.status === 'INVALID') {
        alert(res.message);
        setDetectSuccessMessage(res.message);
        return;
      }
      setFormDetectedModels(res.detected_models || []);
      setFormDetailedModels(res.detailed_models || []);
      setFormPlanBadge(res.plan);
      setFormPoints(Math.round(res.quota_remaining_usd * 100));
      setFormStatus('ACTIVE');
      setDetectSuccessMessage(
        `${res.message} | Số dư ước tính: ${Math.round(res.quota_remaining_usd).toLocaleString()} ₫ | Gói: ${res.plan}`
      );
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi nhận diện Key từ nhà cung cấp');
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPoolId) {
      alert('Vui lòng chọn cụm Pool.');
      return;
    }

    const isSession = formAuthType === 'SESSION_TOKEN' || formCookies.trim().length > 0;
    let finalKeyVal = formKeyVal.trim();
    if (!finalKeyVal) {
      if (isSession && formCookies.trim()) {
        const cleanName = (formName.trim() || 'acc').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        finalKeyVal = `${cleanName}_${Date.now().toString(36)}`;
      } else {
        alert('Vui lòng nhập API Key hoặc dán Cookies của tài khoản.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Partial<PoolKeyItem> = {
        pool_id: formPoolId,
        name: formName.trim() || `Acc #${Date.now().toString(36).toUpperCase()}`,
        auth_type: formAuthType,
        key_val: finalKeyVal,
        recap_token: formRecapToken.trim() || undefined,
        cookies: formCookies.trim() || undefined,
        metadata_json: formMetadataJson.trim() || undefined,
        quota_daily: Number(formQuotaDaily),
        quota_daily_used: Number(formQuotaDailyUsed),
        quota_monthly: Number(formQuotaMonthly),
        quota_monthly_used: Number(formQuotaMonthlyUsed),
        points: Number(formPoints),
        priority: Number(formPriority),
        plan_badge: formPlanBadge,
        status: formStatus,
        detected_models: formDetectedModels,
        quota_remaining_usd: formPoints > 0 ? formPoints / 100 : undefined,
      };

      if (editingKey) {
        await poolService.updatePoolKey(editingKey.id, payload);
      } else {
        await poolService.createPoolKey(payload);
      }

      setShowKeyModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu Key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá API Key / Token này khỏi cụm Pool?')) {
      try {
        await poolService.deletePoolKey(keyId);
        await fetchData();
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Không thể xoá key');
      }
    }
  };

  const handleToggleStatus = async (keyId: string) => {
    try {
      await poolService.togglePoolKey(keyId);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không thể đổi trạng thái key');
    }
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Enriched Keys with Pool info
  const poolMap = useMemo(() => {
    const map = new Map<string, PoolItem>();
    pools.forEach((p) => map.set(p.id, p));
    return map;
  }, [pools]);

  const enrichedKeys: EnrichedKeyItem[] = useMemo(() => {
    return keys.map((k) => {
      const p = poolMap.get(k.pool_id);
      return {
        ...k,
        poolName: p ? p.name : 'Unknown Pool',
        poolProvider: p ? p.provider : 'Custom',
      };
    });
  }, [keys, poolMap]);

  // Metrics
  const totalKeys = enrichedKeys.length;
  const activeKeys = enrichedKeys.filter((k) => k.status === 'ACTIVE').length;
  const quotaExceededKeys = enrichedKeys.filter((k) => k.status === 'QUOTA_EXCEEDED').length;
  const sessionTokenKeys = enrichedKeys.filter((k) => k.auth_type === 'SESSION_TOKEN').length;

  // Filter
  const filteredKeys = enrichedKeys.filter((k) => {
    const matchSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.key_val.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.detected_models || []).some((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchPool = filterPool === 'ALL' || k.pool_id === filterPool;
    const matchPlan = filterPlan === 'ALL' || k.plan_badge === filterPlan;
    const matchStatus = filterStatus === 'ALL' || k.status === filterStatus;

    return matchSearch && matchPool && matchPlan && matchStatus;
  });

  const columns: TableColumn<EnrichedKeyItem>[] = [
    {
      key: 'name',
      header: 'Tên Key & Giá Trị',
      render: (k) => {
        const isRevealed = revealedKeys[k.id];
        const masked = k.key_val.length > 14
          ? `${k.key_val.substring(0, 7)}••••••••${k.key_val.substring(k.key_val.length - 4)}`
          : '••••••••••••';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ color: '#fafafa' }}>{k.name}</strong>
              <Badge variant={k.plan_badge === 'Enterprise' ? 'purple' : k.plan_badge === 'Pro' ? 'primary' : 'neutral'} size="sm">
                {k.plan_badge}
              </Badge>
              {k.auth_type === 'SESSION_TOKEN' && (
                <Badge variant="warning" size="sm">
                  Web Session
                </Badge>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#a1a1aa' }}>
              <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                {isRevealed ? k.key_val : masked}
              </code>
              <button
                type="button"
                onClick={() => toggleRevealKey(k.id)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
                title={isRevealed ? 'Ẩn giá trị' : 'Xem giá trị đầy đủ'}
              >
                {isRevealed ? <HiOutlineEyeSlash size={14} /> : <HiOutlineEye size={14} />}
              </button>
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
        const dailyPctRaw = k.quota_daily > 0 ? (k.quota_daily_used / k.quota_daily) * 100 : 0;
        const monthlyPctRaw = k.quota_monthly > 0 ? (k.quota_monthly_used / k.quota_monthly) * 100 : 0;

        const dailyPct = Math.min(100, Math.round(dailyPctRaw));
        const monthlyPct = Math.min(100, Math.round(monthlyPctRaw));

        const dailyText = dailyPctRaw > 0 && dailyPctRaw < 1 ? dailyPctRaw.toFixed(1) + '%' : `${dailyPct}%`;
        const monthlyText = monthlyPctRaw > 0 && monthlyPctRaw < 1 ? monthlyPctRaw.toFixed(1) + '%' : `${monthlyPct}%`;

        const dailyBarWidth = k.quota_daily_used > 0 ? Math.max(3, dailyPct) : 0;
        const monthlyBarWidth = k.quota_monthly_used > 0 ? Math.max(3, monthlyPct) : 0;

        const getMeterColor = (pct: number) => (pct > 90 ? poolStyles.danger : pct > 70 ? poolStyles.warning : poolStyles.safe);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            <div className={poolStyles.quotaMeter}>
              <div className={poolStyles.quotaLabel}>
                <span>Ngày: {k.quota_daily_used.toLocaleString()} / {k.quota_daily.toLocaleString()}</span>
                <span style={{ fontWeight: 600 }}>{dailyText}</span>
              </div>
              <div className={poolStyles.progressBarTrack}>
                <div
                  className={`${poolStyles.progressBarFill} ${getMeterColor(dailyPct)}`}
                  style={{ width: `${dailyBarWidth}%` }}
                />
              </div>
            </div>

            <div className={poolStyles.quotaMeter}>
              <div className={poolStyles.quotaLabel}>
                <span>Tháng: {k.quota_monthly_used.toLocaleString()} / {k.quota_monthly.toLocaleString()}</span>
                <span style={{ fontWeight: 600 }}>{monthlyText}</span>
              </div>
              <div className={poolStyles.progressBarTrack}>
                <div
                  className={`${poolStyles.progressBarFill} ${getMeterColor(monthlyPct)}`}
                  style={{ width: `${monthlyBarWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'detected_models',
      header: 'Models Nhận Diện',
      render: (k) => {
        const count = (k.detected_models || []).length;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setViewModelsKey(k);
                setModelsModalSearch('');
              }}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#818cf8',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Bấm để xem danh sách chi tiết các models thuộc key này"
            >
              <HiOutlineSparkles size={13} />
              {count} Models
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 140 }}>
              {(k.detected_models || []).slice(0, 2).map((m) => (
                <span key={m} style={{ fontSize: '0.68rem', color: '#71717a' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        );
      },
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
              onClick={() => handleToggleStatus(k.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.72rem',
              }}
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
            title="Xem danh sách models thuộc Key này"
            onClick={() => {
              setViewModelsKey(k);
              setModelsModalSearch('');
            }}
          >
            <HiOutlineSparkles size={16} style={{ color: '#818cf8' }} />
          </Button>
          <Button variant="ghost" size="sm" title="Chỉnh sửa Key" onClick={() => handleOpenEditKey(k)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" title="Xóa Key khỏi Pool" onClick={() => handleDeleteKey(k.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineKey style={{ color: '#6366f1' }} />
            Kho Tài Khoản & API Key Pool (Gateway)
          </h1>
          <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
            Quản lý tập trung API Key chính thức, Session Token Web Account, phân bổ Quota & xoay vòng thông minh
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={fetchData} disabled={loading}>
            <HiOutlineArrowPath size={16} className={loading ? 'spin' : ''} />
            Làm Mới
          </Button>
          <Button variant="primary" onClick={() => handleOpenAddKey()}>
            <HiOutlinePlus size={16} />
            Thêm API Key / Token Mới
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
          title="Tổng Keys / Tokens"
          value={totalKeys}
          trend={{ value: `${sessionTokenKeys} Session Web`, positive: true }}
          icon={<HiOutlineKey size={22} />}
        />
        <StatCard
          title="Đang Hoạt Động (Active)"
          value={activeKeys}
          trend={{ value: `${totalKeys > 0 ? Math.round((activeKeys / totalKeys) * 100) : 0}% sẵn sàng`, positive: true }}
          icon={<HiOutlineSparkles size={22} />}
        />
        <StatCard
          title="Hết Quota / Cảnh Báo"
          value={quotaExceededKeys}
          trend={{ value: 'Tự động dừng cấp phát', positive: false }}
          icon={<HiOutlineExclamationTriangle size={22} />}
        />
        <StatCard
          title="Tổng Cụm Service Pool"
          value={pools.length}
          trend={{ value: 'Phân phối tải đa vùng', positive: true }}
          icon={<HiOutlineServerStack size={22} />}
        />
      </div>

      {/* Filter & Table Card */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <SearchInput
                placeholder="Tìm theo tên key, sk-..., model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '170px' }}>
              <Select
                value={filterPool}
                onChange={(e) => setFilterPool(e.target.value)}
                options={[{ value: 'ALL', label: 'Tất cả Pool' }, ...pools.map((p) => ({ value: p.id, label: p.name }))]}
              />
            </div>
            <div style={{ minWidth: '140px' }}>
              <Select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                options={[{ value: 'ALL', label: 'Tất cả Gói' }, ...PLAN_OPTIONS]}
              />
            </div>
            <div style={{ minWidth: '150px' }}>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[{ value: 'ALL', label: 'Tất cả Trạng thái' }, ...STATUS_OPTIONS]}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
            Hiển thị <strong>{filteredKeys.length}</strong> / {totalKeys} keys
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredKeys}
          rowKey={(k) => k.id}
          page={page}
          pageSize={10}
          onPageChange={setPage}
          emptyText={loading ? 'Đang tải danh sách keys...' : 'Không tìm thấy API Key / Token nào phù hợp với bộ lọc'}
        />
      </Card>

      {/* Modal Add / Edit Key */}
      <Modal
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title={editingKey ? `Chỉnh Sửa Key: ${editingKey.name}` : 'Thêm API Key / Token Vào Pool'}
        size="lg"
      >
        <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pools.length === 0 && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, color: '#fbbf24', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>⚠️ Hệ thống chưa có cụm Service Pool nào để gán Key. Vui lòng tạo Pool trước.</span>
              <Button size="sm" variant="secondary" type="button" onClick={() => { setShowKeyModal(false); navigate('/admin/services'); }}>
                Tạo Cụm Pool Ngay
              </Button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Gán Vào Cụm Service Pool <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <Select
                value={formPoolId}
                onChange={(e) => setFormPoolId(e.target.value)}
                options={pools.map((p) => ({ value: p.id, label: `${p.name} (${p.provider})` }))}
                placeholder={pools.length === 0 ? '-- Chưa có Pool nào (Vui lòng tạo trước) --' : '-- Chọn Cụm Pool --'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Loại Xác Thực (Auth Type) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <Select
                value={formAuthType}
                onChange={(e) => setFormAuthType(e.target.value as KeyAuthType)}
                options={AUTH_TYPE_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
              Tên Gợi Nhớ (Friendly Name)
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: OpenAI Org Master #1, DeepSeek Tier 3 Key..."
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7' }}>
                {formAuthType === 'API_KEY' ? 'Khóa API Key Chính Thức (sk-...)' : 'Mã Định Danh / Key Token (Tự sinh nếu bỏ trống)'} {formAuthType === 'API_KEY' && <span style={{ color: '#f43f5e' }}>*</span>}
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoDetectFromProvider}
                disabled={autoDetecting || (!formKeyVal.trim() && !formCookies.trim())}
                title="Gửi ping đến nhà cung cấp để nhận diện models và quota"
              >
                <HiOutlineSparkles size={14} style={{ color: '#818cf8' }} />
                {autoDetecting ? 'Đang Nhận Diện...' : 'Nhận Diện Models Tự Động'}
              </Button>
            </div>
            <Input
              value={formKeyVal}
              onChange={(e) => setFormKeyVal(e.target.value)}
              placeholder={formAuthType === 'API_KEY' ? 'sk-proj-xxxxxxxxxxxx...' : 'sess-account-id... (tự sinh nếu bỏ trống)'}
              required={formAuthType === 'API_KEY' && !formCookies.trim()}
            />
            {detectSuccessMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#34d399', marginTop: 4 }}>
                <HiOutlineCheck size={14} />
                {detectSuccessMessage}
              </div>
            )}
            {formDetectedModels.length > 0 && (
              <div style={{ marginTop: 8, padding: '0.65rem 0.85rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
                    Models Khả Dụng Từ NCC ({formDetectedModels.length})
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Tự động đồng bộ vào All Models
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
                  {formDetectedModels.map((m) => {
                    const detail = formDetailedModels.find((d) => d.code === m);
                    return (
                      <span
                        key={m}
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'monospace',
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: '#0f172a',
                          color: '#bae6fd',
                          border: '1px solid #1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <strong>{m}</strong>
                        {detail && (
                          <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                            (Vào: {detail.input_cost_per_1m.toLocaleString()}₫ | Ra: {detail.output_cost_per_1m.toLocaleString()}₫ | Cache: {detail.cache_read_cost_per_1m.toLocaleString()}₫ / 1M)
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {formAuthType === 'SESSION_TOKEN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid #27272a' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineShieldCheck size={16} /> Cấu Hình Tài Khoản Qua Session & Cookies (Multi-Account Node)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(251, 191, 36, 0.08)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                💡 <strong>Mỗi Key là 1 tài khoản:</strong> Bạn chỉ cần dán Cookie của tài khoản vào ô bên dưới. Khi người dùng tạo ảnh/video, hệ thống sẽ tự động điều phối xoay vòng (Least Used) và tự động Failover sang tài khoản kế tiếp nếu một tài khoản bị hết phiên.
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: 2 }}>
                  Cookies Tài Khoản (Hỗ trợ định dạng JSON [&#123;name, value&#125;] từ Cookie-Editor hoặc chuỗi header a=b; c=d) <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <Textarea
                  value={formCookies}
                  onChange={(e) => setFormCookies(e.target.value)}
                  placeholder='Dán toàn bộ Cookie JSON [ {"name": "session", "value": "..."} ] hoặc chuỗi Header "cookie1=val1; cookie2=val2"'
                  rows={4}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a1a1aa', marginBottom: 2 }}>
                  Recaptcha Token / Solver Task ID (Tuỳ chọn nếu cần vượt captcha)
                </label>
                <Input
                  value={formRecapToken}
                  onChange={(e) => setFormRecapToken(e.target.value)}
                  placeholder="Token từ 2Captcha, CapSolver hoặc solver nội bộ..."
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Hạn Mức Ngày (Daily Quota)
              </label>
              <Input
                type="number"
                value={formQuotaDaily}
                onChange={(e) => setFormQuotaDaily(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Hạn Mức Tháng (Monthly Quota)
              </label>
              <Input
                type="number"
                value={formQuotaMonthly}
                onChange={(e) => setFormQuotaMonthly(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Điểm Trọng Số (Points)
              </label>
              <Input
                type="number"
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Ưu Tiên (Priority 1 - 10)
              </label>
              <Input
                type="number"
                value={formPriority}
                onChange={(e) => setFormPriority(Number(e.target.value))}
                min={1}
                max={10}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Gói Tài Khoản (Tier Badge)
              </label>
              <Select
                value={formPlanBadge}
                onChange={(e) => setFormPlanBadge(e.target.value as PlanTier)}
                options={PLAN_OPTIONS}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', marginBottom: '0.35rem' }}>
                Trạng Thái Khởi Tạo
              </label>
              <Select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as KeyStatus)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
            <Button variant="secondary" type="button" onClick={() => setShowKeyModal(false)}>
              Huỷ Bỏ
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu vào DB...' : editingKey ? 'Lưu Thay Đổi Key' : 'Thêm Key Vào Pool'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xem Danh Sách Models của Key */}
      <Modal
        open={Boolean(viewModelsKey)}
        onClose={() => setViewModelsKey(null)}
        title={
          viewModelsKey
            ? `Danh Sách Models — Key: ${viewModelsKey.name} (${viewModelsKey.poolName || 'Pool'})`
            : 'Danh Sách Models'
        }
        size="lg"
      >
        {viewModelsKey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header info banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: '#18181b',
                borderRadius: '8px',
                border: '1px solid #27272a',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Badge variant={viewModelsKey.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                  {viewModelsKey.status}
                </Badge>
                <Badge variant="purple" size="sm">
                  {viewModelsKey.plan_badge} Tier
                </Badge>
                <Badge variant="info" size="sm">
                  P{viewModelsKey.priority}
                </Badge>
                <span style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                  Hỗ trợ: <strong style={{ color: '#fafafa' }}>{(viewModelsKey.detected_models || []).length}</strong> models
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate(`/admin/models?key=${viewModelsKey.id}`);
                }}
                title="Chuyển sang trang All Models và tự động lọc danh sách theo Key này"
              >
                Mở trong All Models <HiOutlineArrowTopRightOnSquare size={14} style={{ marginLeft: 4 }} />
              </Button>
            </div>

            {/* Search within models */}
            <SearchInput
              placeholder="Tìm mã model (vd: gpt-4o, claude-3-5, gemini, deepseek)..."
              value={modelsModalSearch}
              onChange={(e) => setModelsModalSearch(e.target.value)}
              onClear={() => setModelsModalSearch('')}
            />

            {/* Models Grid */}
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#09090b',
                borderRadius: '8px',
                border: '1px solid #1f2937',
              }}
            >
              {(viewModelsKey.detected_models || [])
                .filter((m) => m.toLowerCase().includes(modelsModalSearch.toLowerCase()))
                .map((m) => (
                  <div
                    key={m}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#18181b',
                      borderRadius: '6px',
                      border: '1px solid #27272a',
                      fontSize: '0.78rem',
                      color: '#e4e4e7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'monospace',
                    }}
                  >
                    <span style={{ color: '#38bdf8' }}>{m}</span>
                  </div>
                ))}

              {(viewModelsKey.detected_models || []).filter((m) =>
                m.toLowerCase().includes(modelsModalSearch.toLowerCase())
              ).length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.85rem' }}>
                  Không tìm thấy model nào khớp với từ khóa "{modelsModalSearch}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setViewModelsKey(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApiKeysPage;
