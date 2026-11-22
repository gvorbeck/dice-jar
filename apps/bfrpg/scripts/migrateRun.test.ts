import { describe, expect, it, vi } from 'vitest';
import { getAllSampleCharacters } from '@/data/sampleCharacters';
import { migrateAll, type Backup } from './migrateRun';

vi.mock('firebase-admin/firestore', () => ({
  FieldPath: class {
    constructor(...path: string[]) {
      Object.assign(this, { path });
    }
  },
  FieldValue: { delete: () => 'DELETE' },
}));

// Characters stored before schemaVersion, as a backup file holds them.
const old = () => {
  const { schemaVersion: _v, ...character } = structuredClone(getAllSampleCharacters()[0]!);
  return { ...character, settings: { version: 2.6 } } as Record<string, unknown>;
};
const backup = (): Backup =>
  Object.fromEntries(['c1', 'c2', 'c3'].map((id) => [`users/u1/characters/${id}`, { data: old(), created: 1, updated: 2 }]));

/** A Firestore holding `stored` per path; updates are recorded, not applied. */
const fakeDb = (stored: Record<string, Record<string, unknown>>) => {
  const updates: string[] = [];
  const db = {
    doc: (path: string) => ({ path }),
    runTransaction: async (fn: (tx: unknown) => Promise<boolean>) =>
      fn({
        get: async ({ path }: { path: string }) => ({ exists: path in stored, data: () => stored[path] }),
        update: ({ path }: { path: string }) => void updates.push(path),
      }),
  };
  return { db: () => db as never, updates };
};

describe('migrateAll', () => {
  it('writes nothing without write, and stops at the limit', async () => {
    const { db, updates } = fakeDb({});
    const report = await migrateAll(db, backup(), { write: false, limit: 2 });
    expect(report).toMatchObject({ migrated: ['users/u1/characters/c1', 'users/u1/characters/c2'], left: 1 });
    expect(updates).toEqual([]);
  });

  it('skips paths a previous run finished, and leaves a document that changed since the backup', async () => {
    const files = backup();
    const { db, updates } = fakeDb({
      'users/u1/characters/c2': { ...old(), name: 'Renamed on another device' },
      'users/u1/characters/c3': old(),
    });
    const onMigrated = vi.fn();
    const report = await migrateAll(db, files, { write: true, done: new Set(['users/u1/characters/c1']), onMigrated });
    expect(report.current).toEqual(['users/u1/characters/c1']);
    expect(report.changedSinceBackup).toEqual(['users/u1/characters/c2']);
    expect(report.migrated).toEqual(['users/u1/characters/c3']);
    expect(updates).toEqual(['users/u1/characters/c3']);
    expect(onMigrated).toHaveBeenCalledWith('users/u1/characters/c3');
  });
});
