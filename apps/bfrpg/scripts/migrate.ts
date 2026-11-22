// Brings stored characters and games to the current shape (schemaVersion 3). Without --write it only reports.
// Usage: npm run migrate -- --backup ./firestore-backup-<timestamp>.json [--write] [--only path,path] [--limit n] [--verify]
import * as fs from 'fs';
import { adminDb } from '@dice-jar/admin';
import { migrateAll, type Backup } from './migrateRun.ts';

const args = process.argv.slice(2);
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const write = args.includes('--write');
const backupFile = option('--backup');
const limit = option('--limit') === undefined ? undefined : Number(option('--limit'));
const only = option('--only')?.split(',').filter(Boolean);

if (!backupFile || !fs.existsSync(backupFile)) {
  console.error('Needs --backup <file>: a backup from `npm run backup`; every document is checked against it.');
  process.exit(1);
}
if (write && Date.now() - fs.statSync(backupFile).mtimeMs > 24 * 60 * 60 * 1000) {
  console.error('That backup is more than a day old. Take a fresh one with `npm run backup` and try again.');
  process.exit(1);
}
if (limit !== undefined && !(limit >= 1)) {
  console.error('--limit must be a number, 1 or more.');
  process.exit(1);
}

// Paths migrated by earlier runs of this backup are skipped without a read, so an interrupted or limited run costs nothing to resume.
const checkpoint = `${backupFile}.migrated.json`;
const done = new Set<string>(fs.existsSync(checkpoint) ? (JSON.parse(fs.readFileSync(checkpoint, 'utf8')) as string[]) : []);
const report = await migrateAll(() => adminDb('demo-bfrpg'), JSON.parse(fs.readFileSync(backupFile, 'utf8')) as Backup, {
  write,
  only,
  limit,
  done,
  verify: args.includes('--verify'),
  onMigrated: (p) => {
    done.add(p);
    fs.writeFileSync(checkpoint, JSON.stringify([...done]));
  },
});
console.log(
  `${write ? 'Migrated' : 'Would migrate'} ${report.migrated.length}; ${report.current.length} already current; ${report.left} left for another run.`,
);
for (const [p, reason] of report.refused) console.log(`  refused ${p}: ${reason}`);
for (const p of report.changedSinceBackup) console.log(`  changed since the backup, left alone: ${p}`);
