import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Monsters } from '../Monsters';

// Stonetop (Book 1), p. 399: the size row reads "Like a human child (small)", not a shield.
describe('Monsters', () => {
  it('lists the small size as a human child', () => {
    render(<Monsters />);
    expect(screen.getByText('Like a human child (small)')).toBeTruthy();
  });
});
