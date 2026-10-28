import React, { useEffect } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineExclamationTriangle, HiOutlineArrowPath, HiOutlineHome } from 'react-icons/hi2';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const { t } = useTranslation();

  const errorMessage = error instanceof Error
    ? error.message
    : (error as any)?.statusText || (error as any)?.data || JSON.stringify(error);

  const isChunkError =
    typeof errorMessage === 'string' &&
    (errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('error loading dynamically imported module'));

  // If this is a chunk loading failure due to a new deployment, auto-reload once
  useEffect(() => {
    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }, [isChunkError]);

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-main, #0a0d14)',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: is404 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: is404 ? '#38bdf8' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: is404 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <HiOutlineExclamationTriangle size={32} />
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          {is404
            ? t('error.not_found_title', '404 - Không Tìm Thấy Trang')
            : t('error.general_title', 'Đã Xảy Ra Sự Cố Tải Trang')}
        </h1>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          {isChunkError
            ? t(
                'error.chunk_reloading',
                'Hệ thống vừa được nâng cấp phiên bản mới. Đang làm mới trang để tải các tài nguyên mới nhất...'
              )
            : is404
            ? t(
                'error.not_found_desc',
                'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới.'
              )
            : t(
                'error.general_desc',
                'Gặp sự cố khi hiển thị nội dung này. Vui lòng làm mới trang hoặc quay về trang chủ.'
              )}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.7rem 1.4rem',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.15s ease',
            }}
          >
            <HiOutlineArrowPath size={16} />
            {t('error.btn_reload', 'Tải Lại Trang')}
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.7rem 1.4rem',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <HiOutlineHome size={16} />
            {t('error.btn_home', 'Trang Chủ')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
