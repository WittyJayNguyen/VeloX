import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineXMark, HiOutlineCheckCircle, HiOutlineDocumentDuplicate, HiOutlineSparkles } from 'react-icons/hi2';
import { useAuthStore } from '@modules/auth/states/authStore';
import styles from './TopupModal.module.scss';

interface TopupOption {
  id: string;
  priceVnd: number;
  credits: number;
  bonusPercent: number;
  label: string;
  popular?: boolean;
}

const TOPUP_OPTIONS: TopupOption[] = [
  { id: 't50', priceVnd: 50000, credits: 500, bonusPercent: 0, label: 'Cơ bản' },
  { id: 't100', priceVnd: 100000, credits: 1100, bonusPercent: 10, label: 'Phổ biến', popular: true },
  { id: 't200', priceVnd: 200000, credits: 2400, bonusPercent: 20, label: 'Tiết kiệm' },
  { id: 't500', priceVnd: 500000, credits: 6500, bonusPercent: 30, label: 'Ưu đãi cao' },
  { id: 't1000', priceVnd: 1000000, credits: 14000, bonusPercent: 40, label: 'VIP Doanh nghiệp' },
];

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, addCredits } = useAuthStore();
  const [selectedOption, setSelectedOption] = useState<TopupOption>(TOPUP_OPTIONS[1]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const bankName = 'MB BANK (Ngân hàng Quân Đội)';
  const accountNumber = '0988776655';
  const accountHolder = 'VELOX AI GATEWAY';
  const transferContent = `VELOX ${user?.id ? user.id.slice(-6).toUpperCase() : 'VIP888'}`;

  // VietQR URL
  const qrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?amount=${selectedOption.priceVnd}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPaid = () => {
    setProcessing(true);
    setTimeout(() => {
      addCredits(selectedOption.credits);
      // Lưu lại đơn hàng đã mua vào localStorage
      const prevOrders = JSON.parse(localStorage.getItem('velox_user_orders') || '[]');
      const newOrder = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        packageName: `Nạp ${selectedOption.credits.toLocaleString()} Credit`,
        amount: selectedOption.priceVnd,
        credits: selectedOption.credits,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        paymentMethod: 'VietQR Banking',
      };
      localStorage.setItem('velox_user_orders', JSON.stringify([newOrder, ...prevOrders]));

      setProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2200);
    }, 1200);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.diamondIcon}>💎</div>
            <div>
              <h3>{t('topup.title', 'Nạp Credit Tài Khoản')}</h3>
              <p className={styles.balanceInfo}>
                {t('topup.current_balance', 'Số dư hiện tại')}: <strong>{user?.credit_balance ?? 991} credit</strong>
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <HiOutlineXMark size={22} />
          </button>
        </div>

        {isSuccess ? (
          <div className={styles.successState}>
            <HiOutlineCheckCircle size={64} className={styles.successIcon} />
            <h4>{t('topup.success_title', 'Nạp Tiền Thành Công!')}</h4>
            <p>
              {t('topup.success_desc', 'Tài khoản của bạn đã được cộng')}{' '}
              <span className={styles.creditedAmount}>+{selectedOption.credits.toLocaleString()} credit</span>.
            </p>
          </div>
        ) : (
          <div className={styles.body}>
            {/* Packages selector */}
            <div className={styles.sectionLabel}>{t('topup.choose_package', '1. Chọn Mức Nạp Credit')}</div>
            <div className={styles.optionsGrid}>
              {TOPUP_OPTIONS.map((opt) => {
                const isSelected = selectedOption.id === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedOption(opt)}
                  >
                    {opt.popular && (
                      <span className={styles.popularBadge}>
                        <HiOutlineSparkles size={11} /> HOT
                      </span>
                    )}
                    <div className={styles.optionCredits}>
                      💎 {opt.credits.toLocaleString()} <span className={styles.crUnit}>credit</span>
                    </div>
                    <div className={styles.optionPrice}>{opt.priceVnd.toLocaleString()} đ</div>
                    {opt.bonusPercent > 0 && (
                      <span className={styles.bonusBadge}>+{opt.bonusPercent}% Thưởng</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Payment Section */}
            <div className={styles.sectionLabel}>{t('topup.payment_info', '2. Quét Mã VietQR Chuyển Khoản')}</div>
            <div className={styles.paymentBox}>
              <div className={styles.qrCol}>
                <div className={styles.qrFrame}>
                  <img src={qrUrl} alt="VietQR Banking Code" className={styles.qrImg} />
                </div>
                <span className={styles.qrHint}>{t('topup.qr_hint', 'Mở ứng dụng ngân hàng quét mã')}</span>
              </div>

              <div className={styles.infoCol}>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>{t('topup.bank', 'Ngân hàng')}:</span>
                  <span className={styles.infoVal}>{bankName}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>{t('topup.account_no', 'Số tài khoản')}:</span>
                  <div className={styles.valWithCopy}>
                    <strong>{accountNumber}</strong>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy(accountNumber, 'acc')}
                      title="Sao chép"
                    >
                      <HiOutlineDocumentDuplicate size={16} />
                      {copiedField === 'acc' ? t('topup.copied', 'Đã chép') : t('topup.copy', 'Chép')}
                    </button>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>{t('topup.account_name', 'Chủ thụ hưởng')}:</span>
                  <span className={styles.infoVal}>{accountHolder}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>{t('topup.amount', 'Số tiền')}:</span>
                  <span className={styles.amountHighlight}>
                    {selectedOption.priceVnd.toLocaleString()} VNĐ
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>{t('topup.memo', 'Nội dung CK')}:</span>
                  <div className={styles.valWithCopy}>
                    <span className={styles.memoHighlight}>{transferContent}</span>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => handleCopy(transferContent, 'memo')}
                      title="Sao chép"
                    >
                      <HiOutlineDocumentDuplicate size={16} />
                      {copiedField === 'memo' ? t('topup.copied', 'Đã chép') : t('topup.copy', 'Chép')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirmPaid}
                disabled={processing}
              >
                {processing ? t('topup.checking', 'Đang xác thực hệ thống...') : t('topup.confirm_paid', 'Tôi Đã Chuyển Khoản Xong')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopupModal;
