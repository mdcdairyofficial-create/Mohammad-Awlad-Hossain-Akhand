import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Unregister old or stale service workers to bypass wrong caches and avoid /api requests failing with HTML responses
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let unregisterCount = 0;
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          unregisterCount++;
          console.log('[ServiceWorker] Unregistered stale service worker safely.');
          // If we had active service worker controlling the page, force a reload to get pristine network access
          if (unregisterCount === 1) {
            window.location.reload();
          }
        }
      });
    }
  }).catch((err) => {
    console.error('Service worker unregistration error:', err);
  });
}

// Register service worker for offline support
registerSW({ immediate: true });


setTimeout(() => {
  const el = document.querySelector('div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > form:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)');
  if (el) {
    fetch('/api/dump', { method: 'POST', body: el.outerHTML });
  } else {
    fetch('/api/dump', { method: 'POST', body: 'NOT FOUND' });
  }
}, 5000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
