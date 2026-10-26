import {registerSW} from 'virtual:pwa-register';

// Register service worker with auto-update / auto cache busting (disabled in dev mode)
export function initPwaAutoCacheBust() {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Immediately activate new service worker and refresh cache
      updateSW(true);
    },
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Periodically check for SW updates (every 1 hour)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
  });

  // Listen to controllerchange: automatically reload once the new SW activates
  // to ensure users run fresh code immediately without stale cached assets.
  let refreshing = false;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}
