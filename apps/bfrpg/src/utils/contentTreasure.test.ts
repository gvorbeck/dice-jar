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

// Treasure Types, Core Rules pp. 164-166. Each test scripts the percentile rolls in the order the generator makes them (the others
// come up `amount`); a roll of 100 stands for the book's 00 and fails every chance.
const script = (d100: number[], amount = 1) => {
  const queue = [...d100];
  vi.mocked(roll).mockImplementation(((formula: string) => ({ total: formula === '1d100' ? (queue.shift() ?? 100) : amount })) as never);
};
const FAIL = 100;

describe('gems and jewelry (Core Rules p. 165)', () => {
  // Gem Type, d%: 01-20 Ornamental 10 gp, 21-45 Semiprecious 50, 46-75 Fancy 100, 76-95 Precious 500, 96-00 Gem 1,000.
  it.each([
    [1, 'Ornamental gem (10 gp)'],
    [20, 'Ornamental gem (10 gp)'],
    [21, 'Semiprecious gem (50 gp)'],
    [46, 'Fancy gem (100 gp)'],
    [76, 'Precious gem (500 gp)'],
    [96, 'Gem (1000 gp)'],
    [100, 'Gem (1000 gp)'],
  ])('a gem roll of %i is a %s', (typeRoll, label) => {
    script([1, typeRoll]); // Type L: 50% 1d4 gems, and nothing else
    expect(generateTreasure('lair', 'L').gemsAndJewelry).toEqual([label]);
  });

  it('values a jewelry piece at 2d8 x 100 gp', () => {
    script([FAIL, 1, 50, 1, FAIL]); // Type I: platinum fails, then gems 50% and jewelry 50% come up, one of each
    const t = generateTreasure('lair', 'I');
    expect(formulas()).toContain('2d8*100');
    expect(t.gemsAndJewelry).toContain('Jewelry Piece (1 gp)'); // the mock rolls 1 whatever the formula
  });
});

describe('magic items (Core Rules pp. 164-166)', () => {
  const items = (type: 'lair' | 'unguarded' | 'individual', sub: string | number) =>
    generateTreasure(type, sub as never).magicItems.map((i) => i.replace(' (identify required)', ''));
  const none = (n: number) => Array(n).fill(FAIL);

  // Magic Item, d% "Any": 01-25 Weapon, 26-35 Armor, 36-55 Potion, 56-85 Scroll, 86-90 Wand/Staff/Rod, 91-97 Miscellaneous, 98-00 Rare.
  it.each([
    [25, 'Weapon'],
    [26, 'Armor'],
    [36, 'Potion'],
    [56, 'Scroll'],
    [86, 'Wand, Staff, or Rod'],
    [91, 'Miscellaneous Item'],
    [98, 'Rare Item'],
    [100, 'Rare Item'],
  ])('an "any" item rolled %i is a %s', (roll100, kind) => {
    script([FAIL, FAIL, FAIL, 1, roll100]); // Type I: 15% any 1; platinum, gems and jewelry fail
    expect(items('lair', 'I')).toEqual([kind]);
  });

  it('gives Type B one weapon or armor: 01-70 a weapon, 71-00 armor', () => {
    script([...none(6), 1, 70]);
    expect(items('lair', 'B')).toEqual(['Weapon']);
    script([...none(6), 1, 71]);
    expect(items('lair', 'B')).toEqual(['Armor']);
  });

  it('rolls 1d2 items for Type C, and 1d2 plus a potion for Type D', () => {
    script([...none(5), 1, 40], 2);
    expect(items('lair', 'C')).toHaveLength(2);
    expect(formulas()).toContain('1d2');
    script([...none(5), 1, 40, 40], 2);
    expect(items('lair', 'D')).toEqual(['Potion', 'Potion', 'Potion']);
  });

  it('adds a scroll to the 1d4 items of Types E and G', () => {
    script([...none(6), 1, 40], 1);
    expect(items('lair', 'E')).toEqual(['Potion', 'Scroll']);
    expect(formulas()).toContain('1d4');
  });

  it('gives Type F 1d4 items except weapons (01-12 armor, 13-40 potion), then a potion and a scroll', () => {
    script([...none(6), 1, 12], 1);
    expect(items('lair', 'F')).toEqual(['Armor', 'Potion', 'Scroll']);
    script([...none(6), 1, 13], 1);
    expect(items('lair', 'F')).toEqual(['Potion', 'Potion', 'Scroll']);
  });

  it('gives Type N 2d4 potions and Type O 1d4 scrolls', () => {
    script([FAIL, FAIL, 1], 3);
    expect(items('lair', 'N')).toEqual(['Potion', 'Potion', 'Potion']);
    expect(formulas()).toContain('2d4');
    script([FAIL, FAIL, 1], 2);
    expect(items('lair', 'O')).toEqual(['Scroll', 'Scroll']);
    expect(formulas()).toContain('1d4');
  });

  it('gives Type M no magic items (Core Rules p. 164)', () => {
    rolls(1, 5);
    expect(items('lair', 'M')).toEqual([]);
  });

  it('gives an Individual U and an Unguarded level 8 treasure one "any" item', () => {
    script([...none(5), 1, 56]); // U: copper, silver, gold, gems and jewelry fail, magic 2% comes up, then a Scroll
    expect(items('individual', 'U')).toEqual(['Scroll']);
    script([...none(7), 1, 56]); // level 8: five coins, gems and jewelry fail, magic 20% comes up
    expect(items('unguarded', 8)).toEqual(['Scroll']);
  });
});
