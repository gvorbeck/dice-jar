import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('Select', () => {
  it('is named by its label and reports the chosen value', async () => {
    const onValueChange = vi.fn();
    render(<Select label="Race" options={options} onValueChange={onValueChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Race'), 'b');
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('links its error and helper text and marks itself invalid', () => {
    render(<Select label="Race" options={options} error="Pick one" helperText="Needed" />);
    const select = screen.getByLabelText('Race');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveClass('select-error');
    expect(select).toHaveAccessibleDescription('Pick one Needed');
  });
});
