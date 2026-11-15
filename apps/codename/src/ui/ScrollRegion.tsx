import { useEffect, useRef, useState, type ReactNode } from 'react';

/** A height-capped box (`.log`) that becomes a focusable, labelled region only while it overflows, so keyboard users can scroll it. */
export function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => setOver(el.scrollHeight > el.clientHeight);
    const watch = new ResizeObserver(check);
    watch.observe(el);
    if (el.firstElementChild) watch.observe(el.firstElementChild); // rows added or removed
    check();
    return () => watch.disconnect();
  }, []);
  // role, label and tabIndex always change together; one object keeps them from drifting apart
  const focusable = over ? { role: 'region', 'aria-label': label, tabIndex: 0 } : {};
  return (
    <div ref={ref} className="log" {...focusable}>
      {children}
    </div>
  );
}
