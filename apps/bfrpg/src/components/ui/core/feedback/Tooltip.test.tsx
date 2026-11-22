import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
  it('opens on keyboard focus and closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Roll d20">
        <button type="button">Roll</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Roll d20');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders only the trigger when disabled or empty', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="  ">
        <button type="button">Roll</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
