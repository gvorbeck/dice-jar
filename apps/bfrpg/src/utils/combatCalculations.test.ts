import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { createMockCharacter } from '@/test/helpers';
import { getBaseAttackBonus, getSavingThrows } from './combatCalculations';

// Attack Bonus Table, Core Rules p. 53: [first level of each band, bonus].
const FIGHTER_BANDS = [[1, 1], [2, 2], [4, 3], [5, 4], [7, 5], [8, 6], [11, 7], [13, 8], [16, 9], [18, 10]] as const; // prettier-ignore
const CLERIC_THIEF_BANDS = [[1, 1], [3, 2], [5, 3], [7, 4], [9, 5], [12, 6], [15, 7], [18, 8]] as const; // prettier-ignore
const MAGIC_USER_BANDS = [[1, 1], [4, 2], [6, 3], [9, 4], [13, 5], [16, 6], [19, 7]] as const; // prettier-ignore

describe('getBaseAttackBonus (Core Rules p. 53)', () => {
  it.each([
    ['fighter', FIGHTER_BANDS],
    ['cleric', CLERIC_THIEF_BANDS],
    ['thief', CLERIC_THIEF_BANDS],
    ['magic-user', MAGIC_USER_BANDS],
  ] as const)('%s steps up at the start of each band and not before', (cls, bands) => {
    for (const [level, bonus] of bands) {
      expect(getBaseAttackBonus(level, cls), `${cls} level ${level}`).toBe(bonus);
      if (level > 1) expect(getBaseAttackBonus(level - 1, cls), `${cls} level ${level - 1}`).toBe(bonus - 1);
    }
  });

  it('has no bonus below level 1, or for an unknown class', () => {
    expect(getBaseAttackBonus(0, 'fighter')).toBe(0);
    expect(getBaseAttackBonus(5, 'witch')).toBe(0);
  });

  it('gives a combination class the better of its two progressions', () => {
    expect(getBaseAttackBonus(7, 'fighter-magic-user')).toBe(getBaseAttackBonus(7, 'fighter'));
    expect(getBaseAttackBonus(7, 'magic-user-thief')).toBe(getBaseAttackBonus(7, 'thief'));
    expect(getBaseAttackBonus(0, 'fighter-magic-user')).toBe(0);
    expect(getBaseAttackBonus(0, 'magic-user-thief')).toBe(0);
  });
});

// Saving Throw Tables by Class, Core Rules p. 61: [first level of each band, Death Ray, Wands, Paralysis, Breath].
const CLERIC_SAVES = [[1, 11, 12, 14, 16], [2, 10, 11, 13, 15], [4, 9, 10, 13, 15], [6, 9, 10, 12, 14], [8, 8, 9, 12, 14], [10, 8, 9, 11, 13], [12, 7, 8, 11, 13], [14, 7, 8, 10, 12], [16, 6, 7, 10, 12], [18, 6, 7, 9, 11], [20, 5, 6, 9, 11]] as const; // prettier-ignore
const FIGHTER_SAVES = [[1, 12, 13, 14, 15], [2, 11, 12, 14, 15], [4, 11, 11, 13, 14], [6, 10, 11, 12, 14], [8, 9, 10, 12, 13], [10, 9, 9, 11, 12], [12, 8, 9, 10, 12], [14, 7, 8, 10, 11], [16, 7, 7, 9, 10], [18, 6, 7, 8, 10], [20, 5, 6, 8, 9]] as const; // prettier-ignore

describe('getSavingThrows (Core Rules p. 61)', () => {
  it.each([
    ['cleric', CLERIC_SAVES],
    ['fighter', FIGHTER_SAVES],
  ] as const)('%s matches the book at the start of every band', (cls, rows) => {
    for (const [level, deathRay, magicWands, paralysis, dragonBreath] of rows) {
      const saves = getSavingThrows(createMockCharacter({ class: cls, race: 'human', level }));
      expect(saves, `${cls} level ${level}`).toMatchObject({ deathRay, magicWands, paralysis, dragonBreath });
    }
  });

  it('holds a band until the next one starts', () => {
    const at = (level: number) => getSavingThrows(createMockCharacter({ class: 'fighter', race: 'human', level }));
    expect(at(5)).toEqual(at(4));
    expect(at(3)).toEqual(at(2));
  });

  it('treats an unknown class like a Fighter', () => {
    const level = 4;
    expect(getSavingThrows(createMockCharacter({ class: 'witch', race: 'human', level }))).toEqual(
      getSavingThrows(createMockCharacter({ class: 'fighter', race: 'human', level })),
    );
  });

  // Dwarves and Halflings: +4 vs everything but Dragon Breath (+3), p. 5 and p. 6. Elves: +1 Paralysis, +2 Wands and Spells, p. 5.
  it('lowers the target numbers by the racial bonus', () => {
    const human = getSavingThrows(createMockCharacter({ class: 'fighter', race: 'human', level: 1 }));
    const bonus = (race: string) => {
      const s = getSavingThrows(createMockCharacter({ class: 'fighter', race, level: 1 }));
      return [
        human.deathRay - s.deathRay,
        human.magicWands - s.magicWands,
        human.paralysis - s.paralysis,
        human.dragonBreath - s.dragonBreath,
        human.spells - s.spells,
      ];
    };
    expect(bonus('dwarf')).toEqual([4, 4, 4, 3, 4]);
    expect(bonus('halfling')).toEqual([4, 4, 4, 3, 4]);
    expect(bonus('elf')).toEqual([0, 2, 1, 0, 2]);
    expect(bonus('human')).toEqual([0, 0, 0, 0, 0]);
  });

  it('never needs less than 1', () => {
    const saves = getSavingThrows(createMockCharacter({ class: 'fighter', race: 'dwarf', level: 20 }));
    expect(Math.min(...Object.values(saves))).toBeGreaterThanOrEqual(1);
  });
});

// The rest of the Saving Throw Tables by Class, Core Rules p. 61: every column for the Magic-User and Thief, and the Spells column of
// the Cleric and Fighter (printed as a leading column of the next table). [first level of each band, Death Ray, Wands, Paralysis,
// Breath, Spells].
const MAGIC_USER_SAVES = [[1, 13, 14, 13, 16, 15], [2, 13, 14, 13, 15, 14], [4, 12, 13, 12, 15, 13], [6, 12, 12, 11, 14, 13], [8, 11, 11, 10, 14, 12], [10, 11, 10, 9, 13, 11], [12, 10, 10, 9, 13, 11], [14, 10, 9, 8, 12, 10], [16, 9, 8, 7, 12, 9], [18, 9, 7, 6, 11, 9], [20, 8, 6, 5, 11, 8]] as const; // prettier-ignore
const THIEF_SAVES = [[1, 13, 14, 13, 16, 15], [2, 12, 14, 12, 15, 14], [4, 11, 13, 12, 14, 13], [6, 11, 13, 11, 13, 13], [8, 10, 12, 11, 12, 12], [10, 9, 12, 10, 11, 11], [12, 9, 10, 10, 10, 11], [14, 8, 10, 9, 9, 10], [16, 7, 9, 9, 8, 9], [18, 7, 9, 8, 7, 9], [20, 6, 8, 8, 6, 8]] as const; // prettier-ignore
const CLERIC_SPELLS = [[1, 15], [2, 14], [4, 14], [6, 13], [8, 13], [10, 12], [12, 12], [14, 11], [16, 11], [18, 10], [20, 10]] as const; // prettier-ignore
const FIGHTER_SPELLS = [[1, 17], [2, 16], [4, 15], [6, 15], [8, 14], [10, 13], [12, 13], [14, 12], [16, 11], [18, 11], [20, 10]] as const; // prettier-ignore

describe('getSavingThrows, the rest of the table (Core Rules p. 61)', () => {
  const saves = (cls: string, level: number) => getSavingThrows(createMockCharacter({ class: cls, race: 'human', level }));

  it.each([
    ['magic-user', MAGIC_USER_SAVES],
    ['thief', THIEF_SAVES],
  ] as const)('%s matches the book in every column at the start of every band', (cls, rows) => {
    for (const [level, deathRay, magicWands, paralysis, dragonBreath, spells] of rows) {
      expect(saves(cls, level), `${cls} level ${level}`).toEqual({ deathRay, magicWands, paralysis, dragonBreath, spells });
    }
  });

  it.each([
    ['cleric', CLERIC_SPELLS],
    ['fighter', FIGHTER_SPELLS],
  ] as const)('%s matches the book in the Spells column', (cls, rows) => {
    for (const [level, spells] of rows) expect(saves(cls, level).spells, `${cls} level ${level}`).toBe(spells);
  });

  it('uses the table of its type for a supplement class', () => {
    expect(saves('illusionist', 5)).toEqual(saves('magic-user', 5));
    expect(saves('assassin', 5)).toEqual(saves('thief', 5));
    expect(saves('druid', 5)).toEqual(saves('cleric', 5));
    expect(saves('ranger', 5)).toEqual(saves('fighter', 5));
  });
});

// Racial saving throw bonuses [Death Ray or Poison, Magic Wands, Paralysis or Petrify, Dragon Breath, Spells], from each race's own
// entry: Half Humans Supplement p. 1 (Half-elf, Half-orc), Dokkalfar p. 1, New Races Supplement pp. 2-4 (Canein, Chelonian, Phaerim,
// and Faun, who save like Dwarves, p. 3). The book's "Poison" is the Death Ray or Poison save.
describe('racial saving throw bonuses from the race data', () => {
  const bonus = (race: string) => {
    const base = getSavingThrows(createMockCharacter({ class: 'fighter', race: 'human', level: 1 }));
    const s = getSavingThrows(createMockCharacter({ class: 'fighter', race, level: 1 }));
    return [base.deathRay - s.deathRay, base.magicWands - s.magicWands, base.paralysis - s.paralysis, base.dragonBreath - s.dragonBreath, base.spells - s.spells]; // prettier-ignore
  };

  it('finds a race stored with capital letters', () => {
    expect(bonus('Faun')).toEqual([4, 4, 4, 3, 4]);
  });

  it.each([
    ['half-elf', [0, 1, 0, 0, 1]],
    ['half-orc', [1, 0, 0, 0, 0]],
    ['dokkalfar', [2, 2, 0, 0, 2]],
    ['canein', [2, 0, 2, 0, 0]],
    ['chelonian', [2, 0, 0, 0, 0]],
    ['phaerim', [0, 2, 1, 0, 2]],
    ['faun', [4, 4, 4, 3, 4]],
    ['gnome', [4, 0, 0, 3, 0]], // Gnomes Supplement p. 1
    ['half-ogre', [0, 0, 0, 0, 0]],
  ])('a %s gets %j', (race, expected) => {
    expect(bonus(race)).toEqual(expected);
  });
});
