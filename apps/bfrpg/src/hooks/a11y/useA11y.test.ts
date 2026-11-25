import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useA11yAnnouncements, useStepAnnouncements } from './useA11y';

afterEach(() => vi.useRealTimers());
const region = () => document.getElementById('a11y-announcer');

describe('useA11yAnnouncements', () => {
  it('creates a live region and puts the message in it', () => {
    const { result } = renderHook(() => useA11yAnnouncements());
    act(() => result.current.announce('Saved'));
    expect(region()?.textContent).toBe('Saved');
    expect(region()?.getAttribute('aria-live')).toBe('polite');
  });

  it('uses the priority it is given, and one region for every message', () => {
    const { result } = renderHook(() => useA11yAnnouncements());
    act(() => result.current.announce('One'));
    act(() => result.current.announce('Two', 'assertive'));
    expect(document.querySelectorAll('#a11y-announcer')).toHaveLength(1);
    expect(region()?.getAttribute('aria-live')).toBe('assertive');
    expect(region()?.textContent).toBe('Two');
  });

  it('clears the message after a second, and removes the region on unmount', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useA11yAnnouncements());
    act(() => result.current.announce('Saved'));
    act(() => void vi.advanceTimersByTime(1000));
    expect(region()?.textContent).toBe('');
    unmount();
    expect(region()).toBeNull();
  });
});

describe('useStepAnnouncements', () => {
  const steps = [{ title: 'Abilities' }, { title: 'Race' }];

  it('announces the step it is on', () => {
    renderHook(() => useStepAnnouncements(1, steps));
    expect(region()?.textContent).toBe('Step 2 of 2: Race');
  });

  it('says nothing for a step that does not exist', () => {
    renderHook(() => useStepAnnouncements(5, steps));
    expect(region()).toBeNull();
  });
});
