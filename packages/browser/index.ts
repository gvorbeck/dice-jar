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
export function downloadJson(name: string, data: unknown) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a); // some browsers ignore a click on a detached link
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000); // revoking in the same tick can cancel the download
}

export type CopyState = 'idle' | 'ok' | 'fail';

/** Clipboard write with a short-lived result, so a button can show "copied" or "failed" instead of a blocking alert. */
export function useCopy(): [CopyState, (text: string) => void] {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (text: string) => {
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => 'ok' as const,
        () => 'fail' as const,
      )
      .then((s) => {
        setState(s);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState('idle'), s === 'ok' ? 1500 : 4000);
      });
  };
  return [state, copy];
}

export { ErrorBoundary } from './ErrorBoundary';
