import { useEffect } from 'react';
import { preloadCriticalData } from '@/services';

export function useAppData() {
  useEffect(() => {
    preloadCriticalData().catch((error) => {
      console.warn('Failed to preload critical data:', error);
    });
  }, []);
}
