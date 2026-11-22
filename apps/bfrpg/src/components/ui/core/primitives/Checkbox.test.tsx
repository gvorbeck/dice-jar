import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('toggles from its label and reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Sleep" checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByText('Sleep'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('exposes checked, mixed and helper text to assistive technology', () => {
    const { rerender } = render(<Checkbox label="Light" checked helperText="Cast at will" />);
    const box = screen.getByRole('checkbox', { name: 'Light' });
    expect(box).toBeChecked();
    expect(box).toHaveAccessibleDescription('Cast at will');
    rerender(<Checkbox label="Light" indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'Light' })).toBePartiallyChecked();
  });

  it('ignores clicks while disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Web" disabled onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByText('Web'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
