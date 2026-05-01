import { useEffect } from 'react';

export function PwaServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (!window.isSecureContext) {
      console.info('Offline PWA caching requires HTTPS or localhost.');
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').then(() => {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.active?.postMessage({ type: 'CACHE_BACKGROUND_URLS' });
          })
          .catch((error) => {
            console.warn('Service worker readiness check failed.', error);
          });
      }).catch((error) => {
        console.warn('Service worker registration failed.', error);
      });
    };

    register();
  }, []);

  return null;
}
