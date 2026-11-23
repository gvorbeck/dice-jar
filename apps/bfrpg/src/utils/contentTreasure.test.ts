import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roll } from '@dice-jar/dice';
import type { Monster, TreasureResult } from '@/types';
import { monsterToCombatant, generateTreasure, formatTreasureResult, getCoinsToDisplay, hasCoins } from './content';

vi.mock('@dice-jar/dice', () => ({ roll: vi.fn() }));

// Every percentile roll comes up `percent`; any other dice come up `amount`, so a table's formula shows in the calls.
const rolls = (percent: number, amount = 7) =>
  vi.mocked(roll).mockImplementation(((formula: string) => ({ total: formula === '1d100' ? percent : amount })) as never);
const formulas = () => vi.mocked(roll).mock.calls.map((c) => c[0]);
beforeEach(() => vi.mocked(roll).mockReset());

describe('monsterToCombatant', () => {
  const orc = { name: 'Orc', ac: '14 [6]', hitDice: '1' } as unknown as Monster;

  it('takes the armor class from the first number in the stat', () => {
    expect(monsterToCombatant(orc)).toEqual({ name: 'Orc', ac: 14, initiative: 0 });
  });

  it('falls back to AC 11 for a missing or unreadable one', () => {
    expect(monsterToCombatant({ name: 'Blob' } as unknown as Monster).ac).toBe(11);
    expect(monsterToCombatant({ name: 'Blob', ac: 'varies' } as unknown as Monster).ac).toBe(11);
  });

  it('names a variant after the monster, and falls back to the first for a bad index', () => {
    const wolf = {
      name: 'Wolf',
      variants: [
        ['Dire', { ac: '13' }],
        ['', { ac: '12' }],
      ],
    } as unknown as Monster;
    expect(monsterToCombatant(wolf, 0)).toMatchObject({ name: 'Wolf (Dire)', ac: 13 });
    expect(monsterToCombatant(wolf, 1)).toMatchObject({ name: 'Wolf', ac: 12 });
    expect(monsterToCombatant(wolf, 9)).toMatchObject({ name: 'Wolf (Dire)', ac: 13 });
  });
});

// Treasure Types, Core Rules p. 164: coins are in hundreds, so Type A is 50% 5d6 hundred copper, 70% 10d6 hundred gold, and so on.
describe('generateTreasure', () => {
  it('rolls Type A coins with the dice and chances in the book', () => {
    rolls(1, 3);
    const t = generateTreasure('lair', 'A');
    expect(formulas()).toEqual(expect.arrayContaining(['5d6*100', '5d4*100', '10d6*100', '1d10*100']));
    expect(t).toMatchObject({ type: 'Lair', level: 'A', copper: 3, silver: 3, electrum: 3, gold: 3, platinum: 3 });
  });

  it('finds nothing of a kind when the percentile roll is over its chance', () => {
    rolls(65, 3); // over every Type A chance but gold's 70%
    const t = generateTreasure('lair', 'A');
    expect(t).toMatchObject({ copper: 0, silver: 0, electrum: 0, gold: 3, platinum: 0 });
  });

  it('scales Type G gold by 1000 (4d6 x10 hundreds)', () => {
    rolls(1, 5);
    generateTreasure('lair', 'G');
    expect(formulas()).toContain('4d6*1000');
  });

  it('never rolls for a coin a type does not have', () => {
    rolls(1, 5);
    const t = generateTreasure('lair', 'L');
    expect(t).toMatchObject({ copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 });
  });

  // Individual treasure has no chance: Type P is 3d8 copper, Type T 1d6 platinum (p. 164).
  it('gives Individual types their coins without a percentile roll', () => {
    rolls(100, 4);
    expect(generateTreasure('individual', 'P')).toMatchObject({ type: 'Individual', copper: 4, platinum: 0 });
    expect(formulas()).toEqual(['3d8']);
    vi.mocked(roll).mockClear();
    expect(generateTreasure('individual', 'T')).toMatchObject({ platinum: 4 });
    expect(formulas()).toEqual(['1d6']);
  });

  it('rolls the chances for Individual types U and V', () => {
    rolls(100, 4);
    const none = generateTreasure('individual', 'U');
    expect(none).toMatchObject({ copper: 0, gold: 0, gemsAndJewelry: [], magicItems: [] });
    rolls(1, 4);
    expect(generateTreasure('individual', 'V')).toMatchObject({ silver: 4, electrum: 4, gold: 4, platinum: 4 });
  });

  // Unguarded Treasures, Core Rules p. 165: level 1 is 75% 1d8 hundred copper, 50% 1d6 silver, 25% 1d4 electrum, 7% 1d4 gold.
  it('rolls Unguarded level 1 with the dice in the book', () => {
    rolls(1, 2);
    const t = generateTreasure('unguarded', 1);
    expect(formulas()).toEqual(expect.arrayContaining(['1d8*100', '1d6*100', '1d4*100']));
    expect(t).toMatchObject({ type: 'Unguarded', level: '1', copper: 2, silver: 2, electrum: 2, gold: 2, platinum: 2 });
  });

  it('refuses a treasure type it does not know', () => {
    expect(() => generateTreasure('hoard' as never, 'A' as never)).toThrow('Unknown treasure type: hoard');
  });

  it('adds gems, jewelry and magic items when their chances come up', () => {
    rolls(1, 2);
    const t = generateTreasure('lair', 'A');
    expect(t.gemsAndJewelry.length).toBeGreaterThan(0);
    expect(t.magicItems.length).toBeGreaterThan(0);
    expect(t.breakdown.some((line) => line.startsWith('Gems:'))).toBe(true);
  });
});

describe('treasure display', () => {
  const treasure = (over: Partial<TreasureResult> = {}) =>
    ({
      type: 'Lair',
      level: 'A',
      copper: 0,
      silver: 0,
      electrum: 0,
      gold: 120,
      platinum: 3,
      gemsAndJewelry: ['Fancy Gem (100 gp)'],
      magicItems: ['Potion (identify required)'],
      description: 'Lair Treasure Type A',
      breakdown: ['gold: 120 pieces'],
      ...over,
    }) as TreasureResult;

  it('writes the coins from platinum down, then gems and magic', () => {
    const text = formatTreasureResult(treasure());
    expect(text).toContain('**Lair Treasure Type A**');
    expect(text).toContain('**Coins:** 3 pp, 120 gp');
    expect(text).toContain('• Fancy Gem (100 gp)');
    expect(text).toContain('• Potion (identify required)');
    expect(text).toContain('• gold: 120 pieces');
  });

  it('leaves out the sections that are empty', () => {
    const text = formatTreasureResult(treasure({ platinum: 0, gold: 0, gemsAndJewelry: [], magicItems: [], breakdown: [] }));
    expect(text).not.toMatch(/Coins|Gems|Magic|Details/);
  });

  it('lists only the coins found, and knows whether there are any', () => {
    expect(getCoinsToDisplay(treasure()).map((c) => c.amount)).toEqual(expect.arrayContaining([120, 3]));
    expect(getCoinsToDisplay(treasure()).length).toBe(2);
    expect(hasCoins(treasure())).toBe(true);
    expect(hasCoins(treasure({ gold: 0, platinum: 0 }))).toBe(false);
  });
});
