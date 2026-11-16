import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../Tooltip';

// user-event's hover leaves PointerEvent.pointerType empty, which React Aria ignores, and bare fireEvent hovers are ignored
// until a real pointer has entered and left; so do that, then send the hover React Aria accepts.
const hover = async (el: HTMLElement) => {
  await userEvent.hover(el);
  await userEvent.unhover(el);
  fireEvent.pointerEnter(el, { pointerType: 'mouse' });
  fireEvent.pointerMove(el, { pointerType: 'mouse' });
};

describe('Tooltip', () => {
  it('shows on hover and hides on leave', async () => {
    render(
      <Tooltip text="Hint">
        <button>Anchor</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
    await hover(screen.getByRole('button', { name: 'Anchor' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Hint');
    fireEvent.pointerLeave(screen.getByRole('button', { name: 'Anchor' }), { pointerType: 'mouse' });
    await expect.poll(() => screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows on keyboard focus and Escape closes it', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip text="Hint">
        <button>Anchor</button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await expect.poll(() => screen.queryByRole('tooltip')).toBeNull();
  });

  it('plain wraps an icon in a focusable image named by the tooltip', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip text="Hint" plain>
        <svg />
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('img', { name: 'Hint' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });

  it('plain with noTabStop is skipped by Tab', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tooltip text="Hint" plain noTabStop>
          <svg />
        </Tooltip>
        <button>Next</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });
});
