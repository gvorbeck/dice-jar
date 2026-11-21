// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLoad, useSub, type Sub } from './useSub';

describe('useSub', () => {
  it('shows data as it arrives and unsubscribes when the id changes', () => {
    const unsub = vi.fn();
    let push: (v: string) => void = () => {};
    const sub: Sub<string> = (_id, ok) => {
      push = ok;
      return unsub;
    };
    const { result, rerender } = renderHook(({ id }) => useSub(id, sub), { initialProps: { id: 'a' } });
    expect(result.current.data).toBeUndefined();
    act(() => push('one'));
    expect(result.current.data).toBe('one');
    rerender({ id: 'b' });
    expect(unsub).toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('reports an error', () => {
    let fail: (e: Error) => void = () => {};
    const { result } = renderHook(() =>
      useSub<string>('a', (_id, _ok, bad) => {
        fail = bad;
        return () => {};
      }),
    );
    act(() => fail(new Error('denied')));
    expect(result.current.error?.message).toBe('denied');
  });
});

describe('useLoad', () => {
  it('loads once per key and drops a late answer for an old key', async () => {
    const load = vi.fn((k: string) => Promise.resolve(k.toUpperCase()));
    const { result } = renderHook(() => useLoad('x', load));
    await act(async () => {});
    expect(result.current.data).toBe('X');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('turns a rejection into an error', async () => {
    const { result } = renderHook(() => useLoad('x', () => Promise.reject(new Error('no'))));
    await act(async () => {});
    expect(result.current.error?.message).toBe('no');
  });
});
