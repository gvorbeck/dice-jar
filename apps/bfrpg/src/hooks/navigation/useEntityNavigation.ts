import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '@dice-jar/browser';
import { STORAGE_KEYS } from '@/constants';

interface EntityNavigationConfig {
  /** Storage keys to clear after successful creation */
  storageKeysToClear: string[];
  /** Function to generate the route path after creation */
  getRoutePath: (userId: string, entityId: string) => string;
}

/**
 * Hook to handle navigation after entity creation (character, game, etc.)
 * Provides consistent behavior for clearing storage and navigating to entity sheets
 */
function useEntityNavigation(config: EntityNavigationConfig) {
  const navigate = useNavigate();

  const navigateToEntity = useCallback(
    (userId: string, entityId: string) => {
      // Clear localStorage data for fresh start
      config.storageKeysToClear.forEach((key) => {
        store.remove(key);
      });

      // Navigate to the entity sheet
      const routePath = config.getRoutePath(userId, entityId);
      navigate(routePath);
    },
    [config, navigate],
  );

  const navigateHome = useCallback(
    (clearStorageOnly = false) => {
      // Clear localStorage data for fresh start
      if (clearStorageOnly) {
        config.storageKeysToClear.forEach((key) => {
          store.remove(key);
        });
      }

      // Navigate to home
      navigate('/');
    },
    [config, navigate],
  );

  return { navigateToEntity, navigateHome };
}

/**
 * Pre-configured hook for game creation navigation
 */
export function useGameNavigation() {
  return useEntityNavigation({
    storageKeysToClear: [STORAGE_KEYS.DRAFT_GAME],
    getRoutePath: (userId, gameId) => `/u/${userId}/g/${gameId}`,
  });
}
