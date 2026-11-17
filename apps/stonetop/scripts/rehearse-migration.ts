// Rehearses the whole migration on a copy of a backup, in the Firestore emulator only: load it, move every game, check each one,
// put every game back, check again. Run it with `BACKUP=./firestore-backup-<timestamp>.json npm run rehearse-migration`.
import * as fs from 'fs';
import { adminDb } from './admin.ts';
import { sameGame } from './gameAudit.ts';
import { assembleGame, type Stored } from '../src/lib/gameShape.ts';
import { migrateAll, unmigrateGame } from './migrateCore.ts';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    'Refusing to run: this loads a whole backup, and must only ever write to the emulator (FIRESTORE_EMULATOR_HOST is not set).',
  );
  process.exit(1);
}
const file = process.env.BACKUP;
if (!file || !fs.existsSync(file)) {
  console.error('Set BACKUP to the path of a backup file.');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, Record<string, unknown>>;
const ids = Object.keys(backup);
const db = adminDb();

const writer = db.bulkWriter();
for (const id of ids) void writer.set(db.collection('games').doc(id), backup[id]!);
await writer.close();
console.log(`Loaded ${ids.length} games into the emulator.`);

const mismatches: string[] = [];
const stored = (snap: FirebaseFirestore.QuerySnapshot): Stored[] => snap.docs.map((d) => ({ id: d.id, data: d.data() }));

// What the app sees for a moved game, against what the backup holds.
const checkMoved = async () => {
  for (const id of ids) {
    const ref = db.collection('games').doc(id);
    const game = (await ref.get()).data()!;
    if (game.schemaVersion !== 2) {
      mismatches.push(`${id}: not moved`);
      continue;
    }
    const back = assembleGame(game, stored(await ref.collection('characters').get()), stored(await ref.collection('rolls').get()));
    if (!sameGame(back, backup[id]!)) mismatches.push(`${id}: moved game differs from the backup`);
  }
};

const outcomes = await migrateAll(db, { write: true, backup });
const bad = outcomes.filter((o) => o.status !== 'moved');
console.log(`Moved ${outcomes.length - bad.length} of ${outcomes.length} games.`);
bad.forEach((o) => mismatches.push(`${o.id}: ${o.status}`));
await checkMoved();
console.log(
  mismatches.length ? `After moving: ${mismatches.length} problems.` : 'After moving: every game reads back exactly as in the backup.',
);

for (const id of ids) {
  const outcome = await unmigrateGame(db, id);
  if (outcome.status !== 'put back') mismatches.push(`${id}: ${outcome.status} on the way back`);
  else if (!sameGame((await db.collection('games').doc(id).get()).data()!, backup[id]!))
    mismatches.push(`${id}: put back differs from the backup`);
  const left =
    (await db.collection('games').doc(id).collection('characters').get()).size +
    (await db.collection('games').doc(id).collection('rolls').get()).size;
  if (left) mismatches.push(`${id}: ${left} documents left in subcollections`);
}
console.log(mismatches.length ? 'After putting back: problems found.' : 'After putting back: every game equals the backup again.');

mismatches.slice(0, 20).forEach((m) => console.log(`  - ${m}`));
if (mismatches.length > 20) console.log(`  ...and ${mismatches.length - 20} more`);
process.exit(mismatches.length ? 1 : 0);
