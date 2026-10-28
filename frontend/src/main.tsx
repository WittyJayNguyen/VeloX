import { createRoot } from 'react-dom/client';
import App from './App';

// Automatic reload handler when dynamic chunks fail to load due to a new deployment
window.addEventListener('vite:preloadError', () => {
  const lastReload = sessionStorage.getItem('last_preload_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('last_preload_reload', now.toString());
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
