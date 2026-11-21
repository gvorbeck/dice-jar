import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface S {
  count: number;
  note: string;
  add: () => void;
}

const load = async (key: string) => {
  vi.resetModules();
  const { createStore } = await import('./store');
  return createStore<S>(
    key,
    (set) => ({ count: 0, note: 'x', add: () => set((s) => ({ count: s.count + 1 })) }),
    (s) => ({ count: s.count }),
  );
};

const saved = new Map<string, string>();

describe('createStore', () => {
  beforeEach(() => {
    saved.clear();
    // the test setup's localStorage is a bare mock, so give the store a real one
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => void saved.set(k, v),
      removeItem: (k: string) => void saved.delete(k),
    });
  });

  it('shares state between components and saves the kept part', async () => {
    const use = await load('k1');
    const a = renderHook(() => use((s) => s.count));
    const b = renderHook(() => use());
    act(() => b.result.current.add());
    expect(a.result.current).toBe(1);
    expect(JSON.parse(saved.get('k1')!)).toEqual({ state: { count: 1 }, version: 0 });
  });

  it('starts from what an earlier visit saved, in the shape zustand wrote', async () => {
    saved.set('k2', JSON.stringify({ state: { count: 7 }, version: 0 }));
    const use = await load('k2');
    expect(renderHook(() => use((s) => s.count)).result.current).toBe(7);
    expect(renderHook(() => use((s) => s.note)).result.current).toBe('x');
  });

  it('falls back to the defaults when the saved value is unreadable', async () => {
    saved.set('k3', '{nope');
    const use = await load('k3');
    expect(renderHook(() => use((s) => s.count)).result.current).toBe(0);
  });
});
