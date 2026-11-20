import { useEffect } from 'react';

/** Sets the tab title; description and link-preview tags stay static in index.html. */
export const useTitle = (title: string) =>
  useEffect(() => {
    document.title = title;
  }, [title]);
