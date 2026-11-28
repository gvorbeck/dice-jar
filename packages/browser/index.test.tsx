// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyLabel, copyNote, downloadJson, downloadText, recentIds, rememberId, store, useCopy } from './index';

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

describe('downloadText', () => {
  it('downloads the text with its type', async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), 'blob:y'));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadText('a.txt', 'hello');
    expect(blob?.type).toBe('text/plain');
    expect(await blob?.text()).toBe('hello');
  });
});

describe('useCopy', () => {
  it('says ok after a write, then returns to idle', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result } = renderHook(() => useCopy());
    let ok: boolean | undefined;
    await act(async () => void (ok = await result.current[1]('hello')));
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current[0]).toBe('ok');
    await act(async () => void vi.advanceTimersByTime(1500));
    expect(result.current[0]).toBe('idle');
    vi.unstubAllGlobals();
  });

  it('says fail when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) } });
    const { result } = renderHook(() => useCopy());
    let ok: boolean | undefined;
    await act(async () => void (ok = await result.current[1]('x')));
    expect(ok).toBe(false);
    expect(result.current[0]).toBe('fail');
    vi.unstubAllGlobals();
  });
});

describe('copyLabel and copyNote', () => {
  it('label the button for each copy state', () => {
    expect(copyLabel('idle', 'Copy game link')).toBe('Copy game link');
    expect(copyLabel('ok', 'Copy game link')).toBe('Link copied ✓');
    expect(copyLabel('fail', 'Copy game link')).toBe('Copy failed');
  });
  it('say what happened to screen readers, and nothing at rest', () => {
    expect(copyNote('idle')).toBe('');
    expect(copyNote('ok')).toBe('Copied');
    expect(copyNote('fail')).toMatch(/Copy failed/);
  });
});

describe('recentIds', () => {
  beforeEach(() => localStorage.clear());
  it('lists the last five remembered, newest first, once each', () => {
    for (const id of ['a-1', 'b-2', 'c-3', 'd-4', 'e-5', 'a-1', 'f-6']) rememberId('k', id);
    expect(recentIds('k')).toEqual(['f-6', 'a-1', 'e-5', 'd-4', 'c-3']);
  });
  it('is empty when nothing is stored or what is stored is damaged', () => {
    expect(recentIds('k')).toEqual([]);
    localStorage.setItem('k', '{not json');
    expect(recentIds('k')).toEqual([]);
    localStorage.setItem('k', '{"a":1}');
    expect(recentIds('k')).toEqual([]);
  });
});
