import React, { useMemo } from 'react';
import styles from '@assets/scss/core/design-system.module.scss';

// ── Table with Pagination ──
export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
  loading?: boolean;
  // Pagination
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  showPagination?: boolean;
}

export function Table<T>({
  columns, data, rowKey, emptyText = 'Không có dữ liệu', loading,
  page = 1, pageSize = 10, onPageChange, totalItems, showPagination = true,
}: TableProps<T>) {
  const total = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedData = useMemo(() => {
    if (totalItems !== undefined) return data; // server-side pagination
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, totalItems]);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align || 'left' }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className={styles.loadingCell}><span className={styles.spinner} /> Đang tải...</td></tr>
            ) : pagedData.length === 0 ? (
              <tr><td colSpan={columns.length} className={styles.emptyCell}>{emptyText}</td></tr>
            ) : pagedData.map((row, idx) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row, idx) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Hiển thị {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} / {total}
          </span>
          <div className={styles.pageButtons}>
            <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>‹</button>
            {pageNumbers.map((p, i) => typeof p === 'number' ? (
              <button key={p} type="button" className={`${styles.pageBtn} ${p === page ? styles.pageActive : ''}`} onClick={() => onPageChange?.(p)}>{p}</button>
            ) : (
              <span key={`dots-${i}`} className={styles.pageDots}>…</span>
            ))}
            <button type="button" className={styles.pageBtn} disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}
