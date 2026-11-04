'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[ArabFlex PWA] Service Worker active:', reg.scope);
        })
        .catch((err) => {
          console.warn('[ArabFlex PWA] Service Worker registration note:', err);
        });
    }
  }, []);

  return null;
};
