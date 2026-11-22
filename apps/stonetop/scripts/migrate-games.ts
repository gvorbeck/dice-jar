// Moves games from one document to subcollections (MIGRATION.md). Without --write it only reports what it would do.
// Usage: node scripts/migrate-games.ts --backup ./firestore-backup-<timestamp>.json [--write] [--only id,id] [--limit n]
import * as fs from 'fs';
import { adminDb } from '@dice-jar/admin';
import { gamesFromBackup } from './backupFile.ts';
import { migrateAll } from './migrateCore.ts';

const args = process.argv.slice(2);
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const write = args.includes('--write');
const backupFile = option('--backup');
const limit = option('--limit') === undefined ? undefined : Number(option('--limit'));
const only = option('--only')?.split(',').filter(Boolean);

const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000;
if (write && !backupFile) {
  console.error('Writing needs --backup <file>: a backup taken today, which every game is checked against.');
  process.exit(1);
}
if (backupFile && !fs.existsSync(backupFile)) {
  console.error(`File not found: ${backupFile}`);
  process.exit(1);
}
if (write && backupFile && Date.now() - fs.statSync(backupFile).mtimeMs > MAX_BACKUP_AGE_MS) {
  console.error('That backup is more than a day old. Take a fresh one with `npm run backup` and try again.');
  process.exit(1);
}
if (limit !== undefined && !(limit >= 1)) {
  console.error('--limit must be a number, 1 or more.');
  process.exit(1);
}

const backup = backupFile
  ? (gamesFromBackup(JSON.parse(fs.readFileSync(backupFile, 'utf8')) as Record<string, unknown>) as Record<string, Record<string, unknown>>)
  : undefined;

console.log(`Mode: ${write ? 'WRITE' : 'DRY RUN (pass --write to move games)'}\n`);
const started = Date.now();
const outcomes = await migrateAll(adminDb('demo-stonetop'), {
  write,
  backup,
  only,
  limit,
  onProgress: (done, total) => {
    if (done === 1 || done % 25 === 0 || done === total)
      console.log(`  ${done} / ${total} games, ${Math.round((Date.now() - started) / 1000)}s`);
  },
});

const tally = new Map<string, number>();
for (const o of outcomes) tally.set(o.status, (tally.get(o.status) ?? 0) + 1);
for (const o of outcomes) {
  if (o.status === 'refused') console.log(`REFUSED ${o.id}\n${o.problems.map((p) => `  - ${p}`).join('\n')}`);
  else if (o.status === 'failed') console.log(`FAILED ${o.id}: ${o.error}`);
  else if (o.status === 'changed since backup' || o.status === 'missing') console.log(`${o.status.toUpperCase()} ${o.id}`);
  else if (o.status === 'moved' && o.unverified) console.log(`WARNING ${o.id} moved, but ${o.unverified}`);
  else if (o.status === 'moved' && o.changedAfter)
    console.log(`NOTE ${o.id} moved, and a player saved right after: ${o.changedAfter.join(', ')}`);
}
console.log(`\n${outcomes.length} games: ${[...tally].map(([status, n]) => `${n} ${status}`).join(', ') || 'none'}.`);
if (tally.has('changed since backup'))
  console.log('Games changed since the backup were left alone. Take a fresh backup and run again to move them.');
const unverified = outcomes.some((o) => o.status === 'moved' && o.unverified);
process.exit(unverified || ['refused', 'failed', 'changed since backup', 'missing'].some((s) => tally.has(s)) ? 1 : 0);
