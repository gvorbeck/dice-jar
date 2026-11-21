import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SimpleRoller from './SimpleRoller';

describe('SimpleRoller', () => {
  it('puts the rolled total in the input', () => {
    render(<SimpleRoller formula="1d4+100" />);
    fireEvent.click(screen.getByRole('button'));
    const value = Number((screen.getByRole('spinbutton') as HTMLInputElement).value);
    expect(value).toBeGreaterThanOrEqual(101);
    expect(value).toBeLessThanOrEqual(104);
  });

  it('says so when the formula is not valid dice notation', () => {
    render(<SimpleRoller formula="3d6x2" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Failed to roll 3d6x2/)).toBeTruthy();
  });
});
