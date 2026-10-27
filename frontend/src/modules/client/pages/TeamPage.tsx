import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineUserGroup, HiOutlineUserPlus, HiOutlineCheckCircle } from 'react-icons/hi2';
import styles from '@assets/scss/client/client-pages.module.scss';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Trưởng nhóm' | 'Quản trị' | 'Thành viên';
  creditsAllocated: number;
  status: 'Hoạt động' | 'Chờ xác nhận';
}

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Hải源海', email: 'haiyuanhai9@gmail.com', role: 'Trưởng nhóm', creditsAllocated: 5000, status: 'Hoạt động' },
  { id: 'm2', name: 'Nguyễn Văn Long', email: 'long.nv@company.ai', role: 'Quản trị', creditsAllocated: 1500, status: 'Hoạt động' },
  { id: 'm3', name: 'Trần Thị Mai', email: 'mai.tt@company.ai', role: 'Thành viên', creditsAllocated: 800, status: 'Hoạt động' },
];

export const TeamPage: React.FC = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Thành viên' | 'Quản trị'>('Thành viên');
  const [toast, setToast] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newM: Member = {
      id: `m_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      creditsAllocated: 500,
      status: 'Chờ xác nhận',
    };

    setMembers([...members, newM]);
    setInviteEmail('');
    setToast(t('team.invited_success', 'Đã gửi lời mời tham gia nhóm tới email!'));
    setTimeout(() => setToast(null), 3000);
  };

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
            <div className={styles.statValue}>{members.length} / 10</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox}>💎</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>{t('team.pooled_credit', 'Quỹ Credit Nhóm')}</div>
            <div className={styles.statValue}>7,300</div>
          </div>
        </div>
      </div>

      {/* Invite Member */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>
          <HiOutlineUserPlus /> {t('team.invite_title', 'Mời Thành Viên Mới')}
        </h3>

        <form onSubmit={handleInvite}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t('team.email_label', 'Email thành viên')}</label>
              <input
                type="email"
                placeholder="colleague@company.com"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
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
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.primaryBtn}>
              <HiOutlineUserGroup /> {t('team.send_invite', 'Gửi Lời Mời')}
            </button>
          </div>
        </form>
      </div>

      {/* Member List */}
      <div className={styles.contentCard}>
        <h3 className={styles.cardTitle}>{t('team.list_title', 'Danh Sách Thành Viên')}</h3>
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Thành Viên</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Hạn Mức Credit</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td>💎 {m.creditsAllocated.toLocaleString()}</td>
                  <td>
                    <span className={m.status === 'Hoạt động' ? styles.badgeSuccess : styles.badgeWarning}>
                      {m.status}
                    </span>
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
