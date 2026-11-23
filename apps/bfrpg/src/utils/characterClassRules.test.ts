import '@/utils'; // first: validation/rules and utils import each other, and this order is the one that loads
import { describe, it, expect } from 'vitest';
import { allClasses, allRaces } from '@/data';
import { createMockCharacter } from '@/test/helpers';
import {
  getSpellSlots,
  getRacialModificationInfo,
  isCurrentClassStillValid,
  hasRequiredStartingSpells,
  getPrimaryClassInfo,
} from './character';

const slots = (cls: string, level: number) => getSpellSlots(createMockCharacter({ class: cls, level }), allClasses);

// Magic-User spells per day, Core Rules p. 8: level -> [1st..6th level spells].
describe('getSpellSlots for a Magic-User (Core Rules p. 8)', () => {
  it.each([
    [1, { 1: 1 }],
    [2, { 1: 2 }],
    [3, { 1: 2, 2: 1 }],
    [5, { 1: 2, 2: 2, 3: 1 }],
    [9, { 1: 3, 2: 3, 3: 2, 4: 2, 5: 1 }],
    [11, { 1: 4, 2: 4, 3: 3, 4: 2, 5: 2, 6: 1 }],
    [20, { 1: 6, 2: 5, 3: 5, 4: 4, 5: 4, 6: 3 }],
  ])('level %i', (level, expected) => {
    expect(slots('magic-user', level)).toEqual(expected);
  });
});

// Cleric spells per day, Core Rules p. 7: no spells at 1st level.
describe('getSpellSlots for a Cleric (Core Rules p. 7)', () => {
  it.each([
    [1, {}],
    [2, { 1: 1 }],
    [4, { 1: 2, 2: 1 }],
    [10, { 1: 3, 2: 3, 3: 2, 4: 2, 5: 1 }],
    [20, { 1: 6, 2: 5, 3: 5, 4: 4, 5: 3, 6: 3 }],
  ])('level %i', (level, expected) => {
    expect(slots('cleric', level)).toEqual(expected);
  });

  it('gives a Fighter none, and a custom class a table of its own', () => {
    expect(slots('fighter', 5)).toEqual({});
    expect(typeof slots('witch', 5)).toBe('object');
  });
});

// Elves never roll larger than d6 for hit points (Core Rules p. 5).
describe('getRacialModificationInfo', () => {
  it('flags an Elf Fighter, whose d8 becomes a d6', () => {
    const info = getRacialModificationInfo(createMockCharacter({ race: 'elf', class: 'fighter' }));
    expect(info).toMatchObject({ originalHitDie: '1d8', modificationType: 'restriction' });
  });

  it('says nothing when the race leaves the hit die alone, or the class is custom', () => {
    expect(getRacialModificationInfo(createMockCharacter({ race: 'human', class: 'fighter' }))).toBeNull();
    expect(getRacialModificationInfo(createMockCharacter({ race: 'elf', class: 'witch' }))).toBeNull();
  });
});

// Dwarves may become Clerics, Fighters or Thieves (Core Rules p. 5).
describe('isCurrentClassStillValid', () => {
  const dwarf = allRaces.find((r) => r.id === 'dwarf')!;

  it('checks the class against what the race allows', () => {
    expect(isCurrentClassStillValid(createMockCharacter({ class: 'thief' }), dwarf, allClasses)).toBe(true);
    expect(isCurrentClassStillValid(createMockCharacter({ class: 'magic-user' }), dwarf, allClasses)).toBe(false);
  });

  it('allows a custom class anywhere, and having no class yet', () => {
    expect(isCurrentClassStillValid(createMockCharacter({ class: 'witch' }), dwarf, allClasses)).toBe(true);
    expect(isCurrentClassStillValid(createMockCharacter({ class: '' }), dwarf, allClasses)).toBe(true);
  });
});

// A first level Magic-User knows read magic and one other first level spell (Core Rules p. 8).
describe('hasRequiredStartingSpells', () => {
  const spell = (level: Record<string, number | null>) => ({ name: 'Sleep', level }) as never;

  it('needs a Magic-User, and a combination class with magic, to pick a first level spell', () => {
    expect(hasRequiredStartingSpells(createMockCharacter({ class: 'magic-user', spells: [] }), allClasses)).toBe(false);
    expect(hasRequiredStartingSpells(createMockCharacter({ class: 'magic-user', spells: [spell({ 'magic-user': 1 })] }), allClasses)).toBe(
      true,
    );
    expect(hasRequiredStartingSpells(createMockCharacter({ class: 'fighter-magic-user', spells: [] }), allClasses)).toBe(false);
    expect(
      hasRequiredStartingSpells(createMockCharacter({ class: 'fighter-magic-user', spells: [spell({ 'magic-user': 1 })] }), allClasses),
    ).toBe(true);
  });

  it('asks nothing of other classes, a custom class without spells, or no class', () => {
    expect(hasRequiredStartingSpells(createMockCharacter({ class: 'fighter' }), allClasses)).toBe(true);
    expect(hasRequiredStartingSpells(createMockCharacter({ class: 'witch', spells: [] }), allClasses)).toBe(true);
    expect(hasRequiredStartingSpells(createMockCharacter({ class: '' }), allClasses)).toBe(true);
  });
});

describe('getPrimaryClassInfo', () => {
  it('returns the standard class, a custom class from the character, or nothing', () => {
    expect(getPrimaryClassInfo(createMockCharacter({ class: 'fighter' }), allClasses)).toMatchObject({ id: 'fighter', isCustom: false });
    expect(getPrimaryClassInfo(createMockCharacter({ class: 'witch' }), allClasses)).toMatchObject({
      id: 'witch',
      isCustom: true,
      usesSpells: false,
    });
    expect(getPrimaryClassInfo(createMockCharacter({ class: '' }), allClasses)).toBeNull();
  });
});
