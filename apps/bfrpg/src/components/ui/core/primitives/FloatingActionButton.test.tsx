import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FABGroup } from './FloatingActionButton';

const setup = () =>
  render(<FABGroup mainAction={{ key: 'main', label: 'Menu', children: '+' }} actions={[{ key: 'a', label: 'Add', children: 'a' }]} />);

describe('FABGroup', () => {
  it('toggles the actions and sets aria-expanded, falling back to the label for aria-label', async () => {
    setup();
    const main = screen.getByRole('button', { name: 'Menu' });
    expect(main).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(main);
    expect(main).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', async () => {
    const { container } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(container.querySelector('.fab-backdrop') as HTMLElement);
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
