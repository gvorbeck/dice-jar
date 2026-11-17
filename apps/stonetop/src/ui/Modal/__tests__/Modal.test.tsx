import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

const Dialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="title">
    <h2 id="title">Settings</h2>
    <button>First</button>
    <button>Last</button>
  </Modal>
);

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its contents in a labelled dialog when open', () => {
    render(<Dialog open onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'title');
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('hides the rest of the app from assistive tech while open', () => {
    render(
      <>
        <button>Outside</button>
        <Dialog open onClose={vi.fn()} />
      </>,
    );
    expect(screen.queryByRole('button', { name: 'Outside' })).not.toBeInTheDocument();
  });

  it('moves focus into the dialog when it opens', () => {
    render(<Dialog open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('closes when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} />);
    // dialog -> modal panel -> backdrop overlay.
    await userEvent.click(screen.getByRole('dialog').parentElement!.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when content inside the dialog is clicked', async () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} />);
    await userEvent.click(screen.getByText('Settings'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps Tab focus inside the dialog, wrapping from last back to first', async () => {
    render(<Dialog open onClose={vi.fn()} />);
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    await userEvent.tab();
    expect(first).toHaveFocus();
  });

  it('wraps Shift+Tab from first back to last', async () => {
    render(<Dialog open onClose={vi.fn()} />);
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    first.focus();
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('restores focus to the previously focused element when it closes', async () => {
    const Harness = ({ open }: { open: boolean }) => (
      <>
        <button>Open</button>
        <Dialog open={open} onClose={vi.fn()} />
      </>
    );
    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();

    rerender(<Harness open />);
    rerender(<Harness open={false} />);

    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
