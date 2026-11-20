import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColorScheme } from '../useColorScheme';

const meta = () => document.querySelector('meta[name="theme-color"]')!.getAttribute('content');

beforeEach(() => {
  localStorage.clear();
  document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="">');
  // jsdom loads no CSS (css: false), so fake the token: dark by default, light under data-theme.
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue: () => (document.documentElement.getAttribute('data-theme') === 'light' ? ' #fff ' : ' #000 '),
      }) as CSSStyleDeclaration,
  );
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelector('meta[name="theme-color"]')?.remove();
  document.documentElement.removeAttribute('data-theme');
});

describe('useColorScheme theme-color', () => {
  it('matches the page surface on first load', () => {
    renderHook(() => useColorScheme());
    expect(meta()).toBe('#000');
  });

  it('follows the page surface after switching themes', () => {
    const { result } = renderHook(() => useColorScheme());
    act(() => result.current.toggle());
    expect(meta()).toBe('#fff');
    act(() => result.current.toggle());
    expect(meta()).toBe('#000');
  });
});
