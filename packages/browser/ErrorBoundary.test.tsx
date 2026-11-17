// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = ({ message = 'boom' }: { message?: string }): never => {
  throw new Error(message);
};

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('ErrorBoundary', () => {
  it('shows the fallback when a child crashes, and logs it', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('fallback')).toBeTruthy();
    expect(log).toHaveBeenCalled();
  });

  it('recovers when resetKey changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary fallback={<p>fallback</p>} resetKey="a">
        <Boom />
      </ErrorBoundary>,
    );
    rerender(
      <ErrorBoundary fallback={<p>fallback</p>} resetKey="b">
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeTruthy();
  });

  it('reloads once instead of logging when a page chunk is gone after a deploy', () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <Boom message="Failed to fetch dynamically imported module: /a.js" />
      </ErrorBoundary>,
    );
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
