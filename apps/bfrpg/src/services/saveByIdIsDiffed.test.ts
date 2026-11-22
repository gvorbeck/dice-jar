import { describe, it, expect, vi, beforeEach } from 'vitest';

const { saveDiff } = vi.hoisted(() => ({ saveDiff: vi.fn() }));
vi.mock('./diffSave', () => ({ saveDiff, remember: vi.fn(), forget: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: (_p: unknown, ...segs: string[]) => ({ path: segs.join('/') }),
  doc: (parent: { path: string }, id?: string) => ({ id: id ?? 'fresh', path: `${parent.path}/${id ?? 'fresh'}` }),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  deleteDoc: vi.fn(),
}));

import { saveCharacter } from './characters';
import { saveGame } from './games';

// A save that names an id must read the document first (saveDiff's `existing`), or it overwrites another device's changes.
describe('saving by id', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['character', (id?: string) => saveCharacter('u', { name: 'A', settings: {} } as never, id)],
    ['game', (id?: string) => saveGame('u', { name: 'G' } as never, id)],
  ])('a %s with an id is saved as an existing document, one without as new', async (_name, save) => {
    await save('abc');
    expect(saveDiff.mock.calls[0]?.[3]).toBe(true);
    await save();
    expect(saveDiff.mock.calls[1]?.[3]).toBe(false);
  });
});
