// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedTextField } from './useDebouncedTextField';

afterEach(() => vi.useRealTimers());

describe('useDebouncedTextField', () => {
  it('shows typing at once, saves after the delay, and saves at once on blur', async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedTextField('', save, 500));

    act(() => result.current.onChange('a'));
    expect(result.current.value).toBe('a');
    expect(save).not.toHaveBeenCalled();
    await act(async () => void vi.advanceTimersByTime(500));
    expect(save).toHaveBeenCalledWith('a');

    act(() => result.current.onChange('ab'));
    await act(async () => result.current.onBlur());
    expect(save).toHaveBeenLastCalledWith('ab');
  });

  it('takes a new value from the server when nothing is waiting to save', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedTextField(v, vi.fn().mockResolvedValue(undefined)), {
      initialProps: { v: 'old' },
    });
    rerender({ v: 'new' });
    expect(result.current.value).toBe('new');
  });
});
