import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('is a labelled dialog that closes on Escape and the close button', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Roll">
        body
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Roll' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders nothing when closed and keeps focus inside when open', async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Roll">
        <input aria-label="first" />
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Modal isOpen onClose={() => {}} title="Roll">
        <input aria-label="first" />
      </Modal>,
    );
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
});
