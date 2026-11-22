// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast, type ToastEntryProps } from './toast';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const Entry = ({ item, onDismiss, onPause, onResume }: ToastEntryProps) => (
  <div>
    <span role={item.variant === 'error' ? 'alert' : undefined}>{item.message}</span>
    <button onClick={() => onDismiss(item.id)} onFocus={() => onPause(item.id)} onBlur={() => onResume(item.id)}>
      Dismiss {item.message}
    </button>
  </div>
);

const Trigger = ({ message, variant = 'error', repeat }: { message: string; variant?: 'error' | 'info'; repeat?: boolean }) => {
  const { addToast } = useToast();
  return <button onClick={() => addToast(message, variant, repeat)}>{message}</button>;
};

describe('ToastProvider', () => {
  it('shows a repeat toast again even while the same text is visible', () => {
    render(
      <ToastProvider Entry={Entry}>
        <Trigger message="Rolled 1" repeat />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Rolled 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rolled 1' }));
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('shows an identical message only once while it is visible', () => {
    render(
      <ToastProvider Entry={Entry}>
        <Trigger message="Save failed" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save failed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save failed' }));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('a repeated message keeps the existing toast on screen longer', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider Entry={Entry}>
          <Trigger message="Save failed" />
        </ToastProvider>,
      );
      const button = screen.getByRole('button', { name: 'Save failed' });

      fireEvent.click(button);
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // The repeat at 4s restarts the 5s dismiss timer, so the toast is still
      // up at 8s — without the reset it would have dismissed at 5s.
      fireEvent.click(button);
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getAllByRole('alert')).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('still shows distinct messages alongside each other', () => {
    render(
      <ToastProvider Entry={Entry}>
        <Trigger message="Save failed" />
        <Trigger message="Other problem" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save failed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Other problem' }));
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('announces info politely and stops the countdown while hovered', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider Entry={Entry}>
          <Trigger message="Copied" variant="info" />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Copied' }));
      expect(screen.getByRole('status').textContent).toBe('Copied');
      fireEvent.focus(screen.getByRole('button', { name: 'Dismiss Copied' }));
      act(() => void vi.advanceTimersByTime(10000));
      expect(screen.getByText('Copied', { selector: 'span' })).toBeTruthy();
      fireEvent.blur(screen.getByRole('button', { name: 'Dismiss Copied' }));
      act(() => void vi.advanceTimersByTime(5200));
      expect(screen.queryByText('Copied', { selector: 'span' })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses a toast on request', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider Entry={Entry}>
          <Trigger message="Save failed" />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Save failed' }));
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss Save failed' }));
      act(() => void vi.advanceTimersByTime(200));
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('useToast throws outside a provider', () => {
    const Bare = () => {
      useToast();
      return null;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow('useToast must be used inside ToastProvider');
  });

  it('re-announces a repeated info message and leaves an exiting toast alone when hovered', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider Entry={Entry}>
          <Trigger message="Copied" variant="info" />
        </ToastProvider>,
      );
      const button = screen.getByRole('button', { name: 'Copied' });
      fireEvent.click(button);
      act(() => void vi.advanceTimersByTime(5000)); // exiting now
      fireEvent.click(button); // a new toast with the same text
      expect(screen.getByRole('status').textContent).toBe('Copied ');
      const [exiting] = screen.getAllByRole('button', { name: 'Dismiss Copied' });
      fireEvent.focus(exiting!);
      fireEvent.blur(exiting!);
      act(() => void vi.advanceTimersByTime(200));
      expect(screen.getAllByText('Copied', { selector: 'span' })).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
