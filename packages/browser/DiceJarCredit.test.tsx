// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { DiceJarCredit } from './DiceJarCredit';

it('links Dice Jar to dicejar.games', () => {
  render(<DiceJarCredit linkClassName="l" />);
  expect(screen.getByText(/Another app pulled from the/)).toBeTruthy();
  const link = screen.getByRole('link', { name: 'Dice Jar' });
  expect(link.getAttribute('href')).toBe('https://dicejar.games');
  expect(link.className).toBe('l');
});
