import React, { useState, useEffect } from 'react';
import { Modal } from '@modules/core/design-system/Modal';
import { Badge } from '@modules/core/design-system/Badge';
import Button from '@modules/core/design-system/Button';
import {
  userManagementService,
  type UserDetailDto,
  type UserAuditLogDto,
  type CreditAuditLogDto,
} from '../services/userManagementService';

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userFullName?: string;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onClose,
  userId,
  userFullName,
}) => {
  const [detailTab, setDetailTab] = useState<'info' | 'security' | 'credits'>('info');
  const [userDetail, setUserDetail] = useState<UserDetailDto | null>(null);
  const [userAuditLogs, setUserAuditLogs] = useState<UserAuditLogDto[]>([]);
  const [userCreditLogs, setUserCreditLogs] = useState<CreditAuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setUserDetail(null);
      setUserAuditLogs([]);
      setUserCreditLogs([]);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [detail, aLogs, cLogs] = await Promise.all([
          userManagementService.getUserDetail(userId),
          userManagementService.getUserAuditLogs(userId),
          userManagementService.getUserCreditLogs(userId),
        ]);
        setUserDetail(detail);
        setUserAuditLogs(aLogs);
        setUserCreditLogs(cLogs);
        setDetailTab('info');
      } catch (err) {
        console.error('Failed to load user detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, userId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Hồ Sơ & Kiểm Toán Bảo Mật: ${userDetail?.fullName || userFullName || ''}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #27272a', paddingBottom: 8 }}>
          <button
            type="button"
            onClick={() => setDetailTab('info')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: detailTab === 'info' ? '#27272a' : 'transparent',
              color: detailTab === 'info' ? '#fff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Thông Tin Chung
          </button>
          <button
            type="button"
            onClick={() => setDetailTab('security')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: detailTab === 'security' ? '#27272a' : 'transparent',
              color: detailTab === 'security' ? '#fff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Nhật Ký Quản Trị ({userAuditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setDetailTab('credits')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: detailTab === 'credits' ? '#27272a' : 'transparent',
              color: detailTab === 'credits' ? '#fff' : '#71717a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Biến Động Tín Dụng ({userCreditLogs.length})
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>Đang tải dữ liệu hồ sơ...</div>
        ) : (
          <>
            {/* Tab 1: General Info & Security Metrics */}
            {detailTab === 'info' && userDetail && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.84rem' }}>
                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>User ID</span>
                  <strong style={{ color: '#e4e4e7', wordBreak: 'break-all' }}>{userDetail.id}</strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Địa Chỉ Email</span>
                  <strong style={{ color: '#e4e4e7' }}>{userDetail.email}</strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Vai Trò RBAC</span>
                  <strong style={{ color: '#6366f1' }}>{userDetail.roles?.join(', ')}</strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Gói Hội Viên (Tier)</span>
                  <strong style={{ color: '#10b981' }}>{userDetail.tier || 'FREE'}</strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Số Dư Tín Dụng</span>
                  <strong style={{ color: '#10b981' }}>{(userDetail.creditBalance || 0).toLocaleString()} Credits</strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Trạng Thái Tài Khoản</span>
                  <strong style={{ color: userDetail.isActive ? '#10b981' : '#f43f5e' }}>
                    {userDetail.isActive ? 'Đang Hoạt Động' : 'Đang Bị Khóa'}
                  </strong>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>IP Đăng Nhập Gần Nhất</span>
                  <code style={{ color: '#a1a1aa' }}>{userDetail.lastLoginIp || 'Chưa ghi nhận'}</code>
                </div>

                <div style={{ padding: 12, background: '#121214', borderRadius: 8, border: '1px solid #1f1f23' }}>
                  <span style={{ color: '#71717a', display: 'block', fontSize: '0.72rem' }}>Thời Gian Đăng Nhập Cuối</span>
                  <span style={{ color: '#a1a1aa' }}>
                    {userDetail.lastLoginAt ? new Date(userDetail.lastLoginAt).toLocaleString('vi-VN') : 'Chưa có'}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Security Audit Logs */}
            {detailTab === 'security' && (
              <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userAuditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a', fontSize: '0.84rem' }}>
                    Chưa có nhật ký bảo mật nào được ghi nhận cho tài khoản này
                  </div>
                ) : (
                  userAuditLogs.map((log) => (
                    <div key={log.id} style={{
                      padding: '10px 14px',
                      background: '#121214',
                      borderRadius: 6,
                      border: '1px solid #27272a',
                      fontSize: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Badge variant="primary" size="sm">{log.action}</Badge>
                        <span style={{ color: '#71717a', fontSize: '0.72rem' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      <div style={{ color: '#e4e4e7', margin: '4px 0' }}>{log.reason || log.details}</div>
                      <div style={{ color: '#71717a', fontSize: '0.72rem', display: 'flex', gap: 12 }}>
                        <span>Bởi: {log.actorEmail}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Credit Audit Logs */}
            {detailTab === 'credits' && (
              <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userCreditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a', fontSize: '0.84rem' }}>
                    Chưa có biến động số dư nào được lưu vết
                  </div>
                ) : (
                  userCreditLogs.map((log) => (
                    <div key={log.id} style={{
                      padding: '10px 14px',
                      background: '#121214',
                      borderRadius: 6,
                      border: '1px solid #27272a',
                      fontSize: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: log.delta > 0 ? '#10b981' : '#f43f5e', fontSize: '0.9rem' }}>
                          {log.delta > 0 ? '+' : ''}{log.delta.toLocaleString()} Credits
                        </strong>
                        <span style={{ color: '#71717a', fontSize: '0.72rem' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      <div style={{ color: '#e4e4e7', margin: '4px 0' }}>{log.reason}</div>
                      <div style={{ color: '#71717a', fontSize: '0.72rem' }}>
                        Số dư: {log.balanceBefore.toLocaleString()} → {log.balanceAfter.toLocaleString()} (Thực hiện bởi: {log.actorEmail})
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UserDetailModal;
