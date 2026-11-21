import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateTreasure } from './content';

const LAIR = 'ABCDEFGHIJKLMNO'.split('');
const INDIVIDUAL = 'PQRSTUV'.split('');
const UNGUARDED = [1, 2, 3, 4, 5, 6, 7, 8];

// Every amount in the tables must be a formula the shared dice parser accepts (e.g. '5d6*100', not '5d6x100').
describe('treasure tables', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ...LAIR.map((t) => ['lair', t] as const),
    ...INDIVIDUAL.map((t) => ['individual', t] as const),
    ...UNGUARDED.map((t) => ['unguarded', t] as const),
  ])('rolls every amount of %s %s', (type, subtype) => {
    // 0 makes every chance roll succeed, so each amount in the table is rolled.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(() => generateTreasure(type, subtype as never)).not.toThrow();
  });

  it('multiplies as the table says', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateTreasure('lair', 'A').copper).toBe(500); // 5d6 at the lowest roll is 5, times 100
  });
});
