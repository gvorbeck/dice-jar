import { describe, expect, it } from 'vitest';
import { compareBackups } from './compareBackups.ts';

const game = (over: Record<string, unknown> = {}) => ({ name: 'A', createdAt: 1, characters: [{ id: 'c1', name: 'x' }], ...over });

describe('compareBackups', () => {
  it('counts games that are the same, whatever the order of their keys', () => {
    const first = { a: game(), b: game({ name: 'B' }) };
    const second = { b: { characters: [{ name: 'x', id: 'c1' }], createdAt: 1, name: 'B' }, a: game() };
    expect(compareBackups(first, second)).toEqual({ same: 2, differ: [], onlyInFirst: [], onlyInSecond: [] });
  });

  it('lists a game whose contents changed', () => {
    expect(compareBackups({ a: game() }, { a: game({ characters: [] }) }).differ).toEqual(['a']);
  });

  it('lists games that are in only one of the two', () => {
    const result = compareBackups({ a: game(), gone: game() }, { a: game(), fresh: game() });
    expect(result).toMatchObject({ same: 1, onlyInFirst: ['gone'], onlyInSecond: ['fresh'] });
  });

  it('treats an empty list of rolls the same as none', () => {
    expect(compareBackups({ a: game({ diceRolls: [] }) }, { a: game() }).same).toBe(1);
  });
});
