'use client';

import { useCallback } from 'react';

export type FunnelStep = 'hero' | 'map' | 'destinations' | 'pricing' | 'cta';

export function useFunnelTracking() {
  const track = useCallback((step: FunnelStep, payload?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('romuo:funnel', {
        detail: {
          step,
          timestamp: Date.now(),
          ...payload,
        },
      })
    );

    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'romuo_funnel',
        step,
        ...payload,
      });
    }
  }, []);

  return { track };
}
