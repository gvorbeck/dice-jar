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
