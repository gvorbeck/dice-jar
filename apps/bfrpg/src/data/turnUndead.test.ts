import { describe, it, expect } from 'vitest';
import { TURN_UNDEAD_TABLE } from './turnUndead';

const No = 'No';
const T = 'T';
const D = 'D';
const rep = <V>(value: V, times: number) => Array<V>(times).fill(value);

// Clerics vs. Undead, Core Rules p. 57: what a Cleric of each level 1, 2, 3... needs on 1d20 ("T" turns, "D" destroys, "No" cannot).
// The lookup of the Wraith to Ghost columns stopped at level 17, so their levels 18 to 20 are the table's own pattern, which the other
// four columns follow exactly: 20, 19, 18, 17, then down by 2 to 2, then three Ts, then D. Each type comes two levels after the one before.
const BOOK: Record<string, (number | string)[]> = {
  Skeleton: [13, 11, 9, 7, 5, 3, 2, T, T, T, ...rep(D, 10)],
  Zombie: [17, 15, 13, 11, 9, 7, 5, 3, 2, T, T, T, ...rep(D, 8)],
  Ghoul: [19, 18, 17, 15, 13, 11, 9, 7, 5, 3, 2, T, T, T, ...rep(D, 6)],
  Wight: [No, 20, 19, 18, 17, 15, 13, 11, 9, 7, 5, 3, 2, T, T, T, ...rep(D, 4)],
  Wraith: [No, No, No, 20, 19, 18, 17, 15, 13, 11, 9, 7, 5, 3, 2, T, T, T, D, D],
  Mummy: [...rep(No, 5), 20, 19, 18, 17, 15, 13, 11, 9, 7, 5, 3, 2, T, T, T],
  Spectre: [...rep(No, 7), 20, 19, 18, 17, 15, 13, 11, 9, 7, 5, 3, 2, T],
  Vampire: [...rep(No, 9), 20, 19, 18, 17, 15, 13, 11, 9, 7, 5, 3],
  Ghost: [...rep(No, 11), 20, 19, 18, 17, 15, 13, 11, 9, 7],
};

describe.each(Object.entries(BOOK))('turning a %s (Core Rules p. 57)', (type, levels) => {
  const entry = TURN_UNDEAD_TABLE.find((e) => e.undeadType === type);

  it('is in the table', () => {
    expect(entry).toBeDefined();
  });

  it('needs what the book says at each Cleric level', () => {
    const got = levels.map((_, i) => entry!.levelRequirements[i + 1]);
    expect(got).toEqual(levels);
  });
});
