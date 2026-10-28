import { useState, useEffect } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCreditCard,
  HiOutlineBolt,
  HiOutlineBanknotes,
  HiOutlineCheckBadge,
  HiOutlineCube,
} from 'react-icons/hi2';
import Button from '@modules/core/design-system/Button';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import { Modal } from '@modules/core/design-system/Modal';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Card } from '@modules/core/design-system/Card';
import { Badge } from '@modules/core/design-system/Badge';
import { StatCard, SearchInput } from '@modules/core/design-system/Components';
import { billingService } from '@modules/billing/services/billingService';

export interface CreditPackageItem {
  id: string;
  name: string;
  category: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'DEV' | 'TOPUP';
  tagBadge?: string;
  credits: number;
  bonusCredits: number;
  priceVnd: number;
  originalPriceVnd?: number;
  modelsIncluded: string[];
  durationDays: number; // 0 = Không giới hạn
  rateLimitRpm: number;
  salesCount: number;
  isActive: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Tất cả phân loại' },
  { value: 'STARTER', label: 'Gói Cơ Bản (Starter)' },
  { value: 'PRO', label: 'Gói Chuyên Nghiệp (Pro)' },
  { value: 'ENTERPRISE', label: 'Gói Doanh Nghiệp (Enterprise)' },
  { value: 'DEV', label: 'Gói API Developer' },
  { value: 'TOPUP', label: 'Gói Nạp Trực Tiếp (VietQR Top-Up)' },
];

const PackagesPage = () => {
  const [packages, setPackages] = useState<CreditPackageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackageItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CreditPackageItem['category']>('PRO');
  const [formTagBadge, setFormTagBadge] = useState('');
  const [formCredits, setFormCredits] = useState(250000);
  const [formBonusCredits, setFormBonusCredits] = useState(35000);
  const [formPriceVnd, setFormPriceVnd] = useState(200000);
  const [formOriginalPriceVnd, setFormOriginalPriceVnd] = useState(250000);
  const [formModels, setFormModels] = useState('gpt-4o, claude-3-5-sonnet, midjourney-v6');
  const [formDurationDays, setFormDurationDays] = useState(60);
  const [formRateLimitRpm, setFormRateLimitRpm] = useState(300);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await billingService.getAdminPackages();
      setPackages(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          category: (p.category as any) || 'PRO',
          tagBadge: p.tag_badge,
          credits: p.credits_given,
          bonusCredits: Math.round((p.credits_given * (p.bonus_percentage || 0)) / 100),
          priceVnd: p.price_vnd,
          originalPriceVnd: p.original_price_vnd || p.price_vnd,
          modelsIncluded: p.features || [],
          durationDays: 60,
          rateLimitRpm: 300,
          salesCount: 0,
          isActive: p.is_active,
        }))
      );
    } catch (err) {
      console.error('Failed to load packages from database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenAdd = () => {
    setEditingPkg(null);
    setFormName('');
    setFormCategory('PRO');
    setFormTagBadge('Bán chạy nhất');
    setFormCredits(250000);
    setFormBonusCredits(35000);
    setFormPriceVnd(200000);
    setFormOriginalPriceVnd(250000);
    setFormModels('gpt-4o, claude-3-5-sonnet, midjourney-v6');
    setFormDurationDays(60);
    setFormRateLimitRpm(300);
    setShowModal(true);
  };

  const handleOpenEdit = (p: CreditPackageItem) => {
    setEditingPkg(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormTagBadge(p.tagBadge || '');
    setFormCredits(p.credits);
    setFormBonusCredits(p.bonusCredits);
    setFormPriceVnd(p.priceVnd);
    setFormOriginalPriceVnd(p.originalPriceVnd || p.priceVnd);
    setFormModels(p.modelsIncluded.join(', '));
    setFormDurationDays(p.durationDays);
    setFormRateLimitRpm(p.rateLimitRpm);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const modelsList = formModels
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const bonusPct = formCredits > 0 ? Math.round((formBonusCredits / formCredits) * 100) : 0;

    try {
      if (editingPkg) {
        await billingService.updatePackage(editingPkg.id, {
          name: formName,
          category: formCategory,
          tag_badge: formTagBadge,
          credits_given: Number(formCredits),
          bonus_percentage: bonusPct,
          price_vnd: Number(formPriceVnd),
          original_price_vnd: Number(formOriginalPriceVnd),
          features: modelsList,
        });
      } else {
        await billingService.createPackage({
          name: formName,
          category: formCategory,
          tag_badge: formTagBadge,
          credits_given: Number(formCredits),
          bonus_percentage: bonusPct,
          price_vnd: Number(formPriceVnd),
          original_price_vnd: Number(formOriginalPriceVnd),
          features: modelsList,
          is_active: true,
        });
      }
      await fetchPackages();
      setShowModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi lưu gói credit vào database');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá gói credit này khỏi cơ sở dữ liệu?')) {
      try {
        await billingService.removePackage(id);
        await fetchPackages();
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Lỗi khi xoá gói');
      }
    }
  };

  const handleToggle = async (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    try {
      await billingService.updatePackage(id, { is_active: !pkg.isActive });
      await fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Lỗi khi đổi trạng thái');
    }
  };

  // Stats
  const totalSalesRevenue = packages.reduce((acc, p) => acc + p.salesCount * p.priceVnd, 0);
  const totalSalesCount = packages.reduce((acc, p) => acc + p.salesCount, 0);
  const activePackagesCount = packages.filter((p) => p.isActive).length;

  const filtered = packages.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modelsIncluded.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCategory === 'ALL' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const columns: TableColumn<CreditPackageItem>[] = [
    {
      key: 'name',
      header: 'Tên Gói Credit & Nhãn',
      render: (p) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong style={{ color: '#fafafa' }}>{p.name}</strong>
            {p.tagBadge && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {p.tagBadge}
              </span>
            )}
            <Badge variant="primary" size="sm">
              {p.category}
            </Badge>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2 }}>
            Hạn dùng: {p.durationDays === 0 ? 'Vĩnh viễn (Không hết hạn)' : `${p.durationDays} ngày`} • Tốc độ: {p.rateLimitRpm} RPM
          </div>
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Điểm Credit Tín Dụng',
      render: (p) => (
        <div>
          <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem' }}>
            {p.credits.toLocaleString()} pts
          </span>
          {p.bonusCredits > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
              +{p.bonusCredits.toLocaleString()} bonus
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'priceVnd',
      header: 'Giá Bán (VNĐ)',
      render: (p) => (
        <div>
          <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.88rem' }}>
            {p.priceVnd.toLocaleString()} ₫
          </span>
          {p.originalPriceVnd && p.originalPriceVnd > p.priceVnd && (
            <div style={{ fontSize: '0.7rem', color: '#71717a', textDecoration: 'line-through' }}>
              {p.originalPriceVnd.toLocaleString()} ₫
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'modelsIncluded',
      header: 'Models Quyền Truy Cập',
      render: (p) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
          {p.modelsIncluded.slice(0, 3).map((m) => (
            <Badge key={m} variant="neutral" size="sm">
              {m}
            </Badge>
          ))}
          {p.modelsIncluded.length > 3 && (
            <Badge variant="primary" size="sm">
              +{p.modelsIncluded.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'salesCount',
      header: 'Đã Bán',
      align: 'right',
      render: (p) => (
        <div style={{ textAlign: 'right' }}>
          <strong style={{ color: '#38bdf8' }}>{p.salesCount.toLocaleString()}</strong>
          <div style={{ fontSize: '0.68rem', color: '#71717a' }}>lượt mua</div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng Thái',
      align: 'center',
      render: (p) => (
        <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm" dot>
          <button
            type="button"
            onClick={() => handleToggle(p.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          >
            {p.isActive ? 'Đang Bán' : 'Tạm Dừng'}
          </button>
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác',
      align: 'center',
      render: (p) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
            <HiOutlinePencilSquare size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
            <HiOutlineTrash size={16} style={{ color: '#f43f5e' }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top StatCards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title="Tổng Gói Đang Bán" value={`${activePackagesCount} / ${packages.length}`} icon={<HiOutlineCube size={22} />} change="Sẵn sàng cấu hình" changeType="neutral" />
        <StatCard title="Tổng Doanh Thu Gói" value={`${(totalSalesRevenue / 1000000).toFixed(1)}M ₫`} icon={<HiOutlineBanknotes size={22} />} change="Tự động nạp qua QR/Bank" changeType="neutral" />
        <StatCard title="Lượt Bán Thành Công" value={totalSalesCount.toLocaleString()} icon={<HiOutlineCheckBadge size={22} />} change="Thời gian thực" changeType="neutral" />
        <StatCard title="Tín Dụng Khả Dụng" value="Đa tầng Model" icon={<HiOutlineBolt size={22} />} change="Hạn ngạch động" changeType="neutral" />
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
            <SearchInput
              placeholder="Tìm tên gói credit, models áp dụng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
            <Select options={CATEGORY_OPTIONS} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} />
          </div>
          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <HiOutlinePlus size={16} /> Thêm Gói Credit
          </Button>
        </div>
      </Card>

      {/* Main Table */}
      <Card
        title="Quản Lý Danh Sách Gói Tín Dụng & Dịch Vụ Credit"
        subtitle={`Đang cấu hình ${filtered.length} gói dịch vụ nạp tiền cho người dùng và doanh nghiệp`}
        headerRight={<HiOutlineCreditCard size={20} style={{ color: '#6366f1' }} />}
        padding="none"
      >
        <Table columns={columns} data={filtered} rowKey={(p) => p.id} page={page} pageSize={10} onPageChange={setPage} loading={isLoading} />
      </Card>

      {/* Modal Thêm / Sửa Gói Credit */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingPkg ? 'Cập Nhật Gói Credit' : 'Thêm Gói Tín Dụng Credit Mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Lưu Gói Credit
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Tên Gói Credit"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Pro Creator Credit Pack"
              required
              fullWidth
            />
            <Select
              label="Phân Loại Gói"
              options={[
                { value: 'STARTER', label: 'Gói Cơ Bản (Starter)' },
                { value: 'PRO', label: 'Gói Chuyên Nghiệp (Pro)' },
                { value: 'ENTERPRISE', label: 'Gói Doanh Nghiệp (Enterprise)' },
                { value: 'DEV', label: 'Gói API Developer' },
              ]}
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as CreditPackageItem['category'])}
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Nhãn / Badge Nổi Bật (Tùy chọn)"
              value={formTagBadge}
              onChange={(e) => setFormTagBadge(e.target.value)}
              placeholder="VD: Bán chạy nhất, Tiết kiệm 20%"
              fullWidth
            />
            <Input
              label="Thời Hạn Sử Dụng (Ngày - Nhập 0 = Vĩnh viễn)"
              type="number"
              value={formDurationDays}
              onChange={(e) => setFormDurationDays(Number(e.target.value))}
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Số Credit Cơ Bản Cấp"
              type="number"
              value={formCredits}
              onChange={(e) => setFormCredits(Number(e.target.value))}
              hint="VD: 250,000 Credits"
              required
              fullWidth
            />
            <Input
              label="Credit Thưởng Tặng Kèm (Bonus)"
              type="number"
              value={formBonusCredits}
              onChange={(e) => setFormBonusCredits(Number(e.target.value))}
              hint="VD: 35,000 Bonus Credits"
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Giá Bán Khuyến Mãi (VNĐ)"
              type="number"
              value={formPriceVnd}
              onChange={(e) => setFormPriceVnd(Number(e.target.value))}
              required
              fullWidth
            />
            <Input
              label="Giá Gốc Niêm Yết (VNĐ)"
              type="number"
              value={formOriginalPriceVnd}
              onChange={(e) => setFormOriginalPriceVnd(Number(e.target.value))}
              fullWidth
            />
          </div>

          <Input
            label="Danh Sách Models Được Sử Dụng (Phân cách bởi dấu phẩy)"
            value={formModels}
            onChange={(e) => setFormModels(e.target.value)}
            placeholder="gpt-4o, claude-3-5-sonnet, midjourney-v6, deepseek-chat"
            hint="Nhập danh sách mã model AI được phép tiêu thụ bằng credit của gói này"
            fullWidth
          />

          <Input
            label="Giới Hạn Tốc Độ Gọi (RPM - Requests/phút)"
            type="number"
            value={formRateLimitRpm}
            onChange={(e) => setFormRateLimitRpm(Number(e.target.value))}
            hint="Mặc định: 300 RPM"
            fullWidth
          />
        </form>
      </Modal>
    </div>
  );
};

export default PackagesPage;
