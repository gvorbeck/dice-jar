import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Switch from './Switch';

describe('Switch', () => {
  it('is a switch named by its label, and reports each change', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Wearing" checked={false} onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Wearing' });
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('shows its checked state and ignores clicks while disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Coins" checked disabled onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Coins' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('keeps its own state when uncontrolled', async () => {
    render(<Switch label="Cantrips" defaultActive />);
    const toggle = screen.getByRole('switch', { name: 'Cantrips' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
