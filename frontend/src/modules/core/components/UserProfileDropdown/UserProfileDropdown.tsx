import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineShoppingBag,
  HiOutlineChevronRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCommandLine,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineGift,
  HiOutlineCog6Tooth,
  HiOutlineBolt,
} from 'react-icons/hi2';
import styles from './UserProfileDropdown.module.scss';

interface UserProfileDropdownProps {
  onOpenTopup: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onOpenTopup }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout, addCredits } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute User Initials for clean modern Avatar
  const getUserInitials = (name?: string) => {
    if (!name) return 'VX';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = getUserInitials(user?.full_name);

  // Check attendance status today
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckin = localStorage.getItem(`velox_checkin_${user?.id || 'guest'}`);
    if (lastCheckin === todayStr) {
      setCheckedInToday(true);
    }
  }, [user?.id]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAttendance = (e: React.MouseEvent) => {
    e.stopPropagation();
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `velox_checkin_${user?.id || 'guest'}`;
    const lastCheckin = localStorage.getItem(key);

    if (lastCheckin === todayStr) {
      setToastMsg(t('menu.already_checked_in', 'Bạn đã nhận phần thưởng hôm nay rồi!'));
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    addCredits(50);
    localStorage.setItem(key, todayStr);
    setCheckedInToday(true);
    setToastMsg(t('menu.checkin_success', 'Nhận thưởng thành công! +50 Credits'));
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {/* Avatar Trigger Button with VeloX Signature Initials */}
      <button
        type="button"
        className={styles.avatarTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.avatarCircle}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials}>{userInitials}</span>
          )}
          <span className={styles.statusDot} />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className={styles.popover}>
          {toastMsg && <div className={styles.toastNotice}>{toastMsg}</div>}

          {/* User Info Header */}
          <div className={styles.userHeader} onClick={() => handleNavigate('/profile')}>
            <div className={styles.headerAvatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className={styles.avatarImg} />
              ) : (
                <span className={styles.headerInitials}>{userInitials}</span>
              )}
            </div>
            <div className={styles.headerDetails}>
              <div className={styles.nameRow}>
                <span className={styles.userName}>{user?.full_name || 'Admin VeloX'}</span>
                <span className={styles.tierBadge}>{user?.tier?.toUpperCase() || 'PRO'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={styles.userEmail}>{user?.email || 'admin@velox.ai'}</span>
                {(user?.user_code || user?.id) && (
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    #{user?.user_code || user?.id.replace(/-/g, '').slice(-6).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <HiOutlineChevronRight className={styles.chevronIcon} />
          </div>

          {/* VeloX Energy & Credit Balance Card */}
          <div className={styles.creditCard}>
            <div className={styles.creditLeft}>
              <div className={styles.boltIconBox}>
                <HiOutlineBolt size={18} color="#ff6b35" />
              </div>
              <div className={styles.balanceInfo}>
                <div className={styles.creditAmount}>
                  {(user?.credit_balance ?? 0).toLocaleString()}
                </div>
                <div className={styles.creditUnit}>Credits khả dụng</div>
              </div>
            </div>
            <button
              type="button"
              className={styles.topupBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTopup();
                setIsOpen(false);
              }}
            >
              {t('menu.topup_now', 'Nạp')}
            </button>
          </div>

          {/* Daily VeloX Reward */}
          <div
            className={`${styles.attendanceRow} ${checkedInToday ? styles.attended : ''}`}
            onClick={handleAttendance}
          >
            <div className={styles.attendanceLeft}>
              <div className={styles.rewardIconBox}>
                <HiOutlineGift size={16} color="#fbbf24" />
              </div>
              <div className={styles.rewardTextBox}>
                <span className={styles.attendanceText}>
                  {checkedInToday
                    ? t('menu.checkin_done', 'Đã nhận thưởng hôm nay')
                    : t('menu.checkin_today', 'Nhận Thưởng Hằng Ngày')}
                </span>
                {!checkedInToday && <span className={styles.bonusTag}>+50 cr</span>}
              </div>
            </div>
            <HiOutlineChevronRight className={styles.chevronIconSmall} />
          </div>

          <div className={styles.divider} />

          {/* SECTION: TÀI KHOẢN */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_account', 'TÀI KHOẢN')}</div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/profile')}>
              <HiOutlineUser className={styles.itemIcon} />
              <span>{t('client_menu.profile', 'Hồ sơ & cài đặt')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/security')}>
              <HiOutlineShieldCheck className={styles.itemIcon} />
              <span>{t('client_menu.security', 'Bảo mật & 2FA')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/team')}>
              <HiOutlineUserGroup className={styles.itemIcon} />
              <span>{t('client_menu.team', 'Nhóm của bạn')}</span>
            </div>
          </div>

          {/* SECTION: GÓI & THANH TOÁN */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_billing', 'GÓI & THANH TOÁN')}</div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/subscription')}>
              <HiOutlineCreditCard className={styles.itemIcon} />
              <span className={styles.flexItem}>{t('client_menu.subscription', 'Quản lý gói')}</span>
              <span className={styles.itemBadgeGray}>{user?.tier || 'Free'}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/history')}>
              <HiOutlineClock className={styles.itemIcon} />
              <span>{t('client_menu.history', 'Lịch sử sử dụng')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/orders')}>
              <HiOutlineShoppingBag className={styles.itemIcon} />
              <span>{t('client_menu.orders', 'Đơn đã mua')}</span>
            </div>
          </div>

          {/* SECTION: ĐỐI TÁC & KIẾM TIỀN */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_earning', 'ĐỐI TÁC & KIẾM TIỀN')}</div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/workflows')}>
              <HiOutlineSparkles className={styles.itemIcon} />
              <span>{t('client_menu.workflows', 'Workflow của tôi')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/creator-sales')}>
              <HiOutlineChartBar className={styles.itemIcon} />
              <span>{t('client_menu.sales', 'Bảng bán hàng')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/referral')}>
              <HiOutlineGift className={styles.itemIcon} />
              <span>{t('client_menu.referral', 'Giới thiệu bạn bè')}</span>
            </div>
          </div>

          {/* SECTION: DÀNH CHO DEVELOPER */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_advanced', 'DÀNH CHO DEVELOPER')}</div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/developer')}>
              <HiOutlineCommandLine className={styles.itemIcon} />
              <span>{t('client_menu.developer', 'API & MCP')}</span>
            </div>
            <div
              className={styles.menuItem}
              style={{ opacity: 0.55, cursor: 'not-allowed', filter: 'grayscale(0.5)' }}
              title="Tính năng Phần mềm PC đang phát triển và tạm thời vô hiệu hóa"
              onClick={() => handleNavigate('/downloads')}
            >
              <HiOutlineArrowDownTray className={styles.itemIcon} />
              <span className={styles.flexItem}>{t('client_menu.downloads', 'Phần mềm PC')}</span>
              <span className={styles.itemBadgeGray} style={{ fontSize: '0.68rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                {t('common.disabled', 'Tạm khóa')}
              </span>
            </div>
          </div>

          {/* SUPER ADMIN LINK (ONLY IF SUPER ADMIN) */}
          {isSuperAdmin && (
            <div className={styles.superAdminSection}>
              <div
                className={styles.superAdminItem}
                onClick={() => handleNavigate('/admin')}
              >
                <HiOutlineCog6Tooth className={styles.superAdminIcon} />
                <span className={styles.superAdminText}>
                  {t('menu.super_admin_panel', 'Bảng Quản Trị Super Admin')}
                </span>
                <span className={styles.superAdminTag}>ROOT</span>
              </div>
            </div>
          )}

          <div className={styles.divider} />

          {/* DROPDOWN FOOTER */}
          <div className={styles.footerRow}>
            <div className={styles.langSelector}>
              <span className={styles.langLabel}>Tiếng Việt 🇻🇳</span>
            </div>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              <HiOutlineArrowRightOnRectangle size={16} />
              <span>{t('nav.logout', 'Đăng xuất')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
