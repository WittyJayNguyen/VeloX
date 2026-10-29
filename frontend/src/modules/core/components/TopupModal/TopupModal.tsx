import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineDocumentDuplicate,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineBolt,
} from 'react-icons/hi2';
import { RiSparklingFill } from 'react-icons/ri';
import { useAuthStore } from '@modules/auth/states/authStore';
import { billingService } from '@modules/billing/services/billingService';
import apiClient from '@modules/core/lib/apiClient';
import styles from './TopupModal.module.scss';

interface TopupOption {
  id: string;
  name: string;
  category: string;
  priceVnd: number;
  credits: number;
  bonusPercent: number;
  label: string;
  tagBadge?: string;
  durationDays?: number;
  popular?: boolean;
}

const TOPUP_OPTIONS: TopupOption[] = [
  // Gói Thuê Bao Tháng (30 Ngày)
  { id: 'sub-starter', name: 'Creator Standard', category: 'STARTER', priceVnd: 189000, credits: 2000, bonusPercent: 0, label: 'Creator Standard', durationDays: 30 },
  { id: 'sub-pro', name: 'Pro Studio', category: 'PRO', priceVnd: 489000, credits: 5500, bonusPercent: 10, label: 'Pro Studio', popular: true, durationDays: 30 },
  { id: 'sub-business', name: 'Business & Agency', category: 'ENTERPRISE', priceVnd: 1290000, credits: 15000, bonusPercent: 15, label: 'Business & Agency', durationDays: 30 },
  { id: 'sub-enterprise', name: 'Enterprise Scale', category: 'ENTERPRISE', priceVnd: 2890000, credits: 35000, bonusPercent: 20, label: 'Enterprise Scale', durationDays: 30 },

  // Gói Nạp Thêm Credit (Pay-as-you-go)
  { id: 'topup-100', name: 'Nạp Tiêu Chuẩn', category: 'TOPUP', priceVnd: 100000, credits: 1000, bonusPercent: 0, label: '1,000 Credits', durationDays: 0 },
  { id: 'topup-200', name: 'Nạp Cơ Bản', category: 'TOPUP', priceVnd: 200000, credits: 2050, bonusPercent: 2.5, label: '2,050 Credits', durationDays: 0 },
  { id: 'topup-500', name: 'Nạp Tăng Tốc', category: 'TOPUP', priceVnd: 500000, credits: 5300, bonusPercent: 6, label: '5,300 Credits', popular: true, durationDays: 0 },
  { id: 'topup-1000', name: 'Nạp Nâng Cao', category: 'TOPUP', priceVnd: 1000000, credits: 11000, bonusPercent: 10, label: '11,000 Credits', durationDays: 0 },
  { id: 'topup-2000', name: 'Nạp Doanh Nghiệp', category: 'TOPUP', priceVnd: 2000000, credits: 23000, bonusPercent: 15, label: '23,000 Credits', durationDays: 0 },
];

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageId?: string;
}

export const TopupModal: React.FC<TopupModalProps> = ({ isOpen, onClose, initialPackageId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [categoryTab, setCategoryTab] = useState<'SUBSCRIPTION' | 'TOPUP'>('SUBSCRIPTION');
  const [topupOptions, setTopupOptions] = useState<TopupOption[]>(TOPUP_OPTIONS);
  const [selectedOption, setSelectedOption] = useState<TopupOption>(TOPUP_OPTIONS[1]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<any | null>(null);

  // Polling & verification state
  const [isChecking, setIsChecking] = useState(false);
  const [step2StartTime, setStep2StartTime] = useState<string>('');
  const [completedTx, setCompletedTx] = useState<any | null>(null);
  const pollTimerRef = useRef<any>(null);

  // Load public packages from DB & Banks
  useEffect(() => {
    let isMounted = true;

    billingService
      .getPublicPackages()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          const paidPackages = data.filter((p) => p.price_vnd > 0);
          const mapped: TopupOption[] = paidPackages.map((p) => {
            const isSub = p.category !== 'TOPUP';
            return {
              id: p.id,
              name: p.name,
              category: p.category || (isSub ? 'STARTER' : 'TOPUP'),
              priceVnd: p.price_vnd,
              credits: p.credits_given,
              bonusPercent: p.bonus_percentage || 0,
              label: p.name,
              tagBadge: p.tag_badge || '',
              durationDays: (p as any).duration_days || (isSub ? 30 : 0),
              popular: p.is_popular,
            };
          });
          setTopupOptions(mapped);

          // Select matching package if provided
          if (initialPackageId) {
            const found = mapped.find(
              (o) =>
                o.id === initialPackageId ||
                o.name.toLowerCase().includes(initialPackageId.toLowerCase()) ||
                o.label.toLowerCase().includes(initialPackageId.toLowerCase())
            );
            if (found) {
              setSelectedOption(found);
              setCategoryTab(found.category !== 'TOPUP' ? 'SUBSCRIPTION' : 'TOPUP');
              return;
            }
          }
          const defaultOpt = mapped.find((o) => o.popular && o.category !== 'TOPUP') || mapped[0];
          setSelectedOption(defaultOpt);
          setCategoryTab(defaultOpt.category !== 'TOPUP' ? 'SUBSCRIPTION' : 'TOPUP');
        }
      })
      .catch(() => {});

    // Fetch live active banks from database
    apiClient
      .get('/billing/banks')
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setAvailableBanks(list);
          const def = list.find((b: any) => b.is_default) || list[0];
          setSelectedBank(def);
        }
      })
      .catch(() => {
        try {
          const s = localStorage.getItem('velox_banks');
          if (s) {
            const list = JSON.parse(s);
            if (Array.isArray(list) && list.length > 0) {
              setAvailableBanks(list);
              setSelectedBank(list.find((b: any) => b.is_default) || list[0]);
            }
          }
        } catch {}
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When modal is opened or initialPackageId changes, adjust selection and step
  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    if (initialPackageId && topupOptions.length > 0) {
      const found = topupOptions.find(
        (o) =>
          o.id === initialPackageId ||
          o.label.toLowerCase().includes(initialPackageId.toLowerCase())
      );
      if (found) {
        setSelectedOption(found);
        // If opened with specific package, land directly on Step 2 with QR code ready
        setCurrentStep(2);
        setStep2StartTime(new Date().toISOString());
        return;
      }
    }

    // Default to Step 1
    setCurrentStep(1);
  }, [isOpen, initialPackageId, topupOptions]);

  // Handle entering Step 2
  const goToStep2 = () => {
    setCurrentStep(2);
    setStep2StartTime(new Date().toISOString());
  };

  // Automated Realtime Polling in Step 2
  useEffect(() => {
    if (!isOpen || currentStep !== 2) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await billingService.checkPaymentStatus({
          since: step2StartTime || new Date().toISOString(),
          expected_amount: selectedOption.priceVnd,
        });

        if (res && res.paid) {
          // Success verified by server!
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }

          // Update user store
          if (res.credit_balance !== undefined) {
            useAuthStore.getState().updateUser({
              credit_balance: res.credit_balance,
              ...(res.tier ? { tier: res.tier } : {}),
            });
          }

          // Save completed transaction
          setCompletedTx(res);

          // Save order to local history
          try {
            const prevOrders = JSON.parse(localStorage.getItem('velox_user_orders') || '[]');
            const newOrder = {
              id: res.transaction_code || `ORD-${Date.now().toString().slice(-6)}`,
              packageName: selectedOption.label,
              amount: res.amount_vnd || selectedOption.priceVnd,
              credits: res.credits_credited || selectedOption.credits,
              status: 'COMPLETED',
              createdAt: res.created_at || new Date().toISOString(),
              paymentMethod: 'VietQR Banking (SePay)',
            };
            localStorage.setItem('velox_user_orders', JSON.stringify([newOrder, ...prevOrders]));
          } catch {}

          // Transition to Step 3
          setCurrentStep(3);
        }
      } catch (err) {
        // Silent catch for background poll
      }
    };

    // Initial check immediately
    checkStatus();

    // Start 2.5s polling loop
    pollTimerRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isOpen, currentStep, step2StartTime, selectedOption]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await billingService.checkPaymentStatus({
        since: step2StartTime || new Date().toISOString(),
        expected_amount: selectedOption.priceVnd,
      });

      if (res && res.paid) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        if (res.credit_balance !== undefined) {
          useAuthStore.getState().updateUser({
            credit_balance: res.credit_balance,
            ...(res.tier ? { tier: res.tier } : {}),
          });
        }
        setCompletedTx(res);
        setCurrentStep(3);
      }
    } catch {}
    setTimeout(() => setIsChecking(false), 800);
  };

  if (!isOpen) return null;

  const activeBank = selectedBank || availableBanks.find((b) => b.is_default) || availableBanks[0] || null;
  const bankName = activeBank?.bank_name || 'VietinBank (Ngân hàng TMCP Công Thương)';
  const bankCode = activeBank?.bank_code || 'ICB';
  const accountNumber = activeBank?.account_number || '109873538727';
  const accountHolder = activeBank?.account_holder || 'NGUYEN LE HAI';

  const userIdentifier =
    (user as any)?.user_code ||
    (user as any)?.userCode ||
    (user?.id ? user.id.replace(/-/g, '').slice(-6).toUpperCase() : '10001');

  // Official SePay transfer memo: SEVQR TKPVL <user_code> (e.g. SEVQR TKPVL 10001)
  const transferContent = `SEVQR TKPVL ${userIdentifier}`;

  // SePay Official VietQR generator URL as requested by user
  const normalizedBank = bankCode === 'ICB' ? 'VietinBank' : bankCode;
  const qrUrl = `https://vietqr.app/img?bank=${encodeURIComponent(normalizedBank)}&acc=${encodeURIComponent(
    accountNumber
  )}&amount=${selectedOption.priceVnd}&des=${encodeURIComponent(transferContent)}&showinfo=true&holder=${encodeURIComponent(
    accountHolder
  )}&store=veloX`;

  const fallbackQrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(normalizedBank)}&acc=${encodeURIComponent(
    accountNumber
  )}&template=compact&amount=${selectedOption.priceVnd}&des=${encodeURIComponent(transferContent)}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.diamondIcon}>
              <RiSparklingFill size={22} color="#2dd4bf" />
            </div>
            <div>
              <h3>{t('topup.title', 'Nạp Credit Tài Khoản')}</h3>
              <div className={styles.balanceInfo}>
                {t('topup.current_balance', 'Số dư hiện tại')}:{' '}
                <strong>{(user?.credit_balance ?? 0).toLocaleString()} credit</strong>
                {userIdentifier && <span className={styles.userCodePill}>#{userIdentifier}</span>}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <HiOutlineXMark size={22} />
          </button>
        </div>

        {/* 3-Step Navigation Stepper */}
        <div className={styles.stepperContainer}>
          <div
            className={`${styles.stepItem} ${currentStep === 1 ? styles.active : currentStep > 1 ? styles.done : ''}`}
            onClick={() => currentStep === 2 && setCurrentStep(1)}
          >
            <div className={styles.stepCircle}>
              {currentStep > 1 ? <HiOutlineCheck size={14} /> : 1}
            </div>
            <span className={styles.stepText}>{t('topup.step1_nav', '1. Chọn Gói')}</span>
          </div>

          <div className={`${styles.stepLine} ${currentStep >= 2 ? styles.lineActive : ''}`} />

          <div
            className={`${styles.stepItem} ${currentStep === 2 ? styles.active : currentStep > 2 ? styles.done : ''}`}
          >
            <div className={styles.stepCircle}>
              {currentStep > 2 ? <HiOutlineCheck size={14} /> : 2}
            </div>
            <span className={styles.stepText}>{t('topup.step2_nav', '2. Quét Mã QR')}</span>
          </div>

          <div className={`${styles.stepLine} ${currentStep === 3 ? styles.lineActive : ''}`} />

          <div className={`${styles.stepItem} ${currentStep === 3 ? styles.active : ''}`}>
            <div className={styles.stepCircle}>
              {currentStep === 3 ? <HiOutlineCheck size={14} /> : 3}
            </div>
            <span className={styles.stepText}>{t('topup.step3_nav', '3. Hoàn Tất')}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* ═══════════════ STEP 1: CHỌN GÓI NẠP ═══════════════ */}
          {currentStep === 1 && (
            <div className={styles.step1Container}>
              {/* Category Segment Tabs */}
              <div className={styles.categoryTabs}>
                <button
                  type="button"
                  className={`${styles.catTab} ${categoryTab === 'SUBSCRIPTION' ? styles.catTabActive : ''}`}
                  onClick={() => {
                    setCategoryTab('SUBSCRIPTION');
                    const firstSub = topupOptions.find((o) => o.category !== 'TOPUP');
                    if (firstSub && selectedOption.category === 'TOPUP') {
                      setSelectedOption(firstSub);
                    }
                  }}
                >
                  <HiOutlineSparkles size={16} />
                  <span>{t('topup.tab_subscription', 'Gói Hội Viên Tháng (30 Ngày)')}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.catTab} ${categoryTab === 'TOPUP' ? styles.catTabActive : ''}`}
                  onClick={() => {
                    setCategoryTab('TOPUP');
                    const firstTopup = topupOptions.find((o) => o.category === 'TOPUP');
                    if (firstTopup && selectedOption.category !== 'TOPUP') {
                      setSelectedOption(firstTopup);
                    }
                  }}
                >
                  <HiOutlineBolt size={16} />
                  <span>{t('topup.tab_topup', 'Nạp Thêm Credit (Pay-as-you-go)')}</span>
                </button>
              </div>

              {/* Section Sub-header */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionLabel}>
                  {categoryTab === 'SUBSCRIPTION'
                    ? '✨ GÓI HỘI VIÊN TIẾT KIỆM (-30% GIÁ & ĐẦY ĐỦ QUYỀN LỢI)'
                    : '⚡ NẠP CREDIT BỔ SUNG (BẢO LƯU VĨNH VIỄN • DÙNG BAO NHIÊU NẠP BẤY NHIÊU)'}
                </span>
                <span className={styles.sectionHint}>
                  {t('topup.current_selected', 'Đang chọn')}:{' '}
                  <strong style={{ color: '#2dd4bf' }}>{selectedOption.name || selectedOption.label}</strong>
                </span>
              </div>

              {/* Package cards grid */}
              <div
                className={`${styles.optionsGrid} ${
                  categoryTab === 'SUBSCRIPTION' ? styles.gridSubscription : styles.gridTopup
                }`}
              >
                {topupOptions
                  .filter((opt) =>
                    categoryTab === 'SUBSCRIPTION' ? opt.category !== 'TOPUP' : opt.category === 'TOPUP'
                  )
                  .map((opt) => {
                    const isSelected = selectedOption.id === opt.id;
                    const isSub = opt.category !== 'TOPUP';

                    return (
                      <div
                        key={opt.id}
                        className={`${styles.optionCard} ${isSelected ? styles.selected : ''} ${
                          isSub ? styles.cardSubscription : ''
                        }`}
                        onClick={() => setSelectedOption(opt)}
                      >
                        {/* Card Header Row */}
                        <div className={styles.cardHeader}>
                          <span
                            className={`${styles.tierPill} ${
                              opt.category === 'ENTERPRISE'
                                ? styles.tierEnterprise
                                : opt.category === 'PRO'
                                ? styles.tierPro
                                : opt.category === 'STARTER'
                                ? styles.tierStarter
                                : styles.tierTopup
                            }`}
                          >
                            {opt.category === 'STARTER'
                              ? 'STARTER'
                              : opt.category === 'PRO'
                              ? 'PRO STUDIO'
                              : opt.category === 'ENTERPRISE'
                              ? 'BUSINESS'
                              : 'TOP-UP'}
                          </span>

                          <div className={styles.cardBadges}>
                            {opt.popular && (
                              <span className={styles.popularBadge}>
                                <HiOutlineSparkles size={10} /> HOT
                              </span>
                            )}
                            {opt.tagBadge && !opt.popular && (
                              <span className={styles.customBadge}>{opt.tagBadge}</span>
                            )}
                            {isSelected && (
                              <span className={styles.checkPill}>
                                <HiOutlineCheck size={12} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Package Name */}
                        <div className={styles.optionName}>{opt.name || opt.label}</div>

                        {/* Credits Amount */}
                        <div className={styles.optionCredits}>
                          <RiSparklingFill size={18} color="#2dd4bf" />
                          <span className={styles.creditsVal}>{opt.credits.toLocaleString()}</span>
                          <span className={styles.crUnit}>Credits</span>
                        </div>

                        {/* Card Footer: Price & Duration / Bonus */}
                        <div className={styles.cardFooter}>
                          <div className={styles.optionPrice}>
                            {opt.priceVnd.toLocaleString()} ₫
                          </div>
                          <div className={styles.metaRow}>
                            {opt.bonusPercent > 0 && (
                              <span className={styles.bonusBadge}>+{opt.bonusPercent}% Thưởng</span>
                            )}
                            <span className={styles.durationBadge}>
                              {isSub ? '⏱️ 30 Ngày' : '⚡ Vĩnh viễn'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected package summary & Proceed button */}
              <div className={styles.selectedSummaryBox}>
                <div className={styles.selectedInfo}>
                  <span className={styles.selectedTitle}>{t('topup.current_selected', 'GÓI ĐANG CHỌN')}</span>
                  <div className={styles.selectedValues}>
                    <span className={styles.selectedName}>{selectedOption.name || selectedOption.label}</span>
                    <span className={styles.selectedSeparator}>—</span>
                    <span className={styles.highlightAmount}>{selectedOption.priceVnd.toLocaleString()} ₫</span>
                    <span className={styles.highlightCredits}>
                      (+{selectedOption.credits.toLocaleString()} Credits
                      {selectedOption.category !== 'TOPUP' ? ' • Chu kỳ 30 ngày' : ' • Vĩnh viễn'})
                    </span>
                  </div>
                </div>
                <button type="button" className={styles.step1ProceedBtn} onClick={goToStep2}>
                  {t('topup.proceed_payment', 'Tiếp Tục Thanh Toán')} <HiOutlineArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 2: QUÉT MÃ QR & THANH TOÁN ═══════════════ */}
          {currentStep === 2 && (
            <div className={styles.step2Container}>
              {/* Package banner with change button */}
              <div className={styles.step2TopBar}>
                <div className={styles.activePkgBadge}>
                  <span>{t('topup.current_selected', 'Gói nạp')}:</span>
                  <span className={styles.pkgTag}>
                    {selectedOption.label} — {selectedOption.priceVnd.toLocaleString()} đ (+
                    {selectedOption.credits.toLocaleString()} credit)
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.changePkgBtn}
                  onClick={() => setCurrentStep(1)}
                >
                  <HiOutlineArrowLeft size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {t('topup.change_package', 'Đổi gói khác')}
                </button>
              </div>

              {/* Multi-bank selector if multiple accounts active */}
              {availableBanks.length > 1 && (
                <div className={styles.bankSelectorRow}>
                  <span>{t('topup.bank', 'Ngân hàng')}:</span>
                  <select
                    value={activeBank?.id}
                    onChange={(e) =>
                      setSelectedBank(availableBanks.find((b) => b.id === e.target.value))
                    }
                  >
                    {availableBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_number} {b.is_default ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment VietQR Box */}
              <div className={styles.paymentBox}>
                <div className={styles.qrCol}>
                  <div className={styles.qrFrame}>
                    <img
                      src={qrUrl}
                      alt="VietQR Banking Code"
                      className={styles.qrImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackQrUrl;
                      }}
                    />
                  </div>
                  <span className={styles.qrHint}>
                    {t('topup.qr_hint', 'Mở ứng dụng ngân hàng quét mã')}
                  </span>
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
                        <HiOutlineDocumentDuplicate size={15} />
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
                        <HiOutlineDocumentDuplicate size={15} />
                        {copiedField === 'memo' ? t('topup.copied', 'Đã chép') : t('topup.copy', 'Chép')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚠️ TUYỆT ĐỐI KHÔNG CÓ NÚT "TÔI ĐÃ CHUYỂN KHOẢN XONG"
                  Thay vào đó là hộp Radar tự động lắng nghe giao dịch SePay realtime */}
              <div className={styles.realtimeRadarBox}>
                <div className={styles.radarAura}>
                  <div className={styles.radarCircle} />
                  <div className={styles.radarCore}>
                    <HiOutlineArrowPath
                      size={18}
                      className={isChecking ? styles.spinAnimation : undefined}
                    />
                  </div>
                </div>

                <div className={styles.radarText}>
                  <span className={styles.radarTitle}>
                    <span className={styles.liveDot} />
                    {t('topup.waiting_payment', 'Đang chờ hệ thống ngân hàng xác nhận giao dịch...')}
                  </span>
                  <span className={styles.radarSub}>
                    {t(
                      'topup.waiting_sub',
                      'Hệ thống tự động kiểm tra mỗi 2 giây qua SePay. Ngay khi chuyển khoản thành công, credit sẽ tự động cộng vào tài khoản.'
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.manualCheckBtn}
                  onClick={handleManualCheck}
                  disabled={isChecking}
                >
                  <HiOutlineArrowPath size={14} />
                  {isChecking ? '...' : t('topup.check_now', 'Kiểm tra ngay')}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ STEP 3: THANH TOÁN THÀNH CÔNG ═══════════════ */}
          {currentStep === 3 && (
            <div className={styles.step3Container}>
              <div className={styles.successAura}>
                <HiOutlineCheckCircle size={44} />
              </div>

              <h4>{t('topup.success_title', 'Nạp Tiền Thành Công!')}</h4>
              <p className={styles.successSub}>
                {t(
                  'topup.completed_desc',
                  'Giao dịch chuyển khoản ngân hàng đã được xác nhận thành công qua SePay.'
                )}
              </p>

              <div className={styles.receiptCard}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>{t('topup.current_selected', 'Gói nạp')}:</span>
                  <span className={styles.receiptVal}>{selectedOption.label}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>{t('topup.amount', 'Số tiền')}:</span>
                  <span className={styles.receiptVal}>
                    {(completedTx?.amount_vnd || selectedOption.priceVnd).toLocaleString()} VNĐ
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>Credit nhận được:</span>
                  <span className={styles.creditGain}>
                    +{(completedTx?.credits_credited || selectedOption.credits).toLocaleString()} Credit
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptKey}>{t('topup.new_balance', 'Số dư mới')}:</span>
                  <span className={styles.balanceHighlight}>
                    {(completedTx?.credit_balance ?? (user?.credit_balance ?? 0)).toLocaleString()} Credit
                  </span>
                </div>
                {completedTx?.transaction_code && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptKey}>{t('topup.transaction_code', 'Mã giao dịch')}:</span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                      {completedTx.transaction_code}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.step3Actions}>
                <button
                  type="button"
                  className={styles.startUsingBtn}
                  onClick={() => {
                    onClose();
                  }}
                >
                  <HiOutlineSparkles size={18} style={{ display: 'inline', marginRight: 6 }} />
                  {t('topup.start_using', 'Bắt Đầu Sử Dụng')}
                </button>
                <button
                  type="button"
                  className={styles.ordersBtn}
                  onClick={() => {
                    onClose();
                    navigate('/orders');
                  }}
                >
                  {t('topup.order_history', 'Lịch Sử Nạp Tiền')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopupModal;
