import { describe, expect, it } from 'vitest';
import { isOpenableId, slugifyGameId } from '@dice-jar/game-id';
import { makeGameId } from './gameId';
import { MAX_ID } from './paths';

describe('game IDs', () => {
  it('makes a readable ID that is already a valid slug', () => {
    for (let i = 0; i < 100; i++) {
      const id = makeGameId();
      expect(id).toMatch(/^[a-z]+(-[a-z]+)?-[a-z]+(-[a-z]+)?-[a-z0-9]{6}$/);
      expect(slugifyGameId(id)).toBe(id);
      expect(isOpenableId(id, MAX_ID)).toBe(true);
    }
  });
});
