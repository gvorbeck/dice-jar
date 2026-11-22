import type { Firestore } from 'firebase-admin/firestore';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { REMOVED } from '@dice-jar/diff';
import { planMigration, sameData, type Kind } from '@/services/migrateDocuments';

type Doc = Record<string, unknown>;
export type Backup = Record<string, { data: Doc; created: number; updated: number }>;
export type Report = {
  current: string[];
  migrated: string[];
  refused: [path: string, reason: string][];
  changedSinceBackup: string[];
  left: number;
};

const kindOf = (docPath: string): Kind => (docPath.split('/')[2] === 'games' ? 'games' : 'characters');

/** What migrating would do to each document in a backup, from the file alone: nothing is read or written. */
export const planAll = (backup: Backup) =>
  Object.entries(backup).map(([docPath, { data, created, updated }]) => ({
    docPath,
    plan: planMigration(kindOf(docPath), data, { created, updated }),
  }));

/**
 * Migrates what a backup says needs it, and nothing else.
 * Cost: a document already current costs nothing; one that migrates costs 1 read and 1 write (a transaction that checks it is still
 * what the backup holds, then writes only the changed fields), plus 1 more read with `verify`. `done` paths (a previous run) are skipped free.
 */
export async function migrateAll(
  db: () => Firestore, // only called when writing, so a dry run needs no credentials
  backup: Backup,
  opts: {
    write: boolean;
    only?: string[] | undefined;
    limit?: number | undefined;
    done?: Set<string>;
    verify?: boolean;
    onMigrated?: (docPath: string) => void;
  },
): Promise<Report> {
  const report: Report = { current: [], migrated: [], refused: [], changedSinceBackup: [], left: 0 };
  let budget = opts.limit ?? Infinity;
  let database: Firestore | undefined;
  for (const { docPath, plan } of planAll(backup)) {
    if (opts.only && !opts.only.includes(docPath)) continue;
    if (opts.done?.has(docPath) || plan.status === 'current') report.current.push(docPath);
    else if (plan.status === 'refused') report.refused.push([docPath, plan.reason]);
    else if (budget <= 0) report.left++;
    else {
      budget--;
      if (!opts.write) {
        report.migrated.push(docPath);
        continue;
      }
      database ??= db(); // once: the Admin SDK refuses to start a second app
      const ref = database.doc(docPath);
      const applied = await database.runTransaction(async (tx) => {
        const now = await tx.get(ref);
        if (!now.exists || !sameData(backup[docPath]!.data, now.data())) return false; // changed since the backup: leave it
        const pairs = plan.changes.flatMap(([path, value]) => [new FieldPath(...path), value === REMOVED ? FieldValue.delete() : value]);
        tx.update(ref, ...(pairs as [FieldPath, unknown, ...unknown[]]));
        return true;
      });
      if (!applied) report.changedSinceBackup.push(docPath);
      else if (opts.verify && !sameData((await ref.get()).data(), plan.next)) {
        throw new Error(`${docPath} does not read back as planned`);
      } else {
        report.migrated.push(docPath);
        opts.onMigrated?.(docPath);
      }
    }
  }
  return report;
}
