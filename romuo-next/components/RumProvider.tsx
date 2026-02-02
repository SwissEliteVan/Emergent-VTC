'use client';

import { useEffect } from 'react';
import { initRum } from '../lib/rum';

export function RumProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initRum();
  }, []);

  return <>{children}</>;
}
