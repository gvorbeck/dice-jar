import { describe, expect, it } from 'vitest';
import { statCap } from './statCap';
import { ALL_PLAYBOOK_MOVES } from '../rules/moves/allPlaybookMoves';

// Book 1, pp. 52, 106-107: Improved Stat raises a stat to at most +2; only Superior Stat (level 6+) reaches +3.
describe('statCap', () => {
  it('is +2 with no Superior Stat selected', () => {
    expect(statCap(undefined)).toBe(2);
    expect(statCap({})).toBe(2);
    expect(statCap({ 'judge-improved-stat': true })).toBe(2);
  });
  it('ignores a Superior Stat that is present but not selected', () => {
    expect(statCap({ 'judge-superior-stat': false })).toBe(2);
  });
  it('is +3 for the Superior Stat move of every playbook that has one, using the real move ids', () => {
    const ids = Object.values(ALL_PLAYBOOK_MOVES)
      .flat()
      .map((m) => m.id)
      .filter((id) => id.endsWith('superior-stat'));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(statCap({ [id]: true })).toBe(3);
  });
});
