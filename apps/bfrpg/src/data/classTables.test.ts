import { describe, it, expect } from 'vitest';
import { allClasses } from './index';

// Experience points to reach each level 1 to 20, from the class tables in the books.
const xp = (...points: number[]) => points;
const CLERIC = xp(0, 1500, 3000, 6000, 12000, 24000, 48000, 90000, 180000, 270000, 360000, 450000, 540000, 630000, 720000, 810000, 900000, 990000, 1080000, 1170000); // prettier-ignore
const MAGIC_USER = xp(0, 2500, 5000, 10000, 20000, 40000, 80000, 150000, 300000, 450000, 600000, 750000, 900000, 1050000, 1200000, 1350000, 1500000, 1650000, 1800000, 1950000); // prettier-ignore

// [class id, hit die, ability requirements, experience points, book page]
const BOOK = [
  ['fighter', '1d8', { strength: 9 }, xp(0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000, 480000, 600000, 720000, 840000, 960000, 1080000, 1200000, 1320000, 1440000, 1560000), 'Core Rules p. 7'], // prettier-ignore
  ['cleric', '1d6', { wisdom: 9 }, CLERIC, 'Core Rules p. 7'],
  ['magic-user', '1d4', { intelligence: 9 }, MAGIC_USER, 'Core Rules p. 8'],
  ['thief', '1d4', { dexterity: 9 }, xp(0, 1250, 2500, 5000, 10000, 20000, 40000, 75000, 150000, 225000, 300000, 375000, 450000, 525000, 600000, 675000, 750000, 825000, 900000, 975000), 'Core Rules p. 8'], // prettier-ignore
  ['ranger', '1d8', { strength: 9, wisdom: 11, dexterity: 11 }, xp(0, 2200, 4400, 8800, 17600, 35200, 70400, 132000, 264000, 396000, 528000, 660000, 792000, 924000, 1056000, 1188000, 1320000, 1452000, 1584000, 1716000), 'Rangers and Paladins p. 1'], // prettier-ignore
  ['paladin', '1d8', { strength: 9, wisdom: 11, charisma: 11 }, MAGIC_USER, 'Rangers and Paladins p. 2'],
  ['druid', '1d6', { wisdom: 9, charisma: 9 }, CLERIC, 'Druid Supplement p. 1'],
  ['scout', '1d6', { wisdom: 9, dexterity: 9 }, CLERIC, 'Scouts Supplement p. 1'],
] as const;

describe.each(BOOK)('class %s', (id, hitDie, requirements, points, source) => {
  const cls = allClasses.find((c) => c.id === id)!;

  it(`rolls ${hitDie} for hit points (${source})`, () => {
    expect(cls.hitDie).toBe(hitDie);
  });

  it(`needs ${JSON.stringify(requirements)} (${source})`, () => {
    const needs = Object.fromEntries((cls.abilityRequirements ?? []).map((r) => [r.ability, r.min]));
    expect(needs).toEqual(requirements);
  });

  it(`reaches each level at the experience points in ${source}`, () => {
    const table = Object.entries(cls.experienceTable ?? {}).map(([level, value]) => [Number(level), value]);
    expect(table).toEqual(points.map((value, i) => [i + 1, value]));
  });
});
