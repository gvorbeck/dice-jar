import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from './useNetworkStatus';

const addToast = vi.fn();
vi.mock('@dice-jar/browser', () => ({ useToast: () => ({ addToast }) }));

const setOnline = (online: boolean) => Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });

beforeEach(() => {
  addToast.mockReset();
  setOnline(true);
});
afterEach(() => {
  Reflect.deleteProperty(navigator, 'connection');
});

describe('useNetworkStatus', () => {
  it('starts with the browser state', () => {
    setOnline(false);
    expect(renderHook(() => useNetworkStatus()).result.current.isOnline).toBe(false);
  });

  it('follows going offline and back, and toasts only the return', () => {
    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(addToast).not.toHaveBeenCalled();
    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    expect(addToast).toHaveBeenCalledWith("You're back online! Any pending changes will be synced.", 'success');
  });

  it('flags a slow connection and follows it changing', () => {
    const connection = Object.assign(new EventTarget(), { effectiveType: '2g' });
    Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toMatchObject({ isSlowConnection: true, connectionType: '2g' });
    act(() => {
      connection.effectiveType = '4g';
      connection.dispatchEvent(new Event('change'));
    });
    expect(result.current).toMatchObject({ isSlowConnection: false, connectionType: '4g' });
  });

  it('reports no connection type where the browser gives none', () => {
    expect(renderHook(() => useNetworkStatus()).result.current).toMatchObject({ isSlowConnection: false, connectionType: null });
  });
});
