// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadJson, store, useCopy } from './index';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('store', () => {
  it('reads, writes and removes', () => {
    expect(store.set('k', 'v')).toBe(true);
    expect(store.get('k')).toBe('v');
    store.remove('k');
    expect(store.get('k')).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    expect(store.get('k')).toBeNull();
    expect(store.set('k', 'v')).toBe(false);
    expect(() => store.remove('k')).not.toThrow();
  });
});

describe('downloadJson', () => {
  it('clicks a link named for the file, then releases the blob', () => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('a.json');
      expect(document.body.contains(this)).toBe(true);
    });
    downloadJson('a.json', { n: 1 });
    expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});

describe('useCopy', () => {
  it('says ok after a write, then returns to idle', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result } = renderHook(() => useCopy());
    await act(async () => result.current[1]('hello'));
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current[0]).toBe('ok');
    await act(async () => void vi.advanceTimersByTime(1500));
    expect(result.current[0]).toBe('idle');
    vi.unstubAllGlobals();
  });

  it('says fail when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } });
    const { result } = renderHook(() => useCopy());
    await act(async () => result.current[1]('x'));
    expect(result.current[0]).toBe('fail');
    vi.unstubAllGlobals();
  });
});
