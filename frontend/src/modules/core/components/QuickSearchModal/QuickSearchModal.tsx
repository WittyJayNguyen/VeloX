import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineShoppingBag,
  HiOutlineShare,
  HiOutlineCommandLine,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import styles from './QuickSearchModal.module.scss';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ReactNode;
  shortcut?: string;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: SearchItem[] = [
    { id: 'profile', title: t('client_menu.profile', 'Hồ sơ & cài đặt'), category: 'Tài Khoản', path: '/profile', icon: <HiOutlineUser /> },
    { id: 'security', title: t('client_menu.security', 'Bảo mật & 2FA'), category: 'Tài Khoản', path: '/security', icon: <HiOutlineShieldCheck /> },
    { id: 'team', title: t('client_menu.team', 'Nhóm của bạn'), category: 'Tài Khoản', path: '/team', icon: <HiOutlineUserGroup /> },
    { id: 'subscription', title: t('client_menu.subscription', 'Quản lý gói'), category: 'Gói & Thanh Toán', path: '/subscription', icon: <HiOutlineCreditCard /> },
    { id: 'history', title: t('client_menu.history', 'Lịch sử sử dụng'), category: 'Gói & Thanh Toán', path: '/history', icon: <HiOutlineClock /> },
    { id: 'orders', title: t('client_menu.orders', 'Đơn đã mua'), category: 'Gói & Thanh Toán', path: '/orders', icon: <HiOutlineShoppingBag /> },
    { id: 'workflows', title: t('client_menu.workflows', 'Workflow của tôi'), category: 'Kiếm Tiền', path: '/workflows', icon: <HiOutlineSparkles /> },
    { id: 'creator-sales', title: t('client_menu.sales', 'Bảng bán hàng'), category: 'Kiếm Tiền', path: '/creator-sales', icon: <HiOutlineSparkles /> },
    { id: 'referral', title: t('client_menu.referral', 'Giới thiệu bạn bè'), category: 'Kiếm Tiền', path: '/referral', icon: <HiOutlineShare /> },
    { id: 'developer', title: t('client_menu.developer', 'API & MCP'), category: 'Nâng Cao', path: '/developer', icon: <HiOutlineCommandLine /> },
    { id: 'downloads', title: t('client_menu.downloads', 'Phần mềm PC'), category: 'Nâng Cao', path: '/downloads', icon: <HiOutlineArrowDownTray /> },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.path.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchBar}>
          <HiOutlineMagnifyingGlass size={20} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('search.placeholder', 'Tìm nhanh tính năng, trang, cài đặt... (Ctrl+K)')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className={styles.escKey}>ESC</span>
        </div>

        <div className={styles.resultsList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyNotice}>
              {t('search.empty', 'Không tìm thấy kết quả phù hợp.')}
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className={`${styles.itemRow} ${idx === selectedIndex ? styles.activeRow : ''}`}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className={styles.itemIcon}>{item.icon}</div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemCategory}>{item.category}</div>
                </div>
                <span className={styles.itemPath}>{item.path}</span>
              </div>
            ))
          )}
        </div>

        <div className={styles.footerHints}>
          <span>↑↓ {t('search.hint_navigate', 'Di chuyển')}</span>
          <span>↵ {t('search.hint_select', 'Chọn')}</span>
          <span>ESC {t('search.hint_close', 'Đóng')}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;
