import { describe, expect, it } from 'vitest';
import { auditGames } from './gameAudit.ts';

const ok = {
  name: 'A',
  createdAt: 1,
  characters: [{ id: 'c1', name: 'x', playbook: 'blessed', data: { k: [1] } }],
  diceRolls: [{ id: 'r1', createdAt: 1 }],
};

describe('auditGames', () => {
  it('passes a game that moves exactly and counts what is in it', () => {
    const [a] = auditGames({ g1: ok });
    expect(a).toMatchObject({ id: 'g1', problems: [], characters: 1, rolls: 1 });
    expect(a!.bytes).toBeGreaterThan(50);
  });

  it('refuses a game with a bad character id and says why', () => {
    const [a] = auditGames({ g2: { ...ok, characters: [{ name: 'no id' }] } });
    expect(a!.problems).toEqual(['characters[0] has no usable id']);
  });

  it('allows an empty roll list, which comes back absent', () => {
    expect(auditGames({ g3: { ...ok, diceRolls: [] } })[0]!.problems).toEqual([]);
  });

  it('audits every game, in order', () => {
    expect(auditGames({ a: ok, b: { ...ok, characters: 'x' }, c: ok }).map((x) => [x.id, x.problems.length])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 0],
    ]);
  });
});
