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
import { saveCharacter, watchCharacter } from './characters';
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
