import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import Notification from './Notification';

describe('Notification timer', () => {
  afterEach(() => {
    // @ts-expect-error jsdom has no animate, so remove the stub
    delete Element.prototype.animate;
  });

  it('starts the countdown bar once, even when the toast re-renders', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    const props = { message: 'Saved', duration: 5000, isVisible: true, onDismiss: vi.fn(), id: 'a' };
    const { rerender } = render(<Notification {...props} />);
    rerender(<Notification {...props} message="Saved again" />);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
