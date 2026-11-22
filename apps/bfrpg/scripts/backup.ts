// Saves every character and game to ./firestore-backup-<timestamp>.json. Read-only: one read per document, in one pass.
// Everything after this (audit, rehearsal, dry run) works from the file and reads nothing.
import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from '@dice-jar/admin';
import type { Backup } from './migrateRun.ts';

const db = adminDb('demo-bfrpg');
const backup: Backup = {};
for (const kind of ['characters', 'games']) {
  const snapshot = await db.collectionGroup(kind).get();
  for (const d of snapshot.docs) {
    if (!d.ref.path.startsWith('users/')) continue; // only users/{uid}/characters and users/{uid}/games
    backup[d.ref.path] = { data: d.data(), created: d.createTime.toMillis(), updated: d.updateTime.toMillis() };
  }
  console.log(`  ${kind}: ${snapshot.size} documents read`);
}
const outPath = path.resolve(`./firestore-backup-${Date.now()}.json`);
fs.writeFileSync(outPath, JSON.stringify(backup, null, 2));
console.log(`Backed up ${Object.keys(backup).length} documents to ${outPath}`);
