import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@modules/core/design-system/Card';
import Button from '@modules/core/design-system/Button';
import { Table, type TableColumn } from '@modules/core/design-system/Table';
import { Badge } from '@modules/core/design-system/Badge';
import { Select } from '@modules/core/design-system/Select';
import { Input } from '@modules/core/design-system/Input';
import { Modal } from '@modules/core/design-system/Modal';
import {
  HiOutlineShieldExclamation,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineNoSymbol,
  HiOutlineBanknotes,
  HiOutlineCheck,
} from 'react-icons/hi2';

import {
  userManagementService,
  type IpRuleDto,
  type IpLinkedAccount,
} from '../services/userManagementService';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: `${color}18`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.4rem',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  </Card>
);

export const IpAbusePage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<IpRuleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [stats, setStats] = useState({
    totalTrackedIps: 0,
    bannedIps: 0,
    suspiciousIps: 0,
    farmedCreditsAtRisk: 0,
  });

  // Modal: Ban IP
  const [showBanModal, setShowBanModal] = useState(false);
  const [banTargetIp, setBanTargetIp] = useState('');
  const [banReason, setBanReason] = useState('Spam đăng ký nhiều tài khoản để nhận credit miễn phí');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal: View Linked Accounts
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [selectedIpForAccounts, setSelectedIpForAccounts] = useState<string>('');
  const [selectedLinkedAccounts, setSelectedLinkedAccounts] = useState<IpLinkedAccount[]>([]);

  // Load IP rules from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userManagementService.getIpRules({
        page,
        pageSize,
        status: filterStatus,
        search: searchTerm,
      });

      setItems(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setStats(res.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách IP giám sát';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterStatus, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear toast after 5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Handlers
  const handleOpenBanModal = (ip?: string) => {
    setBanTargetIp(ip || '');
    setBanReason('Spam đăng ký tài khoản liên tiếp để bào ưu đãi free credit');
    setShowBanModal(true);
  };

  const handleExecuteBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTargetIp.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await userManagementService.banIp({
        ip_address: banTargetIp.trim(),
        reason: banReason.trim(),
        action_type: 'BLOCK_ALL',
      });
      setShowBanModal(false);
      setStatusMessage({
        type: 'success',
        text: `Đã cấm địa chỉ IP ${banTargetIp.trim()} truy cập hệ thống thành công`,
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể chặn IP này';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnban = async (ip: string) => {
    if (!confirm(`Bạn có chắc muốn gỡ lệnh cấm đối với địa chỉ IP ${ip}?`)) return;

    try {
      await userManagementService.unbanIp(ip);
      setStatusMessage({ type: 'success', text: `Đã gỡ chặn địa chỉ IP ${ip} thành công` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gỡ chặn IP';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleBatchLockAccounts = async (ip: string) => {
    if (!confirm(`CẢNH BÁO: Khóa toàn bộ các tài khoản người dùng được tạo từ IP ${ip}? Toàn bộ phiên đăng nhập của họ sẽ bị vô hiệu hóa.`)) return;

    try {
      await userManagementService.batchLockIp({
        ip_address: ip,
        reason: 'Khóa hàng loạt do địa chỉ IP có hành vi gian lận / spam hệ thống',
      });
      setStatusMessage({ type: 'success', text: `Đã khóa toàn bộ các tài khoản thuộc IP ${ip}` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khóa tài khoản của IP này';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleBatchRevokeCredits = async (ip: string) => {
    if (!confirm(`CẢNH BÁO: Tịch thu và đưa số dư credit về 0 đối với tất cả tài khoản thuộc IP ${ip}?`)) return;

    try {
      await userManagementService.batchRevokeCreditsIp({
        ip_address: ip,
        reason: 'Tịch thu tín dụng do phát hiện gian lận farm free credit từ một IP',
      });
      setStatusMessage({ type: 'success', text: `Đã tịch thu toàn bộ credit của các tài khoản thuộc IP ${ip}` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tịch thu credit';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleViewAccounts = (it: IpRuleDto) => {
    setSelectedIpForAccounts(it.ipAddress);
    setSelectedLinkedAccounts(it.linkedAccounts || []);
    setShowAccountsModal(true);
  };

  const statusOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất Cả Trạng Thái' },
    { value: 'BANNED', label: 'Đang Bị Cấm (BANNED)' },
    { value: 'SUSPICIOUS', label: 'Nghi Vấn Bào Free (SUSPICIOUS)' },
    { value: 'ALLOWED', label: 'Bình Thường (ALLOWED)' },
  ], []);

  // Table Columns
  const columns: TableColumn<IpRuleDto>[] = [
    {
      key: 'ipAddress',
      header: 'Địa Chỉ IP & Nhận Diện',
      render: (it) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ color: '#fafafa', fontFamily: 'monospace', fontSize: '0.92rem' }}>
              {it.ipAddress}
            </strong>
            <Badge
              variant={
                it.status === 'BANNED'
                  ? 'danger'
                  : it.status === 'SUSPICIOUS'
                  ? 'warning'
                  : 'success'
              }
              size="sm"
              dot
            >
              {it.status === 'BANNED' ? 'ĐÃ CHẶN CẤM' : it.status === 'SUSPICIOUS' ? 'NGHI VẤN BÀO FREE' : 'BÌNH THƯỜNG'}
            </Badge>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: 3 }}>
            {it.reason}
          </div>
        </div>
      ),
    },
    {
      key: 'accountCount',
      header: 'Tài Khoản Liên Đới',
      render: (it) => (
        <div>
          <button
            type="button"
            onClick={() => handleViewAccounts(it)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: it.accountCount >= 3 ? '#facc15' : '#60a5fa',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'underline',
            }}
          >
            <HiOutlineUserGroup size={16} />
            {it.accountCount} tài khoản
          </button>
          {it.accountCount >= 3 && (
            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 2 }}>
              Vượt ngưỡng an toàn (&gt;= 3)
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'totalCreditsHeld',
      header: 'Tổng Credit Đang Giữ',
      render: (it) => (
        <strong style={{
          color: it.status === 'BANNED' || it.status === 'SUSPICIOUS' ? '#f43f5e' : '#10b981',
          fontSize: '0.88rem'
        }}>
          {it.totalCreditsHeld.toLocaleString()} Credits
        </strong>
      ),
    },
    {
      key: 'lastActive',
      header: 'Hoạt Động Cuối',
      render: (it) => (
        <div style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
          {it.lastActive ? new Date(it.lastActive).toLocaleString('vi-VN') : 'Mới ghi nhận'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Thao Tác Bảo Mật IP',
      render: (it) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {it.status === 'BANNED' ? (
            <button
              type="button"
              onClick={() => handleUnban(it.ipAddress)}
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                cursor: 'pointer',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Gỡ chặn IP"
            >
              <HiOutlineCheck size={14} />
              Mở Chặn
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenBanModal(it.ipAddress)}
              style={{
                padding: '5px 8px',
                borderRadius: 6,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Chặn cấm truy cập địa chỉ IP này"
            >
              <HiOutlineNoSymbol size={14} />
              Chặn IP
            </button>
          )}

          {it.accountCount > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleBatchLockAccounts(it.ipAddress)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 6,
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: '#fb7185',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Khóa tất cả tài khoản tạo từ IP này"
              >
                <HiOutlineLockClosed size={14} />
                Khóa Hết Acc
              </button>

              {it.totalCreditsHeld > 0 && (
                <button
                  type="button"
                  onClick={() => handleBatchRevokeCredits(it.ipAddress)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 6,
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    color: '#facc15',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Thu hồi toàn bộ free credits đã cấp cho các acc từ IP này"
                >
                  <HiOutlineBanknotes size={14} />
                  Tịch Thu Credit
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
              {t('admin.audit.ip_abuse_title', 'Giám Sát IP & Chống Bào Free')}
            </h1>
            <Badge variant="warning" size="sm">
              Anti-Farm Firewall
            </Badge>
          </div>
          <p style={{ color: '#71717a', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
            {t('admin.audit.ip_abuse_desc', 'Phát hiện và ngăn chặn hành vi spam tạo nhiều tài khoản từ một IP/Proxy nhằm trục lợi hạn mức tín dụng miễn phí')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} loading={loading}>
            <HiOutlineArrowPath size={16} style={{ marginRight: 6 }} />
            {t('common.refresh', 'Làm Mới')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleOpenBanModal()}>
            <HiOutlineShieldExclamation size={16} style={{ marginRight: 6 }} />
            {t('admin.audit.add_ip_blacklist', 'Thêm IP Vào Danh Sách Đen')}
          </Button>
        </div>
      </div>

      {/* Toast Alert */}
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {statusMessage.type === 'success' ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationTriangle size={20} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label={t('admin.audit.stat_banned_ips', 'Tổng IP Đang Giám Sát')}
          value={stats.totalTrackedIps.toLocaleString()}
          icon={<HiOutlineGlobeAlt />}
          color="#6366f1"
        />
        <StatCard
          label={t('admin.audit.stat_violating_accs', 'Địa Chỉ IP Đã Bị Cấm')}
          value={stats.bannedIps.toLocaleString()}
          icon={<HiOutlineNoSymbol />}
          color="#f43f5e"
        />
        <StatCard
          label={t('admin.audit.stat_blocked_requests', 'IP Nghi Vấn Bào Free (>= 3 Acc)')}
          value={stats.suspiciousIps.toLocaleString()}
          icon={<HiOutlineShieldExclamation />}
          color="#eab308"
        />
        <StatCard
          label="Lượng Credit Nguy Cơ Bị Bào"
          value={`${stats.farmedCreditsAtRisk.toLocaleString()} pts`}
          icon={<HiOutlineBanknotes />}
          color="#ec4899"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo địa chỉ IP hoặc lý do cảnh báo..."
            />
          </div>

          <div style={{ width: 260 }}>
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <Table
          rowKey={(it: IpRuleDto) => it.id}
          columns={columns}
          data={items}
          loading={loading}
          emptyText="Không có địa chỉ IP nào trong danh mục giám sát phù hợp với bộ lọc"
        />

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid #27272a',
          fontSize: '0.82rem',
          color: '#71717a',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div>
            Hiển thị <strong>{items.length}</strong> / <strong>{totalCount}</strong> địa chỉ IP (Trang {page} / {totalPages})
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang Kế
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal 1: Ban IP */}
      <Modal
        open={showBanModal}
        onClose={() => setShowBanModal(false)}
        title="Chặn Cấm Địa Chỉ IP (Blacklist Firewall)"
      >
        <form onSubmit={handleExecuteBan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            fontSize: '0.84rem',
            color: '#f87171',
            lineHeight: 1.5,
          }}>
            Khi bị chặn, địa chỉ IP này sẽ không thể tiếp tục gửi yêu cầu đăng ký mới hoặc đăng nhập vào bất kỳ tài khoản nào trên toàn hệ thống.
          </div>

          <Input
            label="Địa Chỉ IP Cần Chặn (IPv4 hoặc IPv6)"
            value={banTargetIp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBanTargetIp(e.target.value)}
            placeholder="VD: 14.161.22.45"
            required
          />

          <div>
            <label style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Lý Do Chặn (Bắt buộc cho nhật ký an ninh)
            </label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do chặn..."
              required
              minLength={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#09090b',
                border: '1px solid #27272a',
                color: '#fafafa',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button variant="outline" type="button" onClick={() => setShowBanModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" type="submit" loading={isSubmitting} disabled={isSubmitting}>
              Xác Nhận Chặn Cấm IP
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: View Linked Accounts */}
      <Modal
        open={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        title={`Danh Sách Tài Khoản Liên Kết IP: ${selectedIpForAccounts}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.84rem', color: '#a1a1aa' }}>
            Hệ thống phát hiện {selectedLinkedAccounts.length} tài khoản có nguồn gốc từ địa chỉ IP này:
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedLinkedAccounts.map((acc) => (
              <div
                key={acc.email}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#121214',
                  border: '1px solid #27272a',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#fafafa' }}>{acc.email}</div>
                  <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: 2 }}>
                    Số dư: <span style={{ color: '#10b981' }}>{acc.creditBalance.toLocaleString()} Credits</span>
                  </div>
                </div>

                <Badge variant={acc.isActive ? 'success' : 'danger'} size="sm">
                  {acc.isActive ? 'Hoạt Động' : 'Đang Khóa'}
                </Badge>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowAccountsModal(false);
                handleBatchLockAccounts(selectedIpForAccounts);
              }}
            >
              Khóa Toàn Bộ {selectedLinkedAccounts.length} Tài Khoản
            </Button>

            <Button variant="outline" onClick={() => setShowAccountsModal(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IpAbusePage;
