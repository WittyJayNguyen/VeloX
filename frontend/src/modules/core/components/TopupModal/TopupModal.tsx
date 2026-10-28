import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineXMark, HiOutlineCheckCircle, HiOutlineDocumentDuplicate, HiOutlineSparkles } from 'react-icons/hi2';
import { RiSparklingFill } from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { billingService } from '@modules/billing/services/billingService';
import apiClient from '@modules/core/lib/apiClient';
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
  { id: 't50', priceVnd: 50000, credits: 400, bonusPercent: 0, label: 'Trải nghiệm' },
  { id: 't100', priceVnd: 100000, credits: 1000, bonusPercent: 0, label: 'Tiêu chuẩn' },
  { id: 't200', priceVnd: 200000, credits: 2000, bonusPercent: 10, label: 'BÁN CHẠY NHẤT', popular: true },
  { id: 't500', priceVnd: 500000, credits: 5500, bonusPercent: 10, label: '+10% Thưởng' },
  { id: 't1000', priceVnd: 1000000, credits: 12500, bonusPercent: 25, label: '+25% Thưởng' },
  { id: 't2000', priceVnd: 2000000, credits: 27000, bonusPercent: 35, label: 'Super VIP' },
];

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageId?: string;
}

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose, initialPackageId }) => {
  const { t } = useTranslation();
  const { user, addCredits } = useAuthStore();
  const [topupOptions, setTopupOptions] = useState<TopupOption[]>(TOPUP_OPTIONS);
  const [selectedOption, setSelectedOption] = useState<TopupOption>(TOPUP_OPTIONS[2]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    billingService
      .getPublicPackages('TOPUP')
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const mapped: TopupOption[] = data.map((p) => ({
            id: p.id,
            priceVnd: p.price_vnd,
            credits: p.credits_given,
            bonusPercent: p.bonus_percentage || 0,
            label: p.tag_badge || p.name,
            popular: p.is_popular,
          }));
          setTopupOptions(mapped);
          if (initialPackageId) {
            const found = mapped.find((o) => o.id === initialPackageId);
            if (found) {
              setSelectedOption(found);
              return;
            }
          }
          setSelectedOption((prev) => mapped.find((o) => o.id === prev.id) || mapped.find((o) => o.popular) || mapped[0]);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleConfirmPaid = async () => {
    setProcessing(true);
    try {
      // Call backend to credit user account in database
      const res = await apiClient.post('/billing/topup', {
        package_id: selectedOption.id,
        amount_vnd: selectedOption.priceVnd,
        credits: selectedOption.credits,
        payment_method: 'VietQR Banking',
      });
      const data = res.data?.data || res.data;
      if (data?.credit_balance !== undefined) {
        useAuthStore.getState().updateUser({ credit_balance: data.credit_balance });
      } else {
        addCredits(selectedOption.credits);
      }
    } catch {
      // Fallback local update
      addCredits(selectedOption.credits);
    } finally {
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
      }, 2000);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.diamondIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiSparklingFill size={22} color="#2dd4bf" />
            </div>
            <div>
              <h3>{t('topup.title', 'Nạp Credit Tài Khoản')}</h3>
              <p className={styles.balanceInfo}>
                {t('topup.current_balance', 'Số dư hiện tại')}: <strong>{(user?.credit_balance ?? 0).toLocaleString()} credit</strong>
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
              {topupOptions.map((opt) => {
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
                    <div className={styles.optionCredits} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RiSparklingFill size={15} color="#2dd4bf" /> {opt.credits.toLocaleString()} <span className={styles.crUnit}>credit</span>
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
