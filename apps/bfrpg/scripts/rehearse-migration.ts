// Runs the migration against the Firestore emulator only: `npm run rehearse-migration` (BACKUP=<file> to rehearse a real backup, otherwise built-in fixtures).
// Checks every migrated document reads back as planned, and that a second run writes nothing.
import * as fs from 'fs';
import { adminDb } from '@dice-jar/admin';
import { migrateAll, planAll, type Backup } from './migrateRun.ts';
import { sameData } from '@/services/migrateDocuments';
import { getAllSampleCharacters } from '@/data/sampleCharacters';
import { getAllSampleGames } from '@/data/sampleGames';

if (!process.env['FIRESTORE_EMULATOR_HOST']) {
  console.error('Rehearsals run only in the emulator: use `npm run rehearse-migration`.');
  process.exit(1);
}

const t = 1_700_000_000_000;
const fixtures = (): Backup => {
  const backup: Backup = {};
  const add = (path: string, data: Record<string, unknown>) => (backup[path] = { data, created: t, updated: t + 1000 });
  getAllSampleCharacters().forEach((c, i) => {
    const { schemaVersion: _v, ...rest } = c;
    add(`users/u1/characters/c${i}`, { ...rest, settings: { ...c.settings, version: 2.6 } }); // stored before schemaVersion
  });
  getAllSampleGames().forEach(({ id: _id, ...g }, i) => add(`users/u1/games/g${i}`, g));
  add('users/u1/characters/current', { ...getAllSampleCharacters()[0]!, createdAt: t, updatedAt: t });
  add('users/u2/characters/broken', { name: 'No sheet' }); // must be refused, never guessed at
  return backup;
};
const backup: Backup = process.env['BACKUP'] ? JSON.parse(fs.readFileSync(process.env['BACKUP'], 'utf8')) : fixtures();

const db = adminDb('demo-bfrpg');
for (const [path, { data }] of Object.entries(backup)) await db.doc(path).set(data);

const first = await migrateAll(() => db, backup, { write: true, verify: true });
console.log(`first run: ${first.migrated.length} migrated, ${first.current.length} current, ${first.refused.length} refused`);

// Every document the plan covers now holds exactly the planned result; refused ones were not touched.
const expected = new Map(planAll(backup).map(({ docPath, plan }) => [docPath, plan]));
const problems: string[] = [];
for (const [path, plan] of expected) {
  const now = (await db.doc(path).get()).data();
  if (plan.status === 'migrate' && !sameData(now, plan.next)) problems.push(`${path} does not read back as planned`);
  if (plan.status !== 'migrate' && !sameData(now, backup[path]!.data)) problems.push(`${path} changed but should not have`);
}

// A second run, planned from what the first left behind, has nothing to do.
const after: Backup = {};
for (const path of Object.keys(backup)) after[path] = { ...backup[path]!, data: (await db.doc(path).get()).data()! };
const second = await migrateAll(() => db, after, { write: true });
for (const path of second.migrated) {
  const plan = planAll({ [path]: after[path]! })[0]!.plan;
  const leaves = plan.status === 'migrate' ? plan.changes.map(([k]) => k.join('.')).join(', ') : plan.status;
  problems.push(`a second run still migrated ${path}: ${leaves}`);
}
console.log(`second run: ${second.migrated.length} migrated`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Rehearsal passed.');
