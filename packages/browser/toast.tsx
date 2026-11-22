import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'error' | 'info' | 'success';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

/** What an app's toast component gets: it draws the toast; the provider owns timing, dedupe and announcements. */
export interface ToastEntryProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

interface ToastContextValue {
  // `repeat` shows the toast even while the same text is up, for news that happens again (a dice result) rather than a lasting condition.
  addToast: (message: string, variant?: ToastVariant, repeat?: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

/** For shared hooks that may render outside a ToastProvider (e.g. in bare renderHook tests). */
export const useToastOptional = (): ToastContextValue | null => useContext(ToastContext);

const AUTO_DISMISS_MS = 5000;
const EXIT_DURATION_MS = 200; // matches the app's exit animation

/**
 * Notifications for the whole app, drawn by the app's own `Entry`. The app styles `.toast-region` (where they stack) and
 * `.toast-announcer` (visually hidden). Errors announce through the Entry's role="alert"; info and success through the announcer.
 */
export const ToastProvider = ({ children, Entry }: { children: ReactNode; Entry: ComponentType<ToastEntryProps> }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Mounted once up front: a live region added to the DOM together with its text isn't reliably announced.
  const [announcement, setAnnouncement] = useState('');
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // `variant:message` per visible toast, so repeats (one failed save per field while offline) don't stack.
  const visibleKeys = useRef<Map<string, string>>(new Map());

  const startExit = useCallback((id: string) => {
    visibleKeys.current.delete(id);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, EXIT_DURATION_MS);
    timers.current.set(id, removeTimer);
  }, []);

  const restartTimer = useCallback(
    (id: string) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      timers.current.set(
        id,
        setTimeout(() => startExit(id), AUTO_DISMISS_MS),
      );
    },
    [startExit],
  );

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', repeat = false) => {
      const dedupeKey = `${variant}:${message}`;
      if (!repeat)
        for (const [existingId, key] of visibleKeys.current) {
          // Same message already showing: keep it up while the condition lasts, without stacking.
          if (key === dedupeKey) return restartTimer(existingId);
        }
      const id = crypto.randomUUID();
      visibleKeys.current.set(id, dedupeKey);
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      restartTimer(id);
      // A repeated message still changes the text, so screen readers announce it again.
      if (variant !== 'error') setAnnouncement((prev) => (prev === message ? `${message} ` : message));
    },
    [restartTimer],
  );

  const dismiss = useCallback(
    (id: string) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      startExit(id);
    },
    [startExit],
  );

  // WCAG 2.2.1: hovering or focusing a toast stops its countdown. An exiting toast's timer is its removal, so it is left alone.
  const pause = useCallback((id: string) => {
    if (!visibleKeys.current.has(id)) return;
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
  }, []);
  const resume = useCallback((id: string) => void (visibleKeys.current.has(id) && restartTimer(id)), [restartTimer]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Stable, so components that only add toasts don't redraw whenever one comes or goes.
  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <>
          <div role="status" aria-live="polite" aria-atomic="true" className="toast-announcer">
            {announcement}
          </div>
          <div role="region" className="toast-region" aria-label="Notifications">
            {toasts.map((item) => (
              <Entry key={item.id} item={item} onDismiss={dismiss} onPause={pause} onResume={resume} />
            ))}
          </div>
        </>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};
