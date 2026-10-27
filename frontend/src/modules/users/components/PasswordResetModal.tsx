import React, { useState, useEffect } from 'react';
import { Modal } from '@modules/core/design-system/Modal';
import { Input } from '@modules/core/design-system/Input';
import Button from '@modules/core/design-system/Button';
import { HiOutlineKey, HiOutlineClipboardDocument, HiOutlineCheck } from 'react-icons/hi2';
import { userManagementService, type UserDto } from '../services/userManagementService';

interface PasswordResetModalProps {
  open: boolean;
  onClose: () => void;
  targetUser: UserDto | null;
  initialRevealedPassword?: string | null;
  onSuccess: () => void;
  setStatusMessage: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  open,
  onClose,
  targetUser,
  initialRevealedPassword,
  onSuccess,
  setStatusMessage,
}) => {
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetAutoGenerate, setResetAutoGenerate] = useState(true);
  const [revealedNewPassword, setRevealedNewPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setResetPasswordVal('');
      setResetAutoGenerate(true);
      setRevealedNewPassword(initialRevealedPassword || null);
      setCopiedPassword(false);
    }
  }, [open, initialRevealedPassword]);

  const handleCopy = () => {
    if (!revealedNewPassword) return;
    navigator.clipboard.writeText(revealedNewPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  const handleClose = () => {
    setRevealedNewPassword(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !targetUser) return;

    setIsSubmitting(true);
    try {
      const res = await userManagementService.resetPassword(
        targetUser.id,
        resetAutoGenerate ? undefined : resetPasswordVal,
        resetAutoGenerate
      );

      if (res.temporary_password) {
        setRevealedNewPassword(res.temporary_password);
      }
      setStatusMessage({
        type: 'success',
        text: `Đặt lại mật khẩu cho tài khoản ${targetUser.email} thành công. Các phiên đăng nhập đang hoạt động của người dùng đã bị hủy ngay lập tức.`,
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Đặt Lại Mật Khẩu: ${targetUser?.fullName || ''}`}
    >
      {revealedNewPassword ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            color: '#34d399',
            fontSize: '0.86rem',
          }}>
            Mật khẩu mới đã được cập nhật thành công! Hãy sao chép và gửi cho người dùng:
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: 8,
          }}>
            <code style={{ fontSize: '1.1rem', color: '#60a5fa', fontWeight: 700, letterSpacing: 1 }}>
              {revealedNewPassword}
            </code>
            <Button
              variant={copiedPassword ? 'primary' : 'outline'}
              size="sm"
              onClick={handleCopy}
            >
              {copiedPassword ? (
                <>
                  <HiOutlineCheck size={16} style={{ marginRight: 4 }} />
                  Đã Chép
                </>
              ) : (
                <>
                  <HiOutlineClipboardDocument size={16} style={{ marginRight: 4 }} />
                  Sao Chép
                </>
              )}
            </Button>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#71717a' }}>
            Mật khẩu này sẽ không hiển thị lại sau khi bạn đóng cửa sổ này. Mọi phiên đăng nhập cũ trên thiết bị khác đã bị ngắt kết nối an toàn.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="primary" onClick={handleClose}>
              Đã Lưu & Đóng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 8,
            fontSize: '0.84rem',
            color: '#facc15',
          }}>
            Lưu ý: Ngay sau khi đặt lại mật khẩu, tất cả phiên đăng nhập trên thiết bị khác của thành viên này sẽ bị ngắt kết nối an toàn (Invalidate Session).
          </div>

          <div style={{
            padding: '10px 14px',
            background: '#121214',
            borderRadius: 8,
            border: '1px solid #27272a',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', color: '#fafafa' }}>
              <input
                type="checkbox"
                checked={resetAutoGenerate}
                onChange={(e) => setResetAutoGenerate(e.target.checked)}
              />
              <span>Tự động tạo mật khẩu ngẫu nhiên an toàn (14 ký tự)</span>
            </label>

            {!resetAutoGenerate && (
              <div style={{ marginTop: 10 }}>
                <Input
                  label="Mật Khẩu Mới Tùy Chọn"
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPasswordVal(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, đủ chữ hoa, chữ thường, số, ký tự đặc biệt"
                  required={!resetAutoGenerate}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button variant="outline" type="button" onClick={handleClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
              <HiOutlineKey size={16} style={{ marginRight: 6 }} />
              Đặt Lại Mật Khẩu
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PasswordResetModal;
