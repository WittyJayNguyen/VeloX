import React, { useState, useEffect } from 'react';
import { Modal } from '@modules/core/design-system/Modal';
import { Input } from '@modules/core/design-system/Input';
import { Select } from '@modules/core/design-system/Select';
import Button from '@modules/core/design-system/Button';
import { userManagementService, type UserDto, type RoleDto } from '../services/userManagementService';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  editingUser: UserDto | null;
  roles: RoleDto[];
  onSuccess: () => void;
  setStatusMessage: (msg: { type: 'success' | 'error'; text: string }) => void;
  onUserCreatedWithPassword?: (user: UserDto, tempPass: string) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  onClose,
  editingUser,
  roles,
  onSuccess,
  setStatusMessage,
  onUserCreatedWithPassword,
}) => {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('ROLE_USER');
  const [formTier, setFormTier] = useState('FREE');
  const [formInitialCredit, setFormInitialCredit] = useState(50000);
  const [formPassword, setFormPassword] = useState('');
  const [formAutoPassword, setFormAutoPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormName(editingUser.fullName);
      setFormEmail(editingUser.email);
      setFormRole(editingUser.role);
      setFormTier(editingUser.tier || 'FREE');
    } else {
      setFormName('');
      setFormEmail('');
      setFormRole('ROLE_USER');
      setFormTier('FREE');
      setFormInitialCredit(50000);
      setFormPassword('');
      setFormAutoPassword(true);
    }
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formName.trim() || !formEmail.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userManagementService.updateUser(editingUser.id, {
          full_name: formName.trim(),
          email: formEmail.trim(),
          role_id: formRole,
          tier: formTier,
          is_active: editingUser.isActive,
        });
        setStatusMessage({
          type: 'success',
          text: `Đã cập nhật thông tin thành viên ${formName.trim()} thành công`,
        });
      } else {
        const res = await userManagementService.createUser({
          full_name: formName.trim(),
          email: formEmail.trim(),
          role_id: formRole,
          tier: formTier,
          credit_balance: Number(formInitialCredit),
          password: formAutoPassword ? undefined : formPassword,
        });

        if (res.generated_password && onUserCreatedWithPassword) {
          onUserCreatedWithPassword(
            {
              id: res.id,
              fullName: formName,
              email: formEmail,
              role: formRole,
              creditBalance: formInitialCredit,
              isActive: true,
              registeredDate: '',
            },
            res.generated_password
          );
        }
        setStatusMessage({
          type: 'success',
          text: `Tạo tài khoản ${formEmail.trim()} thành công`,
        });
      }
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu người dùng';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingUser ? `Chỉnh Sửa: ${editingUser.fullName}` : 'Thêm Người Dùng Mới'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Họ và Tên"
          value={formName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
          placeholder="VD: Nguyễn Văn A"
          required
        />

        <Input
          label="Địa Chỉ Email"
          type="email"
          value={formEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <div>
          <label style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Vai Trò Phân Quyền (RBAC Role)
          </label>
          <Select
            options={roles.map((r) => ({ value: r.code, label: `${r.name} (${r.code})` }))}
            value={formRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormRole(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Gói Hội Viên (Tier)
          </label>
          <Select
            options={[
              { value: 'FREE', label: 'FREE (Cơ bản)' },
              { value: 'PRO', label: 'PRO (Chuyên nghiệp)' },
              { value: 'ENTERPRISE', label: 'ENTERPRISE (Doanh nghiệp)' },
            ]}
            value={formTier}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormTier(e.target.value)}
          />
        </div>

        {!editingUser && (
          <>
            <Input
              label="Số Dư Khởi Tạo (Credits)"
              type="number"
              value={formInitialCredit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormInitialCredit(Number(e.target.value))}
              min={0}
            />

            <div style={{
              padding: '10px 14px',
              background: '#121214',
              borderRadius: 8,
              border: '1px solid #27272a',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', color: '#fafafa' }}>
                <input
                  type="checkbox"
                  checked={formAutoPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormAutoPassword(e.target.checked)}
                />
                <span>Tự động tạo mật khẩu ngẫu nhiên an toàn (14 ký tự độ phức tạp cao)</span>
              </label>

              {!formAutoPassword && (
                <div style={{ marginTop: 10 }}>
                  <Input
                    label="Mật Khẩu Tùy Chọn"
                    type="password"
                    value={formPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt"
                    required={!formAutoPassword}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
