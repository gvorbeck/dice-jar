// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const reload = vi.hoisted(() => vi.fn(() => true));
vi.mock('@dice-jar/stale-build', async (real) => ({ ...(await real<object>()), reloadForNewBuild: reload }));
import { useRun } from './useRun';

describe('useRun', () => {
  it('is busy while the work runs and resolves true when it succeeds', async () => {
    const { result } = renderHook(() => useRun('failed'));
    let finish = () => {};
    let ok: Promise<boolean> = Promise.resolve(false);
    act(() => {
      ok = result.current.run(() => new Promise<void>((r) => (finish = r)));
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      finish();
      expect(await ok).toBe(true);
    });
    expect(result.current.busy).toBe(false);
    expect(result.current.err).toBe('');
  });

  it('shows the failure message, a per-call one first, and clears it', async () => {
    const { result } = renderHook(() => useRun((e) => `hook: ${(e as Error).message}`));
    await act(async () => {
      expect(await result.current.run(() => Promise.reject(new Error('x')))).toBe(false);
    });
    expect(result.current.err).toBe('hook: x');
    await act(async () => void (await result.current.run(() => Promise.reject(new Error('y')), 'call')));
    expect(result.current.err).toBe('call');
    act(() => result.current.clear());
    expect(result.current.err).toBe('');
  });

  it('reloads instead of showing an error when the build is stale', async () => {
    const { result } = renderHook(() => useRun('failed'));
    await act(async () => void (await result.current.run(() => Promise.reject(new Error('Failed to fetch dynamically imported module')))));
    expect(reload).toHaveBeenCalled();
    expect(result.current.err).toBe('');
  });
});
