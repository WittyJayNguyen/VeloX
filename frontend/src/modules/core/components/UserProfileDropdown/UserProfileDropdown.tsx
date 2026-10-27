import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@modules/auth/states/authStore';
import { SUPPORTED_LANGUAGES } from '@modules/core/utils/constants';
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
} from 'react-icons/hi2';
import { RiSparklingFill } from 'react-icons/ri';
import styles from './UserProfileDropdown.module.scss';

interface UserProfileDropdownProps {
  onOpenTopup: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onOpenTopup }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout, addCredits } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setToastMsg(t('menu.already_checked_in', 'Hôm nay bạn đã điểm danh rồi!'));
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    addCredits(50);
    localStorage.setItem(key, todayStr);
    setCheckedInToday(true);
    setToastMsg(t('menu.checkin_success', 'Điểm danh thành công! +50 credit'));
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

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {/* Avatar Trigger Button */}
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
            <span className={styles.avatarFallback}>🦎</span>
          )}
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
                <span className={styles.headerEmoji}>🦎</span>
              )}
            </div>
            <div className={styles.headerDetails}>
              <div className={styles.nameRow}>
                <span className={styles.userName}>{user?.full_name || 'Hải源海'}</span>
                <span className={styles.tierBadge}>⭐ {user?.tier || 'Free'}</span>
              </div>
              <span className={styles.userEmail}>{user?.email || 'haiyuanhai9@gmail.com'}</span>
            </div>
            <HiOutlineChevronRight className={styles.chevronIcon} />
          </div>

          {/* Credit & Topup Card */}
          <div className={styles.creditCard}>
            <div className={styles.creditLeft}>
              <span className={styles.diamond} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <RiSparklingFill color="#2dd4bf" size={16} />
              </span>
              <span className={styles.creditAmount}>{user?.credit_balance ?? 991}</span>
              <span className={styles.creditUnit}>credit</span>
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

          {/* Attendance Action */}
          <div
            className={`${styles.attendanceRow} ${checkedInToday ? styles.attended : ''}`}
            onClick={handleAttendance}
          >
            <div className={styles.attendanceLeft}>
              <span className={styles.calendarIcon}>📅</span>
              <span className={styles.attendanceText}>
                {checkedInToday
                  ? t('menu.checkin_done', 'Đã điểm danh hôm nay')
                  : t('menu.checkin_today', 'Điểm danh hôm nay')}
              </span>
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

          {/* SECTION: KIẾM TIỀN */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_earning', 'KIẾM TIỀN')}</div>
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

          {/* SECTION: NÂNG CAO */}
          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>{t('menu.section_advanced', 'NÂNG CAO')}</div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/developer')}>
              <HiOutlineCommandLine className={styles.itemIcon} />
              <span>{t('client_menu.developer', 'API & MCP')}</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleNavigate('/downloads')}>
              <HiOutlineArrowDownTray className={styles.itemIcon} />
              <span>{t('client_menu.downloads', 'Phần mềm PC')}</span>
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
              <span className={styles.langLabel}>{t('menu.language', 'Ngôn ngữ')}</span>
              <select
                className={styles.langSelect}
                value={currentLang.code}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
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
