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
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service worker registration failed.', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
