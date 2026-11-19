import { describe, expect, it } from 'vitest';
import { rollNotation } from '@dice-jar/dice';
import { describeRoll } from './DiceRoller';

describe('describeRoll', () => {
  it('shows the normalized roll and floors the total at 0', () => {
    expect(
      describeRoll(
        rollNotation('1d4 - 5', () => 0),
        1,
      ),
    ).toBe('#1 1D4-5 [1] - 5 → 0');
    expect(
      describeRoll(
        rollNotation('2d6+1', () => 0.99),
        2,
      ),
    ).toBe('#2 2D6+1 [6, 6] + 1 → 13');
  });
  it('shows the error alone', () => {
    expect(describeRoll(rollNotation(''), 3)).toBe('#3 Enter a roll, like 2d6+1.');
  });
});
