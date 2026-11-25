import { describe, it, expect, vi, beforeEach } from 'vitest';

const { saveDiff, remember, auth, snapshots } = vi.hoisted(() => ({
  saveDiff: vi.fn(() => Promise.resolve()),
  remember: vi.fn(),
  auth: { currentUser: null as { uid: string } | null },
  snapshots: [] as ((snap: unknown) => void)[],
}));
vi.mock('./diffSave', () => ({ saveDiff, remember, forget: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ db: {}, auth }));
vi.mock('firebase/firestore', () => ({
  collection: (_p: unknown, ...segs: string[]) => ({ path: segs.join('/') }),
  doc: (parent: { path: string }, id: string) => ({ id, path: `${parent.path}/${id}` }),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: (_ref: unknown, ok: (snap: unknown) => void) => void snapshots.push(ok),
}));

import { mockBasicCharacter } from '@/test/mocks/character-data';
import { getDoc, deleteDoc } from 'firebase/firestore';
import { saveCharacter, watchCharacter, watchUserCharacters, getCharacterById, deleteCharacter } from './characters';
import { OLD_BUILD_VERSION } from './characterMigration';
import { SCHEMA_VERSION } from './documentSchemas';

const legacy = { name: 'Brother Marcus', hp: { points: 5 } };
const open = () => {
  watchCharacter('alice', 'c1', vi.fn(), vi.fn());
  snapshots.at(-1)?.({ exists: () => true, data: () => legacy, ref: { id: 'c1' } });
};

// The rules let only the owner write, and a migration must not overwrite another device's fields.
describe('migrating an old character on open', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is skipped for anyone but the owner', () => {
    auth.currentUser = { uid: 'bob' };
    open();
    expect(saveDiff).not.toHaveBeenCalled();
  });

  it('saves only the changed fields, diffed against what is stored', () => {
    auth.currentUser = { uid: 'alice' };
    open();
    expect(remember).toHaveBeenCalledWith('characters/alice/c1', legacy);
    expect(saveDiff).toHaveBeenCalledWith({ id: 'c1' }, 'characters/alice/c1', expect.objectContaining({ name: 'Brother Marcus' }));
  });
});

const saved = () => (saveDiff.mock.calls.at(-1) as unknown as [unknown, string, Record<string, unknown>])[2];

describe('saveCharacter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gives a new character (an import too) a fresh createdAt, never the one it carries', async () => {
    await saveCharacter('alice', { ...mockBasicCharacter, createdAt: 1 });
    expect(saved()['createdAt']).toBeGreaterThan(1);
  });

  it('leaves createdAt alone on an existing character, so a save never invents one', async () => {
    await saveCharacter('alice', mockBasicCharacter, 'c1');
    expect(saved()).not.toHaveProperty('createdAt');
  });

  it('writes settings.version beside schemaVersion, for tabs on the previous build', async () => {
    await saveCharacter('alice', mockBasicCharacter, 'c1');
    expect(saved()).toMatchObject({ schemaVersion: SCHEMA_VERSION, settings: { version: OLD_BUILD_VERSION } });
  });
});

describe('watchUserCharacters', () => {
  beforeEach(() => vi.clearAllMocks());

  const list = (docs: unknown[]) => {
    const ok = vi.fn();
    watchUserCharacters('alice', ok, vi.fn());
    snapshots.at(-1)?.({ docs });
    return ok.mock.calls[0]![0];
  };
  const current = { ...mockBasicCharacter, schemaVersion: SCHEMA_VERSION, settings: { version: OLD_BUILD_VERSION } };

  it('lists each character by name, race, class, level and XP', () => {
    auth.currentUser = { uid: 'alice' };
    const items = list([{ id: 'c1', data: () => ({ ...current, name: 'Brom', xp: 40 }), ref: { id: 'c1' } }]);
    expect(items).toEqual([expect.objectContaining({ id: 'c1', name: 'Brom', race: 'human', class: 'fighter', level: 1, xp: 40 })]);
    expect(saveDiff).not.toHaveBeenCalled();
  });

  it('names a nameless character, and migrates an old one it lists, for its owner', () => {
    auth.currentUser = { uid: 'alice' };
    const items = list([{ id: 'c2', data: () => ({ hp: { points: 5 } }), ref: { id: 'c2' } }]);
    expect(items[0].name).toBe('Unnamed Character');
    expect(saveDiff).toHaveBeenCalledTimes(1);
  });
});

describe('watchCharacter when there is none', () => {
  it('says so with null', () => {
    const ok = vi.fn();
    watchCharacter('alice', 'gone', ok, vi.fn());
    snapshots.at(-1)?.({ exists: () => false });
    expect(ok).toHaveBeenCalledWith(null);
  });
});

describe('getCharacterById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the character, or null when there is none', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => true, data: () => ({ ...mockBasicCharacter, name: 'Brom' }) } as never);
    expect((await getCharacterById('alice', 'c1'))?.name).toBe('Brom');
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false } as never);
    expect(await getCharacterById('alice', 'c1')).toBeNull();
  });

  it('turns a failed read into a service error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getDoc).mockRejectedValueOnce(new Error('offline'));
    await expect(getCharacterById('alice', 'c1')).rejects.toThrow();
  });
});

describe('deleteCharacter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes the document', async () => {
    await deleteCharacter('alice', 'c1');
    expect(deleteDoc).toHaveBeenCalledWith({ id: 'c1', path: 'users/alice/characters/c1' });
  });

  it('turns a failed delete into a service error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('denied'));
    await expect(deleteCharacter('alice', 'c1')).rejects.toThrow();
  });
});
