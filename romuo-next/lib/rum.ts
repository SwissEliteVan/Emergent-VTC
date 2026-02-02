export function initRum() {
  if (typeof window === 'undefined') return;
  if ((window as any).__romuoRumInitialized) return;
  (window as any).__romuoRumInitialized = true;

  window.addEventListener('romuo:funnel', (event) => {
    const detail = (event as CustomEvent).detail;
    navigator.sendBeacon?.('/api/rum', JSON.stringify({ type: 'funnel', detail }));
  });
}
