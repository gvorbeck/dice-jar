import { describe, expect, it } from 'vitest';
import { isCreated, missing, newCharacter, parseCharacter, summary, type Character } from './character';

/** A character with everything PC Creation (p. 4) asks for. */
const done = (over: Partial<Character> = {}): Character => ({
  ...newCharacter(),
  created: true,
  name: 'Wren',
  abilities: { str: 1, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
  careers: ['acolyte', 'acrobat'],
  hp: 4,
  hpMax: 4,
  ...over,
});

describe('parseCharacter', () => {
  it('reads what newCharacter makes', () => expect(parseCharacter(newCharacter())).toEqual(newCharacter()));
  it('rejects a score above 10, a third career and unknown shapes', () => {
    const c = newCharacter();
    expect(() => parseCharacter({ ...c, abilities: { ...c.abilities, str: 11 } })).toThrow();
    expect(() => parseCharacter({ ...c, careers: ['a', 'b', 'c'] })).toThrow();
    expect(() => parseCharacter({ ...c, version: 2 })).toThrow();
    expect(() => parseCharacter('x')).toThrow();
  });
});

describe('missing', () => {
  it('lists the steps of PC Creation in order for a new character', () => {
    expect(missing(newCharacter())).toEqual(['Place 3 ability points', 'Choose two careers', 'Roll hit points', 'Name your character']);
  });
  it('is empty for a finished one', () => expect(missing(done())).toEqual([]));
  it('wants a name that is more than spaces', () => expect(missing(done({ name: '  ' }))).toEqual(['Name your character']));
  it('allows only the gear the slots can carry (p. 4)', () => {
    const items = Array.from({ length: 13 }, () => ({ name: 'rope', slots: 1, armor: false })); // CON 2 gives 12 slots
    expect(missing(done({ items }))).toEqual(['Carry no more than your item slots']);
    expect(missing(done({ items: items.slice(0, 12) }))).toEqual([]);
  });
});

describe('summary', () => {
  it('copies what the game page lists', () => {
    expect(summary(done({ name: ' Wren ' }))).toEqual({ name: 'Wren', careers: 'acolyte, acrobat', level: 1, hp: 4, hpMax: 4 });
  });
});

describe('isCreated', () => {
  it('is false for a new character and true once Open sheet has set the flag', () => {
    expect(isCreated(newCharacter())).toBe(false);
    expect(isCreated(done())).toBe(true);
  });
  it('does not depend on the name or the gear, which change in play', () => {
    const items = Array.from({ length: 20 }, () => ({ name: 'loot', slots: 1, armor: false }));
    expect(isCreated(done({ name: '', items }))).toBe(true);
  });
  it('stays false part-way through creation, so the gear step is still there after a reload', () => {
    expect(isCreated({ ...done(), created: false })).toBe(false);
  });
});
