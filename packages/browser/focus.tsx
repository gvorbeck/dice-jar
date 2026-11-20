import { useEffect } from 'react';

/** First tab stop: jumps past the header to the page's <main id="main" tabIndex={-1}>. */
export const SkipLink = ({ className }: { className?: string }) => (
  <a
    className={className}
    href="#main"
    onClick={(e) => {
      e.preventDefault(); // a hash change would trip routers that read the hash
      document.getElementById('main')?.focus();
    }}
  >
    Skip to content
  </a>
);

let firstView = true;
/** After in-app navigation, focus the new view's <main id="main"> so keyboard and screen-reader users start there. The first page load keeps the browser's own focus. */
export const useFocusMain = () =>
  useEffect(() => {
    if (firstView) {
      setTimeout(() => (firstView = false)); // not now: StrictMode replays this effect at once, and that is still the first view
      return;
    }
    document.getElementById('main')?.focus();
  }, []);
