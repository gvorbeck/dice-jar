import { useState } from 'react';

/**
 * Custom hook to manage loading state for list components during initial mount and data fetching
 *
 * This hook ensures that loading skeletons are shown:
 * 1. On initial component mount (prevents flash of empty state)
 * 2. During initial data loading
 *
 * @param isLoading - Whether the query is in initial loading state
 * @returns boolean indicating whether loading skeleton should be shown
 */
export function useInitialLoadingState(isLoading: boolean): boolean {
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading);

  // Adjust state during render when loading state changes
  // This is the React-recommended pattern for derived state
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading);
    if (!isLoading && isInitialMount) {
      setIsInitialMount(false);
    }
  }

  return isInitialMount || isLoading;
}
