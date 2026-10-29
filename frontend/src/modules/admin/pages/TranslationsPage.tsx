import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineLanguage,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineArrowsPointingOut,
} from 'react-icons/hi2';
import { translationService, type TranslationItem } from '@modules/system/services/translationService';
import { applyTranslationOverrides } from '@/i18n';

export const TranslationsPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Data states
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter & pagination states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Loading & status
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Edit modal
  const [editingItem, setEditingItem] = useState<TranslationItem | null>(null);
  const [editForm, setEditForm] = useState<{
    category: string;
    vi: string;
    en: string;
    zh: string;
    ja: string;
    ko: string;
  }>({
    category: 'common',
    vi: '',
    en: '',
    zh: '',
    ja: '',
    ko: '',
  });

  // Inline 1-row edit state
  const [inlineKey, setInlineKey] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<{
    category: string;
    vi: string;
    en: string;
    zh: string;
    ja: string;
    ko: string;
  }>({
    category: 'common',
    vi: '',
    en: '',
    zh: '',
    ja: '',
    ko: '',
  });
  const [savingInline, setSavingInline] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{
    key: string;
    category: string;
    vi: string;
    en: string;
    zh: string;
    ja: string;
    ko: string;
  }>({
    key: '',
    category: 'common',
    vi: '',
    en: '',
    zh: '',
    ja: '',
    ko: '',
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await translationService.getTranslations({
        search: search.trim(),
        category,
        page,
        page_size: pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load translations:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page, pageSize]);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Sync latest bundle from server into frontend i18n
  const handleSyncBundle = async () => {
    setSyncing(true);
    try {
      const res = await translationService.getBundle();
      if (res && res.bundle) {
        applyTranslationOverrides(res.bundle);
        showToast(t('admin.translations.sync_success', 'Đã nạp và đồng bộ toàn bộ bản dịch mới nhất vào hệ thống!'));
      }
    } catch (err) {
      alert(t('common.error_occurred', 'Lỗi đồng bộ bản dịch'));
    } finally {
      setSyncing(false);
    }
  };

  const updateLiveDictionary = (key: string, form: { vi: string; en: string; zh: string; ja: string; ko: string }) => {
    const keyParts = key.split('.');
    const updateNested = (lang: string, val: string) => {
      if (!val) return;
      const obj: Record<string, unknown> = {};
      let curr = obj;
      for (let i = 0; i < keyParts.length - 1; i++) {
        curr[keyParts[i]] = {};
        curr = curr[keyParts[i]] as Record<string, unknown>;
      }
      curr[keyParts[keyParts.length - 1]] = val;
      i18n.addResourceBundle(lang, 'translation', obj, true, true);
    };
    updateNested('vi', form.vi);
    updateNested('en', form.en);
    updateNested('zh', form.zh);
    updateNested('ja', form.ja);
    updateNested('ko', form.ko);
  };

  const handleOpenEdit = (item: TranslationItem) => {
    setEditingItem(item);
    setEditForm({
      category: item.category || 'common',
      vi: item.vi || '',
      en: item.en || '',
      zh: item.zh || '',
      ja: item.ja || '',
      ko: item.ko || '',
    });
  };

  const handleStartInlineEdit = (item: TranslationItem) => {
    setInlineKey(item.key);
    setInlineForm({
      category: item.category || 'common',
      vi: item.vi || '',
      en: item.en || '',
      zh: item.zh || '',
      ja: item.ja || '',
      ko: item.ko || '',
    });
  };

  const handleCancelInlineEdit = () => {
    setInlineKey(null);
  };

  const handleSaveInlineEdit = async (key: string) => {
    setSavingInline(true);
    try {
      const res = await translationService.updateTranslation(key, inlineForm);
      if (res && res.item) {
        setItems((prev) =>
          prev.map((it) => (it.key === key ? res.item : it))
        );
        updateLiveDictionary(key, inlineForm);
        setInlineKey(null);
        showToast(t('admin.translations.update_success', 'Cập nhật bản dịch thành công!'));
      }
    } catch (err) {
      alert(t('common.error_occurred', 'Không thể lưu bản dịch'));
    } finally {
      setSavingInline(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await translationService.updateTranslation(editingItem.key, editForm);
      if (res && res.item) {
        setItems((prev) =>
          prev.map((it) => (it.key === editingItem.key ? res.item : it))
        );
        updateLiveDictionary(editingItem.key, editForm);
        setEditingItem(null);
        showToast(t('admin.translations.update_success', 'Cập nhật bản dịch thành công!'));
      }
    } catch (err) {
      alert(t('common.error_occurred', 'Không thể lưu bản dịch'));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.key.trim()) return;

    try {
      const res = await translationService.createTranslation({
        key: createForm.key.trim(),
        category: createForm.category.trim() || 'common',
        vi: createForm.vi.trim(),
        en: createForm.en.trim(),
        zh: createForm.zh.trim(),
        ja: createForm.ja.trim(),
        ko: createForm.ko.trim(),
      });
      if (res && res.item) {
        setShowCreateModal(false);
        setCreateForm({ key: '', category: 'common', vi: '', en: '', zh: '', ja: '', ko: '' });
        showToast(t('admin.translations.create_success', 'Đã thêm key đa ngôn ngữ mới thành công!'));
        fetchTranslations();
      }
    } catch (err) {
      alert(t('common.error_occurred', 'Không thể tạo bản dịch mới (có thể key đã tồn tại)'));
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(t('admin.translations.confirm_delete', 'Bạn có chắc chắn muốn xóa bản dịch này?'))) return;

    try {
      await translationService.deleteTranslation(key);
      setItems((prev) => prev.filter((it) => it.key !== key));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast(t('admin.translations.delete_success', 'Đã xóa bản dịch thành công!'));
    } catch (err) {
      alert(t('common.error_occurred', 'Không thể xóa key này'));
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: '#fff', padding: '0 4px 40px' }}>
      {/* Toast Alert */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: '#064e3b',
          border: '1px solid #059669',
          color: '#ecfdf5',
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.2s ease-out',
        }}>
          <HiOutlineCheckCircle size={20} color="#34d399" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.2))',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
          }}>
            <HiOutlineLanguage size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {t('admin.nav.translations', 'Quản Lý Đa Ngôn Ngữ (Localization)')}
              </h1>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
              }}>
                5 Ngôn Ngữ
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {t('admin.translations.subtitle', 'Tùy biến, thay thế và quản lý từ ngữ trên toàn hệ thống theo 5 thứ tiếng (Việt, Anh, Trung, Nhật, Hàn).')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSyncBundle}
            disabled={syncing}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: '#181e2b',
              color: '#e2e8f0',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HiOutlineArrowPath size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('common.syncing', 'Đang nạp...') : t('admin.translations.sync_now', 'Đồng Bộ Runtime')}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            }}
          >
            <HiOutlinePlus size={16} /> {t('admin.translations.add_key', 'Thêm Từ Khóa Mới')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#111520',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
      }}>
        {/* Category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {t('common.category', 'Danh mục:')}
          </span>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#0a0d14',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">{t('common.all_categories', '— Tất Cả Danh Mục —')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search & page size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', minWidth: '240px', maxWidth: '380px', width: '100%' }}>
            <HiOutlineMagnifyingGlass size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin.translations.search_placeholder', 'Tìm theo mã Key hoặc từ ngữ tiếng bất kỳ...')}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '8px',
                background: '#0a0d14',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => fetchTranslations()}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: '#0a0d14',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <HiOutlineArrowPath size={14} />
          </button>
        </div>
      </div>

      {/* Translations Table */}
      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
          <div>{t('common.loading', 'Đang tải danh sách bản dịch...')}</div>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          background: '#111520',
          borderRadius: '12px',
          border: '1px dashed rgba(255,255,255,0.12)',
        }}>
          <HiOutlineSparkles size={40} color="#64748b" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#e2e8f0' }}>
            {t('admin.translations.empty_title', 'Không tìm thấy từ khóa nào')}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {t('admin.translations.empty_desc', 'Thử tìm từ khóa khác hoặc bấm "Thêm Từ Khóa Mới".')}
          </p>
        </div>
      ) : (
        <div style={{
          background: '#111520',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflowX: 'auto',
          marginBottom: '20px',
        }}>
          <table style={{ width: '100%', minWidth: '1680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#0d111a', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px', width: '280px', whiteSpace: 'nowrap' }}>Key & Nhóm</th>
                <th style={{ padding: '12px 14px', width: '270px', whiteSpace: 'nowrap' }}>🇻🇳 Tiếng Việt (vi)</th>
                <th style={{ padding: '12px 14px', width: '270px', whiteSpace: 'nowrap' }}>🇺🇸 English (en)</th>
                <th style={{ padding: '12px 14px', width: '250px', whiteSpace: 'nowrap' }}>🇨🇳 中文 (zh)</th>
                <th style={{ padding: '12px 14px', width: '250px', whiteSpace: 'nowrap' }}>🇯🇵 日本語 (ja)</th>
                <th style={{ padding: '12px 14px', width: '250px', whiteSpace: 'nowrap' }}>🇰🇷 한국어 (ko)</th>
                <th style={{ padding: '12px 14px', width: '130px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isInline = inlineKey === item.key;

                return (
                  <tr
                    key={item.key}
                    onDoubleClick={() => !isInline && handleStartInlineEdit(item)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.15s',
                      background: isInline ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                    }}
                  >
                    {/* Key & Category */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: isInline ? '#38bdf8' : '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={item.key}
                      >
                        {item.key}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '3px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#a5b4fc',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}>
                        {item.category}
                      </span>
                    </td>

                    {/* Languages columns - Inline Input or Single Line Text */}
                    {isInline ? (
                      <>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={inlineForm.vi}
                            onChange={(e) => setInlineForm({ ...inlineForm, vi: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.key);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            placeholder="Tiếng Việt..."
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#0a0d14',
                              border: '1px solid #38bdf8',
                              color: '#fff',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={inlineForm.en}
                            onChange={(e) => setInlineForm({ ...inlineForm, en: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.key);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            placeholder="English..."
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#0a0d14',
                              border: '1px solid #38bdf8',
                              color: '#fff',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={inlineForm.zh}
                            onChange={(e) => setInlineForm({ ...inlineForm, zh: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.key);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            placeholder="中文..."
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#0a0d14',
                              border: '1px solid #38bdf8',
                              color: '#fff',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={inlineForm.ja}
                            onChange={(e) => setInlineForm({ ...inlineForm, ja: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.key);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            placeholder="日本語..."
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#0a0d14',
                              border: '1px solid #38bdf8',
                              color: '#fff',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={inlineForm.ko}
                            onChange={(e) => setInlineForm({ ...inlineForm, ko: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineEdit(item.key);
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                            placeholder="한국어..."
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#0a0d14',
                              border: '1px solid #38bdf8',
                              color: '#fff',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartInlineEdit(item)}
                          title={`${item.vi || 'Trống'} (Nhấp đúp để sửa)`}
                        >
                          {item.vi || <span style={{ color: '#475569', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartInlineEdit(item)}
                          title={`${item.en || 'Empty'} (Nhấp đúp để sửa)`}
                        >
                          {item.en || <span style={{ color: '#475569', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartInlineEdit(item)}
                          title={`${item.zh || 'Empty'} (Nhấp đúp để sửa)`}
                        >
                          {item.zh || <span style={{ color: '#475569', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartInlineEdit(item)}
                          title={`${item.ja || 'Empty'} (Nhấp đúp để sửa)`}
                        >
                          {item.ja || <span style={{ color: '#475569', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            color: '#cbd5e1',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleStartInlineEdit(item)}
                          title={`${item.ko || 'Empty'} (Nhấp đúp để sửa)`}
                        >
                          {item.ko || <span style={{ color: '#475569', fontStyle: 'italic' }}>—</span>}
                        </td>
                      </>
                    )}

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isInline ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveInlineEdit(item.key)}
                            disabled={savingInline}
                            title="Lưu bản dịch (Enter)"
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <HiOutlineCheck size={14} /> Lưu
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            title="Hủy (Esc)"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              background: '#181e2b',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HiOutlineXMark size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                          <button
                            onClick={() => handleStartInlineEdit(item)}
                            title="Sửa trực tiếp 1 dòng"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(14, 165, 233, 0.3)',
                              background: 'rgba(14, 165, 233, 0.1)',
                              color: '#38bdf8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HiOutlinePencilSquare size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Mở hộp thoại chỉnh sửa đầy đủ"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: '#c084fc',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HiOutlineArrowsPointingOut size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.key)}
                            title={t('common.delete', 'Xóa')}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {total > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#111520',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
            {t('common.showing_page', 'Trang {{current}} / {{total}} (Tổng số {{count}} từ khóa)', {
              current: page,
              total: totalPages,
              count: total,
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: '#0a0d14',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
              <option value="100">100 / trang</option>
            </select>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: page <= 1 ? '#0d111a' : '#181e2b',
                color: page <= 1 ? '#475569' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {t('common.prev', 'Trước')}
            </button>

            {/* Direct Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pNum = Math.min(totalPages - 4 + i, Math.max(1, page - 2 + i));
              }
              const isActive = pNum === page;
              return (
                <button
                  key={pNum}
                  onClick={() => setPage(pNum)}
                  style={{
                    padding: '6px 10px',
                    minWidth: '32px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid #0284c7' : '1px solid rgba(255,255,255,0.1)',
                    background: isActive ? '#0284c7' : '#111520',
                    color: isActive ? '#fff' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: page >= totalPages ? '#0d111a' : '#181e2b',
                color: page >= totalPages ? '#475569' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {t('common.next', 'Sau')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Translation Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#121622',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
                  {t('admin.translations.edit_title', 'Chỉnh Sửa Bản Dịch')}
                </h3>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                  {editingItem.key}
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Danh Mục (Category)
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇻🇳 Tiếng Việt (vi)
                </label>
                <textarea
                  rows={2}
                  value={editForm.vi}
                  onChange={(e) => setEditForm((f) => ({ ...f, vi: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇺🇸 English (en)
                </label>
                <textarea
                  rows={2}
                  value={editForm.en}
                  onChange={(e) => setEditForm((f) => ({ ...f, en: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇨🇳 中文 (zh)
                </label>
                <textarea
                  rows={2}
                  value={editForm.zh}
                  onChange={(e) => setEditForm((f) => ({ ...f, zh: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇯🇵 日本語 (ja)
                </label>
                <textarea
                  rows={2}
                  value={editForm.ja}
                  onChange={(e) => setEditForm((f) => ({ ...f, ja: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇰🇷 한국어 (ko)
                </label>
                <textarea
                  rows={2}
                  value={editForm.ko}
                  onChange={(e) => setEditForm((f) => ({ ...f, ko: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#181e2b',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <HiOutlineCheck size={16} /> {t('common.save_changes', 'Lưu Thay Đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Translation Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: '#121622',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
                  {t('admin.translations.add_title', 'Thêm Bản Dịch Mới')}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Khai báo Key theo cấu trúc danh mục, ví dụ: <code>custom.hero_tagline</code>
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Mã Key <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: landing.hero_badge"
                    value={createForm.key}
                    onChange={(e) => setCreateForm((f) => ({ ...f, key: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0a0d14',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Danh Mục
                  </label>
                  <input
                    type="text"
                    placeholder="common, auth, nav..."
                    value={createForm.category}
                    onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#0a0d14',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇻🇳 Tiếng Việt (vi)
                </label>
                <textarea
                  rows={2}
                  value={createForm.vi}
                  onChange={(e) => setCreateForm((f) => ({ ...f, vi: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇺🇸 English (en)
                </label>
                <textarea
                  rows={2}
                  value={createForm.en}
                  onChange={(e) => setCreateForm((f) => ({ ...f, en: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇨🇳 中文 (zh)
                </label>
                <textarea
                  rows={2}
                  value={createForm.zh}
                  onChange={(e) => setCreateForm((f) => ({ ...f, zh: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇯🇵 日本語 (ja)
                </label>
                <textarea
                  rows={2}
                  value={createForm.ja}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ja: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🇰🇷 한국어 (ko)
                </label>
                <textarea
                  rows={2}
                  value={createForm.ko}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ko: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#181e2b',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  disabled={!createForm.key.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: !createForm.key.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <HiOutlinePlus size={16} /> {t('common.create', 'Tạo Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationsPage;
