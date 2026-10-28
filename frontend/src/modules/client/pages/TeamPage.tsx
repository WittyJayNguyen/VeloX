import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUserGroup,
  HiOutlineUserPlus,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import styles from '@assets/scss/client/client-pages.module.scss';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Trưởng nhóm' | 'Quản trị' | 'Thành viên';
  creditsAllocated: number;
  status: 'Hoạt động' | 'Chờ xác nhận';
  isOwner?: boolean;
}

export const TeamPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Thành viên' | 'Quản trị'>('Thành viên');
  const [inviteCredit, setInviteCredit] = useState(500);
  const [toast, setToast] = useState<string | null>(null);

  const storageKey = `velox_team_members_${user?.id || 'default'}`;

  useEffect(() => {
    const ownerName = user?.full_name || user?.email?.split('@')[0] || 'Trưởng nhóm';
    const ownerEmail = user?.email || 'owner@velox.ai';
    const ownerMember: Member = {
      id: 'owner',
      name: `${ownerName} (Bạn)`,
      email: ownerEmail,
      role: 'Trưởng nhóm',
      creditsAllocated: user?.credit_balance ?? 1000,
      status: 'Hoạt động',
      isOwner: true,
    };

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: Member[] = JSON.parse(saved);
        // Replace or prepend owner
        const others = parsed.filter((m) => !m.isOwner);
        setMembers([ownerMember, ...others]);
        return;
      } catch {
        // Fallback
      }
    }
    setMembers([ownerMember]);
  }, [user?.id, user?.full_name, user?.email, user?.credit_balance]);

  const saveMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    localStorage.setItem(storageKey, JSON.stringify(newMembers));
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (members.some((m) => m.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      alert('Thành viên này đã có trong danh sách nhóm!');
      return;
    }

    const newM: Member = {
      id: `m_${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      creditsAllocated: Number(inviteCredit) || 500,
      status: 'Chờ xác nhận',
      isOwner: false,
    };

    const updated = [...members, newM];
    saveMembers(updated);
    setInviteEmail('');
    setInviteName('');
    setInviteCredit(500);
    setToast(t('team.invited_success', `Đã gửi lời mời tham gia nhóm tới ${newM.email}!`));
    setTimeout(() => setToast(null), 3500);
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thành viên "${name}" khỏi không gian làm việc?`)) {
      return;
    }
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
    setToast(`Đã xóa thành viên "${name}" khỏi nhóm.`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditCredit = (m: Member) => {
    const current = m.creditsAllocated;
    const newVal = window.prompt(`Nhập hạn mức Credit mới cho "${m.name}":`, String(current));
    if (newVal === null) return;
    const num = parseInt(newVal, 10);
    if (isNaN(num) || num < 0) {
      alert('Vui lòng nhập số credit hợp lệ.');
      return;
    }
    const updated = members.map((item) => (item.id === m.id ? { ...item, creditsAllocated: num } : item));
    saveMembers(updated);
    setToast(`Đã cập nhật hạn mức credit cho ${m.name} thành ${num.toLocaleString()} 💎`);
    setTimeout(() => setToast(null), 3000);
  };

  const totalPooledCredit = (user?.credit_balance ?? 0) +
    members.filter((m) => !m.isOwner).reduce((acc, cur) => acc + cur.creditsAllocated, 0);

  return (
    <div className={styles.clientContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.pageIcon}>👥</span>
            {t('client_menu.team', 'Nhóm Của Bạn')}
          </h1>
          <p>{t('team.subtitle', 'Cộng tác làm việc, chia sẻ hạn ngạch Credit và quản lý quyền truy cập không gian làm việc')}</p>
        </div>
      </div>

      {toast && (
        <div className={styles.alertBox}>
          <HiOutlineCheckCircle size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('team.total_members', 'Tổng Thành Viên')}</div>
            <div className={styles.statValue}>{members.length} / 15</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('team.pooled_credit', 'Quỹ Credit Nhóm')}</div>
            <div className={styles.statValue}>{totalPooledCredit.toLocaleString()} 💎</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>⚡</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Gói Không Gian Làm Việc</div>
            <div className={styles.statValue} style={{ color: '#38bdf8' }}>Team Pro</div>
          </div>
        </div>
      </div>

      {/* Invite Member */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineUserPlus /> {t('team.invite_title', 'Mời Thành Viên Mới')}
        </h3>

        <form onSubmit={handleInvite}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className={styles.formGroup}>
              <label>{t('team.email_label', 'Email thành viên *')}</label>
              <input
                type="email"
                placeholder="colleague@company.com"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('team.role_label', 'Vai trò')}</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'Thành viên' | 'Quản trị')}
              >
                <option value="Thành viên">Thành viên (Member)</option>
                <option value="Quản trị">Quản trị viên nhóm (Team Admin)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Hạn mức Credit cấp phát</label>
              <input
                type="number"
                min={0}
                max={50000}
                value={inviteCredit}
                onChange={(e) => setInviteCredit(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.primaryBtn}>
              <HiOutlineUserGroup /> {t('team.send_invite', 'Gửi Lời Mời Gia Nhập')}
            </button>
          </div>
        </form>
      </div>

      {/* Member List */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>{t('team.list_title', 'Danh Sách Thành Viên Không Gian')}</h3>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Thành Viên</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Hạn Mức Credit</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: m.isOwner ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' : '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#fff',
                        }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{m.name}</strong>
                        {m.isOwner && (
                          <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'rgba(255, 107, 53, 0.2)', color: '#ff6b35', padding: '1px 6px', borderRadius: '4px' }}>
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{m.email}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {m.role === 'Trưởng nhóm' && <HiOutlineShieldCheck style={{ color: '#ff6b35' }} />}
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>💎 {m.creditsAllocated.toLocaleString()}</span>
                  </td>
                  <td>
                    <span className={m.status === 'Hoạt động' ? styles.badgeSuccess : styles.badgeWarning}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!m.isOwner ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditCredit(m)}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#94a3b8',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Sửa hạn mức credit"
                        >
                          <HiOutlinePencilSquare /> Hạn Mức
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Xóa thành viên"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Mặc định</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
