import { useEffect } from 'react';

const DEFAULT_TITLE = 'Hearthfire — Stonetop Party Tracker';

/** Sets the tab title for the page; no title restores the site default. Description and link-preview tags stay static in index.html. */
export const useTitle = (title?: string) =>
  useEffect(() => {
    document.title = title ?? DEFAULT_TITLE;
  }, [title]);
