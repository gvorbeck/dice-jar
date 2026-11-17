import { describe, expect, it } from 'vitest';
import { newGameId, slugifyGameId } from '@dice-jar/game-id';
import { CODENAMES } from '../rules/data/random';

describe('game IDs', () => {
  it('generates a readable ID that is already a valid slug', () => {
    for (let i = 0; i < 50; i++) {
      const id = newGameId(CODENAMES);
      expect(id).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{6}$/);
      expect(slugifyGameId(id)).toBe(id);
    }
  });
});
