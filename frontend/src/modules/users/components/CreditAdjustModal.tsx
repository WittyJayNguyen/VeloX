import React, { useState, useEffect } from 'react';
import { Modal } from '@modules/core/design-system/Modal';
import { Input } from '@modules/core/design-system/Input';
import Button from '@modules/core/design-system/Button';
import { userManagementService, type UserDto } from '../services/userManagementService';

interface CreditAdjustModalProps {
  open: boolean;
  onClose: () => void;
  targetUser: UserDto | null;
  onSuccess: () => void;
  setStatusMessage: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export const CreditAdjustModal: React.FC<CreditAdjustModalProps> = ({
  open,
  onClose,
  targetUser,
  onSuccess,
  setStatusMessage,
}) => {
  const [creditDelta, setCreditDelta] = useState(50000);
  const [creditReason, setCreditReason] = useState('Cộng credit khuyến mãi / hỗ trợ khách hàng');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCreditDelta(50000);
      setCreditReason('Cộng credit khuyến mãi / hỗ trợ khách hàng');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !targetUser) return;
    if (!creditReason.trim() || creditReason.trim().length < 5) {
      alert('Vui lòng nhập lý do điều chỉnh credit tối thiểu 5 ký tự để ghi nhận vào sổ kiểm toán');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await userManagementService.adjustCredit(targetUser.id, Number(creditDelta), creditReason.trim());
      onClose();
      setStatusMessage({
        type: 'success',
        text: `Đã điều chỉnh credit cho ${targetUser.fullName}: ${creditDelta > 0 ? '+' : ''}${creditDelta.toLocaleString()} Credits (Số dư mới: ${res.credit_balance.toLocaleString()} Credits)`,
      });
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể điều chỉnh credit';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Điều Chỉnh Tín Dụng: ${targetUser?.fullName || ''}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: '10px 14px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 8,
          fontSize: '0.84rem',
          color: '#c7d2fe',
        }}>
          Số dư hiện tại: <strong style={{ color: '#10b981' }}>{(targetUser?.creditBalance || 0).toLocaleString()} Credits</strong>
        </div>

        <Input
          label="Số Credit Điều Chỉnh (+ cộng thêm, - trừ bớt)"
          type="number"
          value={creditDelta}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditDelta(Number(e.target.value))}
          required
        />

        <div>
          <label style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Lý Do Điều Chỉnh (Bắt buộc cho sổ kiểm toán kế toán)
          </label>
          <input
            type="text"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            placeholder="Ví dụ: Bồi thường SLA 1 giờ downtime hoặc nạp tiền thủ công qua ngân hàng"
            required
            minLength={5}
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
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Xác Nhận Điều Chỉnh
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreditAdjustModal;
