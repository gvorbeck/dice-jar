// Every expectation cites the Knave 2e page it comes from.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LEVELS,
  armorClass,
  careerItems,
  carried,
  checkResult,
  checkTarget,
  droppedSlots,
  fits,
  levelFor,
  raiseScores,
  rerolledHp,
  rollCareer,
  rollCoins,
  rollHp,
  rollPicks,
  rollScores,
  rollSpell,
  scoresFromDice,
  slotCount,
  withCareer,
  withCareerItems,
  slotsUsed,
} from './index';
import { CAREERS } from './data/careers';
import { SPELLS } from './data/spells';

afterEach(() => vi.restoreAllMocks());

describe('abilities (p. 4)', () => {
  it('each die adds 1 to the ability with its number: 3-5-5 makes CON 1 and WIS 2', () => {
    expect(scoresFromDice([3, 5, 5])).toEqual({ str: 0, dex: 0, con: 1, int: 0, wis: 2, cha: 0 });
  });
  it('rolling 3d6 places exactly 3 points', () => {
    for (let i = 0; i < 100; i++) expect(Object.values(rollScores()).reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe('slots and wounds (pp. 4, 6)', () => {
  it('a PC has 10 + CON slots', () => expect(slotCount(2)).toBe(12));
  it('gear fills its slots and every 500 coins fill one more', () => {
    expect(slotsUsed([{ slots: 1 }, { slots: 2 }], 0)).toBe(3);
    expect(slotsUsed([{ slots: 1 }], 499)).toBe(1);
    expect(slotsUsed([{ slots: 1 }], 1000)).toBe(3);
  });
  it('fits an item only when its slots are free, coins included', () => {
    const nine = Array.from({ length: 9 }, () => ({ slots: 1 }));
    expect(fits(nine, 0, 1, 0)).toBe(true); // CON 0 gives 10 slots
    expect(fits(nine, 0, 2, 0)).toBe(false);
    expect(fits(nine, 500, 1, 0)).toBe(false);
  });
  it('wounds fill slots from the top, so gear reaching into them is dropped', () => {
    expect(droppedSlots(12, 12, 2)).toBe(2);
    expect(droppedSlots(10, 12, 2)).toBe(0);
  });
});

describe('armor (pp. 4, 38)', () => {
  const pieces = (n: number) => Array.from({ length: n }, () => ({ armor: true }));
  it('AC is 11 + one point per armor piece', () => {
    expect(armorClass([])).toBe(11);
    expect(armorClass([...pieces(2), { armor: false }])).toBe(13);
  });
  it('7 pieces is the most, AC 18', () => expect(armorClass(pieces(9))).toBe(18));
});

describe('leveling (p. 6)', () => {
  it('has ten levels at the XP thresholds of the table', () => {
    expect(LEVELS.map((l) => l.xp)).toEqual([0, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000]);
    expect(LEVELS.map((l) => l.title).at(-1)).toBe('Knave');
  });
  it('finds the level for XP', () => {
    expect([0, 1999, 2000, 124999, 125000, 500000, 9999999].map(levelFor)).toEqual([1, 1, 2, 7, 8, 10, 10]);
  });
  it('rerolls HP with one d6 per level, or adds 1 to the last maximum when the roll is not higher', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999); // every d6 is a 6
    expect(rerolledHp(2, 5)).toBe(12);
    vi.spyOn(Math, 'random').mockReturnValue(0); // every d6 is a 1
    expect(rerolledHp(2, 5)).toBe(6);
  });
  it('adds 1 to three different scores, never past 10', () => {
    const s = { str: 10, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    expect(raiseScores(s, ['str', 'dex', 'dex', 'con'])).toEqual({ str: 10, dex: 1, con: 1, int: 0, wis: 0, cha: 0 });
  });
  it('picks three different scores at random', () => {
    for (let i = 0; i < 50; i++) expect(new Set(rollPicks()).size).toBe(3);
  });
});

describe('checks and attacks (pp. 6-7, 20)', () => {
  it('the target is 11 + difficulty', () => expect(checkTarget(5)).toBe(16));
  it('meeting the target succeeds', () => {
    expect(checkResult(10, 6, 16, false).hit).toBe(true);
    expect(checkResult(9, 6, 16, false).hit).toBe(false);
  });
  it('an attack total of 21 or more earns a free maneuver', () => {
    expect(checkResult(18, 3, 12, true).notes).toEqual(['free maneuver']);
    expect(checkResult(17, 3, 12, true).notes).toEqual([]);
  });
  it('an unmodified 1 breaks the weapon', () => expect(checkResult(1, 2, 12, true).notes).toEqual(['weapon breaks']));
  it('a plain check has no attack notes', () => expect(checkResult(1, 30, 12, false).notes).toEqual([]));
});

describe('creation tables (pp. 4-5, 22-25)', () => {
  it('has 100 careers of three items and 100 spells', () => {
    expect(CAREERS).toHaveLength(100);
    expect(CAREERS.every((c) => c.items.length === 3)).toBe(true);
    expect(SPELLS).toHaveLength(100);
  });
  it('row 1 and row 00 are the ends of the tables', () => {
    expect([CAREERS[0]!.name, CAREERS[99]!.name]).toEqual(['acolyte', 'woodcutter']);
    expect([SPELLS[0], SPELLS[99]]).toEqual(['adhere', 'x-ray vision']);
  });
  it('rolls land on a row, and the starting rolls stay in range', () => {
    for (let i = 0; i < 100; i++) {
      expect(CAREERS).toContain(rollCareer());
      expect(SPELLS).toContain(rollSpell());
      expect(rollHp()).toBeGreaterThanOrEqual(1);
      expect(rollHp()).toBeLessThanOrEqual(6);
      const coins = rollCoins();
      expect(coins % 10).toBe(0);
      expect(coins).toBeGreaterThanOrEqual(30);
      expect(coins).toBeLessThanOrEqual(180);
    }
  });
});

describe('careers on the sheet (p. 4)', () => {
  it('gives the three items of each career, in order', () => {
    expect(careerItems(['acolyte', 'acrobat'])).toEqual(['candlestick', 'censer', 'incense', 'flash powder', 'balls', 'lamp oil']);
    expect(careerItems(['nothing'])).toEqual([]);
  });
  // p. 4 says only "roll or pick two careers"; not taking one twice is this app's choice, since a repeat gains nothing.
  it('rolls again when it lands on a career already taken', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(0.015); // d100: 1, then 2
    expect(rollCareer(['acolyte']).name).toBe('acrobat');
  });
  describe('careers give their items (p. 4)', () => {
    const make = (name: string) => ({ name });
    const names = (items: { name: string }[]) => items.map((i) => i.name);

    it('adds the items of a career as it is chosen, keeping other gear', () => {
      expect(names(withCareerItems([make('rope')], [], ['acolyte'], make))).toEqual(['rope', 'candlestick', 'censer', 'incense']);
    });
    it('swaps only the changed career’s items', () => {
      const had = withCareerItems([], [], ['acolyte', 'acrobat'], make);
      const kept = had.filter((i) => i.name !== 'balls'); // dropped by the player, so it stays dropped
      expect(names(withCareerItems(kept, ['acolyte', 'acrobat'], ['actor', 'acrobat'], make))).toEqual([
        'flash powder',
        'lamp oil',
        'wig',
        'makeup',
        'costume',
      ]);
    });
    it('ticks one box per copy carried, so two of a name need two copies', () => {
      const gear = [make('lantern'), make('rope')];
      expect(carried(['lantern', 'mask', 'lantern'], gear)).toEqual([true, false, false]);
      expect(carried(['lantern', 'mask', 'lantern'], [...gear, make('lantern')])).toEqual([true, false, true]);
    });
    it('clearing the first career takes both careers’ items out', () => {
      const had = withCareerItems([], [], ['acolyte', 'acrobat'], make);
      expect(withCareerItems(had, ['acolyte', 'acrobat'], withCareer(['acolyte', 'acrobat'], 0, ''), make)).toEqual([]);
    });
    it('takes back one copy of a name shared with other gear, not all of them', () => {
      const had = [make("50' rope"), ...withCareerItems([], [], ['woodcutter'], make)];
      expect(names(withCareerItems(had, ['woodcutter'], [], make)).filter((n) => n === "50' rope")).toEqual(["50' rope"]);
    });
    it('gives all three of a repeated item', () => {
      expect(names(withCareerItems([], [], ['musician'], make))).toEqual(['instrument', 'instrument', 'instrument']);
    });
  });
  it('sets a slot, and clearing one clears the slots after it', () => {
    expect(withCareer([], 0, 'acolyte')).toEqual(['acolyte']);
    expect(withCareer(['acolyte'], 1, 'acrobat')).toEqual(['acolyte', 'acrobat']);
    expect(withCareer(['acolyte', 'acrobat'], 0, 'actor')).toEqual(['actor', 'acrobat']);
    expect(withCareer(['acolyte', 'acrobat'], 0, '')).toEqual([]);
    expect(withCareer(['acolyte', 'acrobat'], 1, '')).toEqual(['acolyte']);
  });
});
