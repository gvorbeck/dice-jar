import { describe, expect, it } from 'vitest';
import { ALL_PLAYBOOK_MOVES } from './allPlaybookMoves';
import { BACKGROUND_FORCED_MOVES } from './index';

// Move IDs are saved in Firestore (typeMoves keys), so a rename must never reach them.
const moves = Object.values(ALL_PLAYBOOK_MOVES).flat();
const ids = new Set(moves.map((m) => m.id));

describe('move ids', () => {
  it('are plain kebab-case slugs, each used once', () => {
    for (const m of moves) expect(m.id).toMatch(/^[a-z0-9-]+$/);
    expect(ids.size).toBe(moves.length);
  });

  it('are the ids players already have saved', () => {
    expect([...ids].sort()).toMatchSnapshot();
  });

  it('are all that `requires` and the forced background moves point at', () => {
    for (const m of moves) for (const r of m.requires ?? []) expect(ids, `${m.id} requires ${r}`).toContain(r);
    for (const forced of Object.values(BACKGROUND_FORCED_MOVES))
      for (const list of Object.values(forced ?? {})) for (const id of list) expect(ids).toContain(id);
  });
});
