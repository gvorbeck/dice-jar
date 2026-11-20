import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalAlert } from './GlobalAlert';

describe('GlobalAlert', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<GlobalAlert alert={{ message: '', type: 'info', dismissible: false }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces its message in its type class and closes on request', async () => {
    const onClose = vi.fn();
    render(<GlobalAlert alert={{ message: 'Offline', type: 'error', dismissible: true }} onClose={onClose} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert', 'alert-error');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    await userEvent.click(screen.getByRole('button', { name: 'Close error alert' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
