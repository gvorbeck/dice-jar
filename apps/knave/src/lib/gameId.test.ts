import { describe, expect, it } from 'vitest';
import { slugifyGameId } from '@dice-jar/game-id';
import { isOpenableId, makeGameId, MIN_ID } from './gameId';

describe('game IDs', () => {
  it('makes a readable ID that is already a valid slug', () => {
    for (let i = 0; i < 100; i++) {
      const id = makeGameId();
      expect(id).toMatch(/^[a-z]+(-[a-z]+)?-[a-z]+(-[a-z]+)?-[a-z0-9]{6}$/);
      expect(slugifyGameId(id)).toBe(id);
      expect(isOpenableId(id)).toBe(true);
    }
  });
  it('opens only IDs that are slugs and long enough', () => {
    expect(isOpenableId('a'.repeat(MIN_ID))).toBe(true);
    expect(isOpenableId('a'.repeat(MIN_ID - 1))).toBe(false);
    expect(isOpenableId('Not A Slug')).toBe(false);
  });
});
