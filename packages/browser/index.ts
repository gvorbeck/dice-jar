import { useEffect, useRef, useState } from 'react';

/** localStorage that never throws (private mode, storage blocked): reads give null and `set` says whether it stuck. */
export const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage blocked */
    }
  },
};

/** Saves `data` to the visitor's downloads as a JSON file. */
export const downloadJson = (name: string, data: unknown) => downloadText(name, JSON.stringify(data, null, 2), 'application/json');

/** Saves `text` to the visitor's downloads as a file of MIME `type`. */
export function downloadText(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); // some browsers ignore a click on a detached link
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000); // revoking in the same tick can cancel the download
}

export type CopyState = 'idle' | 'ok' | 'fail';

/** Clipboard write with a short-lived result, so a button can show "copied" or "failed" instead of a blocking alert. */
export function useCopy(): [CopyState, (text: string) => Promise<boolean>] {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  /** Resolves to whether the write worked, so a caller can react to every failure, not only the first. */
  const copy = async (text: string) => {
    const ok = await Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => true,
        () => false,
      );
    setState(ok ? 'ok' : 'fail');
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), ok ? 1500 : 4000);
    return ok;
  };
  return [state, copy];
}

/** Button label for each copy state; `idle` is the resting text. */
export const copyLabel = (s: CopyState, idle: string, ok = 'Link copied ✓') => (s === 'ok' ? ok : s === 'fail' ? 'Copy failed' : idle);

/** For a `role="status"` sr-only span beside the button, since a changed button label isn't announced. */
export const copyNote = (s: CopyState) => (s === 'ok' ? 'Copied' : s === 'fail' ? 'Copy failed: select and copy it by hand' : '');

/** Game IDs this browser opened, newest first, kept under `key` so a landing page can offer a way back in. */
export const recentIds = (key: string): string[] => {
  try {
    const v = JSON.parse(store.get(key) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
export const rememberId = (key: string, id: string) => {
  store.set(key, JSON.stringify([id, ...recentIds(key).filter((x) => x !== id)].slice(0, 5)));
};

export { ErrorBoundary } from './ErrorBoundary';
export { DiceJarCredit } from './DiceJarCredit';
export { GlobalAlerts, parseAlerts, type Alert } from './GlobalAlerts';
export { SkipLink, useFocusMain } from './focus';
export { useTitle } from './useTitle';
export { useSub, useLoad, type Sub } from './useSub';
export { useRun } from './useRun';
export { useDebouncedSave, SAVE_ERROR_MESSAGE, INVALID_WRITE_MESSAGE } from './useDebouncedSave';
export { useDebouncedTextField } from './useDebouncedTextField';
export { useFirestoreSync } from './useFirestoreSync';
export { useLatest } from './useLatest';
export { ToastProvider, useToast, useToastOptional, type ToastEntryProps, type ToastItem, type ToastVariant } from './toast';
