import React, { useState } from 'react';
import { HiOutlineDocumentPlus, HiOutlineXMark } from 'react-icons/hi2';
import type { CreateExpensePayload, ExpenseItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateExpensePayload) => Promise<ExpenseItem | null>;
}

export const CreateExpenseModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [category, setCategory] = useState('ACCOUNT_PURCHASE');
  const [title, setTitle] = useState('');
  const [amountVnd, setAmountVnd] = useState('');
  const [provider, setProvider] = useState('Meta AI');
  const [accountCount, setAccountCount] = useState('5');
  const [tokensCapacity, setTokensCapacity] = useState('155000000000');
  const [invoiceCode, setInvoiceCode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amountVnd) return;

    setSubmitting(true);
    try {
      const res = await onSubmit({
        category,
        title: title.trim(),
        amount_vnd: Number(amountVnd),
        provider,
        account_count: Number(accountCount) || 0,
        tokens_capacity: Number(tokensCapacity) || 0,
        invoice_code: invoiceCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (res) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#131722', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px', maxWidth: '580px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              <HiOutlineDocumentPlus size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Ghi Nhận Bút Toán Chi Phí & Nhập Acc</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>
            <HiOutlineXMark />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Phân Loại Chi Phí <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              >
                <option value="ACCOUNT_PURCHASE">Nhập Mua Account AI (Muse, etc.)</option>
                <option value="PROVIDER_TOPUP">Nạp Tiền Ví API Nhà Cung Cấp (OpenAI...)</option>
                <option value="CAPTCHA_SOLVER">Chi Phí Giải Captcha (2Captcha...)</option>
                <option value="PROXY_NETWORK">Thuê Proxy Mạng & IP Xoay</option>
                <option value="SERVER_INFRA">Hạ Tầng Cloud & VPS Server</option>
                <option value="OTHER">Chi Phí Vận Hành Khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Nhà Cung Cấp / Nguồn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Meta AI, OpenAI, 2Captcha, AWS..."
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Tiêu Đề Bút Toán / Chi Tiết Mua <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Mua 5 Acc Meta AI Muse 31B (30.000đ/acc)"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '13px', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Số Tiền Chi (VND) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                value={amountVnd}
                onChange={(e) => setAmountVnd(e.target.value)}
                placeholder="VD: 150000"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Số Acc Nhập
              </label>
              <input
                type="number"
                min={0}
                value={accountCount}
                onChange={(e) => setAccountCount(e.target.value)}
                placeholder="VD: 5"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tổng Token Dự Trữ
              </label>
              <input
                type="number"
                min={0}
                value={tokensCapacity}
                onChange={(e) => setTokensCapacity(e.target.value)}
                placeholder="VD: 155000000000"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Mã Hóa Đơn / Bill
              </label>
              <input
                type="text"
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                placeholder="VD: BILL-INV-99"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Ghi Chú Kế Toán & Đối Soát
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú chi tiết về người bán, hạn sử dụng, bảo hành..."
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '13px', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !amountVnd}
              style={{
                padding: '9px 22px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                opacity: submitting || !title.trim() || !amountVnd ? 0.6 : 1
              }}
            >
              {submitting ? 'Đang lưu...' : 'Lưu Phiếu Chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
