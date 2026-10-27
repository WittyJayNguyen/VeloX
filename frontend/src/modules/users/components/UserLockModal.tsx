import React, { useState, useEffect } from 'react';
import { Modal } from '@modules/core/design-system/Modal';
import Button from '@modules/core/design-system/Button';
import { userManagementService, type UserDto } from '../services/userManagementService';

interface UserLockModalProps {
  open: boolean;
  onClose: () => void;
  targetUser: UserDto | null;
  onSuccess: () => void;
  setStatusMessage: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export const UserLockModal: React.FC<UserLockModalProps> = ({
  open,
  onClose,
  targetUser,
  onSuccess,
  setStatusMessage,
}) => {
  const [lockReason, setLockReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetUser && open) {
      setLockReason(
        targetUser.isActive
          ? 'Tạm khóa tài khoản do nghi vấn vi phạm bảo mật / lạm dụng'
          : 'Mở khóa tài khoản theo yêu cầu khách hàng'
      );
    }
  }, [targetUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !targetUser) return;
    if (!lockReason.trim()) {
      alert('Vui lòng cung cấp lý do thay đổi trạng thái');
      return;
    }

    setIsSubmitting(true);
    const nextStatus = !targetUser.isActive;
    try {
      await userManagementService.toggleUserStatus(targetUser.id, nextStatus, lockReason.trim());
      onClose();
      const actionText = nextStatus ? 'Mở khóa' : 'Tạm khóa';
      setStatusMessage({
        type: 'success',
        text: `Đã ${actionText} tài khoản ${targetUser.email} thành công. Toàn bộ phiên đăng nhập cũ đã được vô hiệu hóa.`,
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái tài khoản';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={targetUser?.isActive ? 'Khóa Tài Khoản Người Dùng' : 'Mở Khóa Tài Khoản'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: '12px 16px',
          background: targetUser?.isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${targetUser?.isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          borderRadius: 8,
          fontSize: '0.84rem',
          color: targetUser?.isActive ? '#f87171' : '#34d399',
          lineHeight: 1.5,
        }}>
          {targetUser?.isActive
            ? `Hành động này sẽ tạm dừng quyền truy cập của ${targetUser.email}. Tất cả token đang hoạt động của người dùng sẽ bị vô hiệu hóa ngay lập tức.`
            : `Mở khóa cho phép ${targetUser?.email} tiếp tục đăng nhập và sử dụng dịch vụ AI Gateway.`}
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Lý Do Thay Đổi Trạng Thái (Bắt buộc)
          </label>
          <input
            type="text"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="Nhập lý do thực hiện thao tác..."
            required
            minLength={3}
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
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={targetUser?.isActive ? 'danger' : 'primary'}
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {targetUser?.isActive ? 'Xác Nhận Khóa' : 'Xác Nhận Mở Khóa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserLockModal;
