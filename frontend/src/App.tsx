import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/states/authStore';
import { useSystemStore } from '@modules/core/states/systemStore';
import router from './routes/router';
import './i18n';
import './assets/scss/global.scss';

const App = () => {
  const hydrate = useAuthStore((s) => s.hydrate);
  const syncProfile = useAuthStore((s) => s.syncProfile);

  useEffect(() => {
    hydrate();
    useSystemStore.getState().fetchPublicSettings().catch(() => {});
    if (localStorage.getItem('velox_token')) {
      syncProfile().catch(() => {});
    }

    // Background heartbeat to verify user status in real-time (kicks out locked users immediately)
    const interval = setInterval(() => {
      if (localStorage.getItem('velox_token')) {
        syncProfile().catch(() => {});
      }
    }, 15000);

    const onFocus = () => {
      if (localStorage.getItem('velox_token')) {
        syncProfile().catch(() => {});
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [hydrate, syncProfile]);

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0a0d14',
            color: '#94a3b8',
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 1rem',
                border: '3px solid #1e293b',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            VeloX AI Loading...
          </div>
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;
