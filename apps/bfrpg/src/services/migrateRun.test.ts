// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { getAllSampleCharacters } from '@/data/sampleCharacters';
import { migrateAll, type Backup } from '../../scripts/migrateRun';

const backupOf = (count: number): Backup =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => {
      const { schemaVersion: _v, ...character } = structuredClone(getAllSampleCharacters()[0]!);
      return [`users/u/characters/c${i}`, { data: { ...character, settings: { version: 2.6 } }, created: 1, updated: 2 }];
    }),
  );

describe('migrateAll', () => {
  it('opens the database once however many documents it writes: the Admin SDK refuses a second app', async () => {
    const backup = backupOf(3);
    const update = vi.fn();
    const fake = {
      doc: (path: string) => ({ path }),
      runTransaction: async (run: (tx: unknown) => Promise<boolean>) =>
        run({ get: async (ref: { path: string }) => ({ exists: true, data: () => backup[ref.path]!.data }), update }),
    };
    const db = vi.fn(() => fake as never);
    const report = await migrateAll(db, backup, { write: true });
    expect(report.migrated).toHaveLength(3);
    expect(update).toHaveBeenCalledTimes(3);
    expect(db).toHaveBeenCalledTimes(1);
  });

  it('never opens the database for a dry run', async () => {
    const db = vi.fn();
    const report = await migrateAll(db as never, backupOf(2), { write: false });
    expect(report.migrated).toHaveLength(2);
    expect(db).not.toHaveBeenCalled();
  });
});
