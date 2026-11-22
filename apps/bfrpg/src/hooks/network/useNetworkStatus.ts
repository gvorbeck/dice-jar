import { useState, useEffect } from 'react';
import { useToast } from '@dice-jar/browser';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

/**
 * Hook for monitoring network status and providing user feedback
 * Handles offline states, slow connections, and network changes
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    const updateNetworkStatus = () => {
      const wasOnline = isOnline;
      const currentlyOnline = navigator.onLine;

      setIsOnline(currentlyOnline);

      // Being offline shows as a banner for as long as it lasts (App); coming back is news, so it toasts.
      if (!wasOnline && currentlyOnline) addToast("You're back online! Any pending changes will be synced.", 'success');
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as Record<string, unknown>)['connection'] as {
          effectiveType?: string;
        };
        setConnectionType(connection.effectiveType || null);
        setIsSlowConnection(connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
      }
    };

    // Initial check
    updateNetworkStatus();
    updateConnectionInfo();

    // Add event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Connection change listener (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as Record<string, unknown>)['connection'] as EventTarget & {
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
      connection.addEventListener('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if ('connection' in navigator) {
        const connection = (navigator as Record<string, unknown>)['connection'] as EventTarget & {
          addEventListener: (type: string, listener: () => void) => void;
          removeEventListener: (type: string, listener: () => void) => void;
        };
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [isOnline, addToast]);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
  };
}
