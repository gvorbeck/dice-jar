import { useSyncExternalStore } from 'react';
import { store as storage } from '@dice-jar/browser';

type Setter<T> = (patch: Partial<T> | ((s: T) => Partial<T>)) => void;

/**
 * State every component can read and change, with the `keep` part saved in localStorage across visits.
 * It saves in the `{ state, version }` shape the app's earlier store used, so what visitors already have still loads.
 */
export function createStore<T extends object>(key: string, make: (set: Setter<T>, get: () => T) => T, keep: (s: T) => Partial<T>) {
  const listeners = new Set<() => void>();
  let state: T;
  const get = () => state;
  const set: Setter<T> = (patch) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    storage.set(key, JSON.stringify({ state: keep(state), version: 0 }));
    listeners.forEach((l) => l());
  };
  state = make(set, get);
  try {
    state = { ...state, ...JSON.parse(storage.get(key) ?? '{}').state };
  } catch {
    /* unreadable: start from the defaults */
  }

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  };
  return function useStore<R = T>(select: (s: T) => R = (s) => s as unknown as R): R {
    return useSyncExternalStore(subscribe, () => select(state));
  };
}
