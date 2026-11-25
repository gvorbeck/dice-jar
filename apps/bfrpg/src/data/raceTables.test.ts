import { describe, it, expect } from 'vitest';
import { allRaces } from './index';

const FOUR = ['cleric', 'fighter', 'magic-user', 'thief'];
const COMBINATIONS = ['fighter-magic-user', 'magic-user-thief'];

// [race id, the core classes and combinations it may be, ability limits, book page]. Limits are 'ability>=min' or 'ability<=max'.
const BOOK = [
  ['human', FOUR, [], 'Core Rules p. 5'],
  ['dwarf', ['cleric', 'fighter', 'thief'], ['constitution>=9', 'charisma<=17'], 'Core Rules p. 5'],
  ['elf', [...FOUR, ...COMBINATIONS], ['intelligence>=9', 'constitution<=17'], 'Core Rules p. 5'],
  ['halfling', ['cleric', 'fighter', 'thief'], ['dexterity>=9', 'strength<=17'], 'Core Rules p. 6'],
  ['dokkalfar', [...FOUR, ...COMBINATIONS], ['intelligence>=9', 'constitution<=17'], 'Dokkalfar p. 1'],
  ['gnome', [...FOUR, 'magic-user-thief'], ['constitution>=9', 'strength<=17'], 'Gnomes Supplement p. 1'],
  ['half-elf', [...FOUR, ...COMBINATIONS], ['intelligence>=9', 'constitution<=17'], 'Half Humans Supplement p. 1'],
  ['half-orc', FOUR, ['constitution>=9', 'intelligence<=17'], 'Half Humans Supplement p. 1 (any class)'],
  [
    'half-ogre',
    ['cleric', 'fighter'],
    ['strength>=13', 'constitution>=13', 'intelligence<=15', 'wisdom<=15'],
    'Half Humans Supplement p. 1',
  ],
  ['faun', FOUR, ['constitution>=9', 'charisma<=15'], 'New Races Supplement p. 3 (any class)'],
] as const;

const limits = (race: (typeof allRaces)[number]) =>
  race.abilityRequirements.map((r) => (r.min ? `${r.ability}>=${r.min}` : `${r.ability}<=${r.max}`)).sort();

describe.each(BOOK)('race %s', (id, classes, abilityLimits, source) => {
  const race = allRaces.find((r) => r.id === id)!;

  it(`may be ${classes.join(', ')} (${source})`, () => {
    const core = [...FOUR, ...COMBINATIONS];
    expect(race.allowedClasses.filter((c) => core.includes(c)).sort()).toEqual([...classes].sort());
  });

  it(`has the ability limits ${abilityLimits.join(', ') || 'none'} (${source})`, () => {
    expect(limits(race)).toEqual([...abilityLimits].sort());
  });
});

// Only humans, or half-humans if the GM uses that option, can become Druids (Druid Supplement p. 1); a Faun may be one (New Races p. 3).
describe('who may be a Druid', () => {
  const druids = allRaces.filter((r) => r.allowedClasses.includes('druid')).map((r) => r.id);

  it('is not an Elf, Dwarf, Halfling, Dokkalfar or Gnome, whose own entries do not list it', () => {
    for (const id of ['elf', 'dwarf', 'halfling', 'dokkalfar', 'gnome']) expect(druids).not.toContain(id);
  });

  it('is a human, a half-human, or a Faun', () => {
    expect(druids).toEqual(expect.arrayContaining(['human', 'half-elf', 'half-orc', 'faun']));
  });
});
